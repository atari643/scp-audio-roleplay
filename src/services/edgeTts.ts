/**
 * Client edge-tts natif — le service de lecture de Microsoft Edge, parlé directement.
 *
 * POURQUOI CE FICHIER EXISTE. Le TTS neural passait par `/api/tts`, un middleware Vite qui
 * lançait `python -m edge_tts`. Deux conséquences que ce module supprime :
 *
 *  1. Le middleware n'existe QUE en `npm run dev`. Dans `dist/` — donc sur le web et dans
 *     l'APK Android (Capacitor sert la WebView depuis https://localhost) — l'URL répondait
 *     404, trois échecs faisaient basculer `neuralUnavailable`, et l'application parlait
 *     avec la voix par défaut de l'appareil. Tout le travail sur les voix, la prononciation
 *     et les pauses était invisible dans l'application livrée.
 *  2. Il fallait Python et `pip install edge-tts` sur la machine.
 *
 * Le service est un simple WebSocket, sans clé d'API. CE QUI FILTRE, mesuré par poignée de
 * main TLS manuelle sur le vrai service :
 *
 *   Origin (chrome-extension, https://localhost, un domaine web, aucune)  →  101, toutes
 *   Sec-CH-UA de Chrome                                                   →  101
 *   User-Agent Edge (« Edg/… »)                                           →  101
 *   User-Agent Chrome, WebView Android, Firefox, ou absent                →  403
 *
 * L'origine n'a donc aucune importance, et l'User-Agent fait tout. Un navigateur ne peut
 * falsifier ni l'un ni l'autre sur un WebSocket : Chrome et Firefox sont exclus, seul un
 * contexte qui annonce déjà « Edg/ » passe — Edge lui-même, et la WebView Capacitor dont
 * `capacitor.config.ts` force l'User-Agent. Node, lui, accepte un second argument non
 * standard `{ headers }` (vérifié sur Node 22), ce qui permet de servir `/api/tts` sans
 * Python et sans ajouter de dépendance.
 *
 * D'où `canSynthesizeDirectly()` : le client va au service en direct quand il le peut, et
 * repasse par `/api/tts` sinon.
 *
 * BÉNÉFICE COLLATÉRAL : les frontières de mots. Le service les envoie dans le même flux
 * (`Path:audio.metadata`), à condition de les demander dans `speech.config`. Python les
 * jetait puisque le middleware ne renvoyait que le MP3. On les récupère ici, et elles
 * servent au surlignage synchronisé et au placement du bip de censure.
 *
 * Ce module ne dépend que de `WebSocket`, présent aussi bien dans le navigateur que dans
 * Node 22 : `vite.config.ts` s'en sert pour servir `/api/tts` sans Python.
 */

const BASE_URL = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

/** Version de Chromium annoncée au service, alignée sur celle d'edge-tts 7.2.8. */
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

/**
 * Le flux est du MP3 à débit constant de 48 kbit/s. Cette constante convertit un nombre
 * d'octets en durée — c'est ce qui permet de décaler les frontières de mots quand un texte
 * long a dû être découpé en plusieurs requêtes.
 */
const MP3_BYTES_PER_SECOND = 48_000 / 8;

/**
 * Taille maximale d'un texte envoyé en une fois.
 *
 * Le service ferme la connexion au-delà d'une certaine taille de message. Les segments du
 * parseur sont plafonnés à ~320 caractères, donc ce découpage ne sert jamais en pratique ;
 * il est là pour qu'un appel direct au module ne casse pas silencieusement.
 */
const MAX_CHUNK_BYTES = 2000;

/**
 * Le seul en-tête qui compte. Le service répond 403 à tout ce qui ne se présente pas comme
 * Microsoft Edge — c'est la raison d'être de tout le dispositif ci-dessous.
 */
export const EDGE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' +
  ` Chrome/${CHROMIUM_FULL_VERSION.split('.')[0]}.0.0.0 Safari/537.36` +
  ` Edg/${CHROMIUM_FULL_VERSION.split('.')[0]}.0.0.0`;

const IS_NODE =
  typeof process !== 'undefined' && !!(process as { versions?: { node?: string } }).versions?.node;

/**
 * Peut-on joindre le service sans passer par `/api/tts` ?
 *
 * Vrai dans Node (on y pose l'en-tête nous-mêmes) et dans un navigateur qui annonce déjà
 * « Edg/ » — Edge, ou la WebView Android dont l'User-Agent est forcé dans
 * `capacitor.config.ts`. Faux dans Chrome et Firefox, où le service répond 403.
 */
