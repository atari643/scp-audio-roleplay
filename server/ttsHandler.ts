/**
 * Le point d'accès `/api/tts`, partagé par le serveur de dev et le serveur autonome.
 *
 * Il ne lance plus `python -m edge_tts` : il parle le protocole lui-même, via
 * `src/services/edgeTts.ts`. Trois conséquences directes :
 *
 *  · plus besoin de Python ni de `pip install edge-tts` sur la machine ;
 *  · le même code sert en `npm run dev` (middleware Vite) et en `npm run serve` (serveur
 *    autonome devant `dist/`), donc le TTS neural existe enfin ailleurs qu'en développement ;
 *  · les frontières de mots, que le service envoyait déjà et que le passage par le MP3 de
 *    Python jetait, peuvent être renvoyées au client.
 *
 * Le contrat de l'URL ne change pas — `?text=&voice=&rate=&pitch=&volume=` renvoie toujours
 * un `audio/mpeg`. `&boundaries=1` est le seul ajout : la réponse devient alors du JSON
 * `{ audio: <base64>, boundaries: [...] }`. Le base64 gonfle de 33 %, mais passer les
 * frontières par un en-tête risquerait de dépasser la taille maximale d'en-tête sur un
 * paragraphe un peu long.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
// Extension explicite : une fonction serverless est compilée en ESM, où un import
// relatif sans extension n'existe pas — le relais plantait au chargement avec
// « Cannot find module '/var/task/server/ttsHandler' ». esbuild, Vite et tsc
// résolvent « .js » vers le « .ts » voisin, donc rien ne change en local.
import { synthesize } from '../src/services/edgeTts.js';

/**
 * Remet le signe d'un paramètre de prosodie.
 *
 * Le décodage d'URL transforme « + » en espace : un `rate` envoyé « +20% » arrive « 20% »
 * ou « 20% » précédé d'une espace. Sans cette remise en forme, la valeur est rejetée par la
 * validation et la prosodie est silencieusement perdue.
 */
function normalizeSign(raw: string): string {
  let clean = raw.trim();
  if (!clean.startsWith('+') && !clean.startsWith('-')) clean = '+' + clean;
  return clean;
}

/**
 * Durcissements qui ne concernent QUE le relais public (`api/tts.ts`).
 *
 * Servi depuis la machine de l'utilisateur, ce point d'accès est déjà protégé par le fait
 * qu'il n'est joignable que par lui. Exposé sur Internet, il devient un service de synthèse
 * gratuit pour qui le découvre, payé sur le quota du propriétaire. D'où ces deux réglages —
 * et d'où le fait qu'ils soient **optionnels** : sans eux, le comportement local ne bouge
 * pas d'un octet.
 */
export interface OptionsTts {
  /**
   * Valeur à poser en `Access-Control-Allow-Origin`, ou `null` pour n'en poser aucune
   * (l'origine appelante n'est pas autorisée : le navigateur refusera la réponse).
   * Absent ⇒ `*`, le comportement historique.
   */
  origineCors?: string | null;
  /** Longueur maximale du texte accepté. Absent ⇒ aucune limite. */
  longueurMax?: number;
  /**
   * Durée de conservation par un réseau de diffusion, en secondes. Un même passage relu
   * ressort du cache sans réveiller la fonction : c'est ce qui rend le quota gratuit
   * difficile à atteindre.
   */
  cacheReseau?: number;
}

export async function handleTtsRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: OptionsTts = {}
): Promise<void> {
  const query = new URL(req.url || '', 'http://localhost').searchParams;

  const text = query.get('text') || '';
  const voice = query.get('voice') || 'fr-FR-RemyMultilingualNeural';
  const wantBoundaries = query.get('boundaries') === '1';

  const refuser = (code: number, message: string) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  };

  if (!text) {
    refuser(400, 'Text parameter is required');
    return;
  }

  // Mesuré sur dix dossiers et 1 413 segments : le plus long fait 903 caractères, aucun ne
  // dépasse 1 200. Un plafond très au-dessus ne gêne donc jamais la lecture d'un dossier,
  // mais empêche qu'on fasse lire un roman au relais.
  if (options.longueurMax !== undefined && text.length > options.longueurMax) {
    refuser(413, `Text too long (max ${options.longueurMax} characters)`);
    return;
  }

  // Un texte sans lettre ni chiffre fait échouer la synthèse. « . », « , » et « … » suffisent.
  // On refuse proprement plutôt que d'ouvrir une connexion pour rien.
  if (!/[\p{L}\p{N}]/u.test(text)) {
    refuser(400, 'Text has no speakable content');
    return;
  }

  // La voix est posée dans un attribut du SSML. Sans ce contrôle, une apostrophe en
  // sortait et permettait d'injecter des blocs `<voice>` entiers — et comme seul
  // `text` est plafonné, on pouvait loger dans `voice` un texte de longueur
  // arbitraire à synthétiser, aux frais du quota. `edgeTts.buildSsml()` replie
  // silencieusement sur la voix par défaut ; ici on refuse, parce que c'est cette
  // couche-là qui protège le quota et qu'une requête forgée n'a pas à être servie.
  if (!/^[A-Za-z0-9-]{1,64}$/.test(voice)) {
    refuser(400, 'Invalid voice name');
    return;
  }

  const rate = normalizeSign(query.get('rate') || '+0%');
  const pitch = normalizeSign(query.get('pitch') || '+0Hz');
  const volume = normalizeSign(query.get('volume') || '+0%');

  try {
    const { audio, boundaries } = await synthesize({
      text,
      voice,
      rate: /^[+-]\d+%$/.test(rate) ? rate : '+0%',
      pitch: /^[+-]\d+Hz$/.test(pitch) ? pitch : '+0Hz',
      volume: /^[+-]\d+%$/.test(volume) ? volume : '+0%',
      wordBoundaries: wantBoundaries
    });

    // `max-age` pour le navigateur, `s-maxage` pour le réseau de diffusion devant la
    // fonction : la même phrase, dans la même voix, ne se resynthétise pas.
    res.setHeader(
      'Cache-Control',
      options.cacheReseau
        ? `public, max-age=86400, s-maxage=${options.cacheReseau}, stale-while-revalidate=86400`
        : 'public, max-age=86400'
    );

    const origine = options.origineCors === undefined ? '*' : options.origineCors;
    if (origine !== null) {
      res.setHeader('Access-Control-Allow-Origin', origine);
      // L'en-tête varie selon l'origine appelante : sans ce `Vary`, un cache partagé
      // resservirait à un site la réponse autorisée pour un autre.
      if (origine !== '*') res.setHeader('Vary', 'Origin');
    }

    if (wantBoundaries) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ audio: Buffer.from(audio).toString('base64'), boundaries }));
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.end(Buffer.from(audio));
  } catch (err) {
    // L'ancienne version posait les en-têtes AVANT de lancer Python : un échec après les
    // premiers octets laissait passer un MP3 tronqué avec un statut 200. Ici la synthèse
    // est terminée avant qu'on écrive quoi que ce soit, donc l'erreur est franche.
    console.error('[TTS]', err instanceof Error ? err.message : err);
    refuser(502, 'TTS generation failed');
  }
}
