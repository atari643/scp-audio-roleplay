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
import { synthesize } from '../src/services/edgeTts';

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

export async function handleTtsRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

  // Un texte sans lettre ni chiffre fait échouer la synthèse. « . », « , » et « … » suffisent.
  // On refuse proprement plutôt que d'ouvrir une connexion pour rien.
  if (!/[\p{L}\p{N}]/u.test(text)) {
    refuser(400, 'Text has no speakable content');
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

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

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