export function canSynthesizeDirectly(): boolean {
  if (IS_NODE) return true;
  return typeof navigator !== 'undefined' && /\bEdg\//.test(navigator.userAgent);
}

/**
 * Ouvre la connexion.
 *
 * Node accepte `new WebSocket(url, { headers })`, extension non standard mais bien réelle ;
 * le navigateur prendrait ce second argument pour une liste de sous-protocoles et lèverait
 * une erreur. D'où la séparation.
 */
function openSocket(url: string): WebSocket {
  if (IS_NODE) {
    const NodeWebSocket = WebSocket as unknown as new (u: string, o: unknown) => WebSocket;
    return new NodeWebSocket(url, {
      headers: {
        'User-Agent': EDGE_USER_AGENT,
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
  }
  return new WebSocket(url);
}

export interface WordBoundary {
  /** Début du mot dans l'audio, en secondes. */
  offset: number;
  /** Durée du mot, en secondes. */
  duration: number;
  /** Le mot tel que le service l'a découpé. */
  text: string;
}

export interface SynthesisResult {
  audio: Uint8Array;
  /** Vide si `wordBoundaries` n'a pas été demandé. */
  boundaries: WordBoundary[];
}

export interface SynthesisOptions {
  text: string;
  voice: string;
  /** Format edge-tts : « +10% », « -8% ». */
  rate?: string;
  /** Format edge-tts : « +15Hz », « -18Hz ». */
  pitch?: string;
  /** Format edge-tts : « +12% ». */
  volume?: string;
  /** Demander les frontières de mots. Coût nul côté service, quelques Ko de métadonnées. */
  wordBoundaries?: boolean;
  /** Délai maximal d'une synthèse, en millisecondes. */
  timeoutMs?: number;
}

export class EdgeTtsError extends Error {}

/** Les métadonnées du service comptent en intervalles de 100 ns. */
const TICKS_PER_SECOND = 10_000_000;

/**
 * Jeton `Sec-MS-GEC` : SHA-256 de l'horodatage Windows arrondi à 5 minutes, concaténé au
 * jeton client public. Sans lui le service refuse la connexion.
 *
 * L'arrondi à 5 minutes est ce qui rend le jeton valable un moment ; une horloge locale
 * décalée de plus de 5 minutes fait échouer la connexion, et c'est la première chose à
 * soupçonner si tout tombe en panne d'un coup sur une seule machine.
 */
async function generateSecMsGec(): Promise<string> {
  let ticks = Date.now() / 1000 + 11_644_473_600;
  ticks -= ticks % 300;
  ticks *= 1e9 / 100;

  const data = new TextEncoder().encode(`${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function connectId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/** Format de date que le service attend, celui de `Date.prototype.toString` en JavaScript. */
function dateToString(): string {
  const jours = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mois = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${jours[d.getUTCDay()]} ${mois[d.getUTCMonth()]} ${p(d.getUTCDate())} ${d.getUTCFullYear()}` +
    ` ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}` +
    ' GMT+0000 (Coordinated Universal Time)'
  );
}

/**
 * Le service rejette certaines plages de caractères de contrôle — la tabulation verticale
 * surtout, fréquente dans du texte recopié. On les remplace par une espace.
 */
function removeIncompatibleCharacters(text: string): string {
  let out = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const interdit = (code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31);
    out += interdit ? ' ' : char;
  }
  return out;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Découpe un texte trop long sur la dernière espace avant la limite.
 *
 * Ne sert qu'aux appels directs au module : les segments du parseur tiennent largement en
 * dessous de `MAX_CHUNK_BYTES`.
 */
function splitForService(text: string): string[] {
  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= MAX_CHUNK_BYTES) return [text];

  const morceaux: string[] = [];
  let reste = text;
  while (encoder.encode(reste).length > MAX_CHUNK_BYTES) {
    let coupe = reste.length;
    while (coupe > 0 && encoder.encode(reste.slice(0, coupe)).length > MAX_CHUNK_BYTES) {
      coupe = Math.floor(coupe * 0.9);
    }
    const espace = reste.lastIndexOf(' ', coupe);
    const fin = espace > MAX_CHUNK_BYTES / 4 ? espace : coupe;
    morceaux.push(reste.slice(0, fin).trim());
    reste = reste.slice(fin);
  }
  if (reste.trim()) morceaux.push(reste.trim());
  return morceaux.filter(Boolean);
}

/**
 * Voix de repli quand le nom fourni n'a pas la forme d'un nom de voix.
 *
 * Volontairement la même que celle du point d'accès (`server/ttsHandler.ts`) : les
 * deux couches se comportent pareil, par construction.
 */
const VOIX_PAR_DEFAUT = 'fr-FR-RemyMultilingualNeural';

/**
 * Le nom d'une voix, réduit à ce qu'un nom de voix peut contenir.
 *
 * `buildSsml` interpole cette valeur dans un attribut XML entre apostrophes. Le
 * texte, lui, passe par `escapeXml` — mais la voix ne le faisait pas, et une
 * apostrophe suffisait à sortir de l'attribut pour injecter des blocs `<voice>`
 * entiers. Sur le relais public, où seul `text` est plafonné, cela revenait à
 * faire synthétiser un texte de longueur arbitraire logé dans `voice`, aux frais
 * du quota : exactement ce que le plafond de `api/tts.ts` existe pour empêcher.
 *
 * Le catalogue va de `en-US-AvaNeural` à `de-DE-SeraphinaMultilingualNeural`,
 * 33 caractères au plus long. Lettres, chiffres et tirets couvrent donc tout, et
 * excluent apostrophe, chevrons et espace — toute évasion d'attribut.
 *
 * On replie plutôt qu'on ne lève : cette fonction sert aussi la synthèse directe
 * depuis le navigateur (Edge, WebView Android), où une exception couperait la
 * lecture au lieu de la dégrader. Le refus franc, lui, est le travail du point
 * d'accès, qui répond `400`.
 */
function voixSure(voice: string | undefined): string {
  return voice && /^[A-Za-z0-9-]{1,64}$/.test(voice) ? voice : VOIX_PAR_DEFAUT;
}

/**
 * Une valeur de prosodie, ou son défaut.
 *
 * Même raison que `voixSure` : ces trois-là sont eux aussi posés dans des
 * attributs. Le point d'accès les valide déjà, mais pas les appels directs au
 * module — Edge et la WebView Android joignent le service sans passer par lui.
 * Valider ici ferme la construction du SSML pour **tous** les appelants, présents
 * et à venir.
 */
function prosodieSure(valeur: string | undefined, motif: RegExp, defaut: string): string {
  return valeur && motif.test(valeur) ? valeur : defaut;
}

function buildSsml(text: string, o: SynthesisOptions): string {
  const pitch = prosodieSure(o.pitch, /^[+-]\d{1,3}Hz$/, '+0Hz');
  const rate = prosodieSure(o.rate, /^[+-]\d{1,3}%$/, '+0%');
  const volume = prosodieSure(o.volume, /^[+-]\d{1,3}%$/, '+0%');

  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
    `<voice name='${voixSure(o.voice)}'>` +
    `<prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>` +
    escapeXml(removeIncompatibleCharacters(text)) +
    '</prosody></voice></speak>'
  );
}

/** Découpe l'en-tête textuel d'un message du service (« Clé:valeur » séparés par CRLF). */
function parseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const ligne of raw.split('\r\n')) {
    const sep = ligne.indexOf(':');
    if (sep > 0) headers[ligne.slice(0, sep)] = ligne.slice(sep + 1);
  }
  return headers;
}

/**
 * Synthétise un texte et renvoie le MP3 accompagné, si demandé, des frontières de mots.
 *
 * Une seule connexion sert tous les morceaux d'un texte long : `speech.config` n'est envoyé
 * qu'une fois, puis un `ssml` par morceau, chacun clos par `turn.end`.
 */
export async function synthesize(options: SynthesisOptions): Promise<SynthesisResult> {
  const morceaux = splitForService(options.text);
  if (morceaux.length === 0) {
    throw new EdgeTtsError('Aucun texte à synthétiser.');
  }

  const url =
    `${WSS_URL}&ConnectionId=${connectId()}` +
    `&Sec-MS-GEC=${await generateSecMsGec()}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  const ws = openSocket(url);
  ws.binaryType = 'arraybuffer';

  const chunks: Uint8Array[] = [];
  const boundaries: WordBoundary[] = [];
  const decoder = new TextDecoder();
  // Décalage à ajouter aux frontières du morceau courant : la durée de tout ce qui précède,
  // déduite du nombre d'octets déjà reçus (débit constant, donc conversion exacte).
  let octetsPrecedents = 0;

  return new Promise<SynthesisResult>((resolve, reject) => {
    let index = 0;
    let termine = false;

    const timeout = setTimeout(() => {
      echec(new EdgeTtsError('Délai dépassé pour la synthèse edge-tts.'));
    }, options.timeoutMs ?? 20_000);

    const fermer = () => {
      clearTimeout(timeout);
      try {
        ws.close();
      } catch {
        /* la connexion est peut-être déjà tombée */
      }
    };

    const echec = (err: Error) => {
      if (termine) return;
      termine = true;
      fermer();
      reject(err);
    };

    const reussir = () => {
      if (termine) return;
      termine = true;
      fermer();
      const total = chunks.reduce((n, c) => n + c.length, 0);
      if (total === 0) {
        reject(new EdgeTtsError('Le service n’a renvoyé aucun audio.'));
        return;
      }
      const audio = new Uint8Array(total);
      let pos = 0;
      for (const c of chunks) {
        audio.set(c, pos);
        pos += c.length;
      }
      resolve({ audio, boundaries });
    };

    const envoyerMorceau = () => {
      const ssml = buildSsml(morceaux[index], options);
      ws.send(
        `X-RequestId:${connectId()}\r\n` +
          'Content-Type:application/ssml+xml\r\n' +
          `X-Timestamp:${dateToString()}Z\r\n` + // le Z en trop est une bizarrerie du service
          'Path:ssml\r\n\r\n' +
          ssml
      );
    };

    ws.onopen = () => {
      const wd = options.wordBoundaries ? 'true' : 'false';
      const sq = options.wordBoundaries ? 'false' : 'true';
      ws.send(
        `X-Timestamp:${dateToString()}\r\n` +
          'Content-Type:application/json; charset=utf-8\r\n' +
          'Path:speech.config\r\n\r\n' +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
          `"sentenceBoundaryEnabled":"${sq}","wordBoundaryEnabled":"${wd}"},` +
          '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
      );
      envoyerMorceau();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (termine) return;

      if (typeof event.data === 'string') {
        const sep = event.data.indexOf('\r\n\r\n');
        const headers = parseHeaders(event.data.slice(0, sep));
        const corps = event.data.slice(sep + 4);

        if (headers.Path === 'audio.metadata') {
          try {
            for (const meta of JSON.parse(corps).Metadata || []) {
              if (meta.Type !== 'WordBoundary' && meta.Type !== 'SentenceBoundary') continue;
              boundaries.push({
                offset: meta.Data.Offset / TICKS_PER_SECOND + octetsPrecedents / MP3_BYTES_PER_SECOND,
                duration: meta.Data.Duration / TICKS_PER_SECOND,
                text: unescapeXml(meta.Data.text.Text)
              });
            }
          } catch {
            /* des métadonnées illisibles ne doivent pas faire échouer l'audio */
          }
        } else if (headers.Path === 'turn.end') {
          index++;
          if (index < morceaux.length) {
            octetsPrecedents = chunks.reduce((n, c) => n + c.length, 0);
            envoyerMorceau();
          } else {
            reussir();
          }
        }
        return;
      }

      // Message binaire : [2 octets = longueur d'en-tête][en-têtes][MP3]
      const buf = new Uint8Array(event.data as ArrayBuffer);
      if (buf.length < 2) return;
      const headerLength = (buf[0] << 8) | buf[1];
      if (headerLength + 2 > buf.length) return;
      const headers = parseHeaders(decoder.decode(buf.subarray(2, 2 + headerLength)));
      if (headers.Path !== 'audio') return;
      const payload = buf.subarray(2 + headerLength);
      if (payload.length > 0) chunks.push(new Uint8Array(payload));
    };

    ws.onerror = () => {
      echec(new EdgeTtsError('Connexion au service edge-tts impossible.'));
    };

    ws.onclose = () => {
      // Une fermeture avant `turn.end` avec de l'audio déjà reçu reste exploitable ; sans
      // audio, c'est un échec franc.
      if (termine) return;
      if (chunks.length > 0) reussir();
      else echec(new EdgeTtsError('Connexion edge-tts fermée avant toute réception.'));
    };
  });
}
