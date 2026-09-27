import type { SpeechSegment } from '../types/audioRoleplay';
import type { ModuleSignalsmith } from '../vendor/signalsmith-stretch/fabrique';

/**
 * Faire jouer plusieurs personnages à deux voix.
 *
 * Edge n'a que deux voix françaises natives de nouvelle génération, Rémy et Vivienne. Les
 * rôles étaient prêtés à des voix étrangères « Multilingual » (Andrew, Brian, Emma…), qui
 * devinent la langue de chaque phrase et basculent en anglais sur une phrase courte, un nom
 * ou un nombre — et le service refuse tout moyen de leur imposer le français (voir
 * `buildSsml`, `edgeTts.ts`). Le français est donc lu par Rémy et Vivienne seulement, et
 * chaque personnage devient une PERSONNE différente, comme un comédien change de voix :
 *
 *  - la hauteur (demi-tons), la note de la voix ;
 *  - les formants (demi-tons), les résonances du conduit vocal, c'est-à-dire la taille de la
 *    personne : plus bas, un corps plus grand ; plus haut, plus jeune, plus menu. C'est ce
 *    qui fait entendre QUELQU'UN D'AUTRE, et pas la même voix accélérée.
 *
 * Le traitement est celui de Signalsmith Stretch (licence MIT, `src/vendor/`), appliqué
 * après la synthèse, avant la lecture ; il tourne aussi sous Node. La durée ne change pas,
 * donc les frontières de mots — surlignage, bips de censure — restent justes.
 */

export interface Personne {
  id: string;
  nom: string;
  /** Hauteur, en demi-tons. */
  demiTons: number;
  /** Formants, en demi-tons : négatif = un corps plus grand. */
  formants: number;
}

/**
 * Les personnes tirées de Rémy. Validées à l'écoute (banc du 27/09/2026) ; « Rémy tel quel »
 * reste au narrateur, la « voix de gorge » aux anomalies.
 */
export const PERSONNES_HOMMES: readonly Personne[] = [
  { id: 'colosse', nom: 'Colosse', demiTons: -4, formants: -3 },
  { id: 'grave', nom: 'Grave et posé', demiTons: -2, formants: -1.5 },
  { id: 'age', nom: 'Âgé', demiTons: -1, formants: -2 },
  { id: 'sec', nom: 'Sec', demiTons: 1, formants: -0.5 },
  { id: 'jeune', nom: 'Jeune', demiTons: 2, formants: 1.5 },
  { id: 'nerveux', nom: 'Nerveux', demiTons: 3, formants: 1 },
  { id: 'gorge', nom: 'Voix de gorge', demiTons: -5, formants: -4 }
];

/**
 * Les personnes tirées de Vivienne. Elle est déjà grave (165 Hz mesurés) : la descendre de
 * trois demi-tons la faisait passer à 139 Hz, dans la zone des voix d'homme — aucune ne
 * descend donc de plus d'un demi-ton et demi.
 */
export const PERSONNES_FEMMES: readonly Personne[] = [
  { id: 'grave', nom: 'Grave', demiTons: -1.5, formants: -1 },
  { id: 'mure', nom: 'Mûre', demiTons: -0.5, formants: -0.8 },
  { id: 'froide', nom: 'Froide', demiTons: 0, formants: 1 },
  { id: 'jeune', nom: 'Jeune', demiTons: 2.5, formants: 1.5 },
  { id: 'claire', nom: 'Claire', demiTons: 3.5, formants: 1 }
];

/** Les branches dont les personnages sont joués ainsi : celles qui n'ont que deux voix natives. */
const BRANCHES_PAR_PERSONNES = new Set(['fr']);

/** Les voix natives d'une branche, par genre. */
export const VOIX_NATIVES: Record<string, { homme: string; femme: string }> = {
  fr: { homme: 'fr-FR-RemyMultilingualNeural', femme: 'fr-FR-VivienneMultilingualNeural' }
};

function hachage(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Le segment est-il dit par une voix de femme ? */
export function estFeminin(segment: SpeechSegment, voix?: string): boolean {
  return segment.gender === 'female' || /Vivienne/.test(voix ?? segment.voiceSignature?.voiceId ?? '');
}

/** La distribution d'un dossier : locuteur (en minuscules) → la personne qui le joue. */
export type Distribution = Map<string, Personne | null>;

function cleLocuteur(segment: SpeechSegment): string {
  return (segment.speaker || segment.role).toLowerCase().trim();
}

/** Ce segment est-il joué par une personne, ou par la voix de base telle quelle ? */
function joueParUnePersonne(segment: SpeechSegment, lang: string): boolean {
  if (!BRANCHES_PAR_PERSONNES.has(lang)) return false;
  // L'Archiviste et l'intercom restent Rémy et Vivienne tels quels : ce sont les voix qu'on
  // entend le plus, et le repère de l'oreille.
  if (segment.role === 'narrator' || segment.role === 'intercom') return false;
  // Une note sans signataire est dite par la voix d'annotation, pas par un personnage.
  if (segment.isFootnote && !segment.voiceSignature) return false;
  return true;
}

/**
 * Les personnes possibles pour un segment. Les anomalies prennent les voix les plus
 * larges ; les Classe-D, les plus tendues. La « voix de gorge » n'est jamais tirée d'office :
 * le moteur descend déjà l'anomalie de 18 Hz (`parametresVoix`), et les deux ensemble donnent
 * un monstre, pas un personnage — SCP-049 parle en médecin courtois, il doit rester crédible.
 */
function vivierDe(segment: SpeechSegment, voix?: string): readonly Personne[] {
  if (estFeminin(segment, voix)) return PERSONNES_FEMMES;
  if (segment.role === 'anomaly') return PERSONNES_HOMMES.filter(p => ['grave', 'colosse', 'age'].includes(p.id));
  if (segment.role === 'classD') return PERSONNES_HOMMES.filter(p => ['jeune', 'nerveux', 'sec'].includes(p.id));
  return PERSONNES_HOMMES.filter(p => p.id !== 'gorge');
}

/**
 * Distribue les personnes entre les personnages d'un dossier, dans leur ordre d'entrée.
 *
 * Chacun reçoit d'abord la personne que désigne son nom (un Dr Sherman tombe toujours sur la
 * même) ; si un autre personnage du dossier l'a déjà, il prend la suivante libre de son
 * vivier. Sans cela, deux interlocuteurs d'un même entretien pouvaient tirer la même voix,
 * et l'on n'entendait plus qui répondait à qui. Calculé sur le dossier ENTIER : un extrait
 * garde la distribution du dossier.
 */
export function distribuerPersonnes(
  segments: SpeechSegment[],
  lang: string,
  voixDe: (segment: SpeechSegment) => string | undefined
): Distribution {
  const distribution: Distribution = new Map();
  const prises = new Set<Personne>();
  for (const segment of segments) {
    const cle = cleLocuteur(segment);
    if (distribution.has(cle)) continue;
    if (!joueParUnePersonne(segment, lang)) {
      distribution.set(cle, null);
      continue;
    }
    const vivier = vivierDe(segment, voixDe(segment));
    const depart = hachage(cle) % vivier.length;
    let choisie = vivier[depart];
    for (let k = 0; k < vivier.length; k++) {
      const candidate = vivier[(depart + k) % vivier.length];
      if (!prises.has(candidate)) {
        choisie = candidate;
        break;
      }
    }
    prises.add(choisie);
    distribution.set(cle, choisie);
  }
  return distribution;
}

/**
 * Qui parle, pour l'oreille : la personne que joue Rémy ou Vivienne pour ce segment, ou
 * `null` si la voix reste telle quelle. Prend la distribution du dossier quand on la
 * connaît ; sinon, la personne que désigne le nom seul.
 */
export function personneDe(
  segment: SpeechSegment,
  lang: string,
  voix?: string,
  distribution?: Distribution
): Personne | null {
  if (!joueParUnePersonne(segment, lang)) return null;
  const cle = cleLocuteur(segment);
  if (distribution?.has(cle)) return distribution.get(cle) ?? null;
  const vivier = vivierDe(segment, voix);
  return vivier[hachage(cle) % vivier.length];
}

let moteur: Promise<ModuleSignalsmith> | null = null;

/**
 * Le moteur Signalsmith, chargé à la première demande (environ 110 Ko, WASM compris) :
 * une lecture anglaise ne le télécharge jamais.
 */
export function chargerMoteurTimbre(): Promise<ModuleSignalsmith> {
  moteur ??= import('../vendor/signalsmith-stretch/fabrique.js').then(m => m.default());
  return moteur;
}

/**
 * Fait parler `personne` à la place de la voix d'origine. Traitement hors ligne, par blocs ;
 * la latence du moteur est retirée, si bien que la sortie a exactement la durée de l'entrée.
 */
export function transformerTimbre(
  M: ModuleSignalsmith,
  signal: Float32Array,
  frequence: number,
  personne: Personne
): Float32Array {
  M._presetDefault(1, frequence);
  const latence = M._inputLatency() + M._outputLatency();
  const bloc = 256;
  const taille = Math.max(latence, bloc);
  const pointeur = M._setBuffers(1, taille);
  // La mémoire du WASM peut grandir, et changer d'objet : on la relit à chaque bloc.
  const memoire = () => (M.HEAPF32 ? M.HEAPF32.buffer : M.HEAP8.buffer);
  const total = signal.length + latence;
  const sortie = new Float32Array(total);

  for (let d = 0; d < total; d += bloc) {
    M._setTransposeSemitones(personne.demiTons, 8000 / frequence);
    // Formants compensés : sans cela, changer la hauteur les déplacerait aussi (la « voix de
    // souris ») ; on les règle ensuite séparément.
    M._setFormantSemitones(personne.formants, 1);
    M._setFormantBase(0);
    const n = Math.min(bloc, total - d);
    const entree = new Float32Array(memoire(), pointeur, n);
    entree.fill(0);
    if (d < signal.length) entree.set(signal.subarray(d, Math.min(d + n, signal.length)));
    M._process(n, n);
    sortie.set(new Float32Array(memoire(), pointeur + taille * 4, n), d);
  }
  return sortie.slice(latence);
}

/** Une frontière de mot, telle que le service la renvoie (secondes). */
export interface FrontiereMot {
  offset: number;
  duration: number;
  text: string;
}

/**
 * Silence entre l'annonce du locuteur et sa réplique, en secondes. Il s'ajoute à la courte
 * retombée qu'on garde après le dernier mot de l'annonce.
 */
export const SILENCE_APRES_ANNONCE = 0.3;

const simplifierMot = (mot: string) =>
  mot.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

/**
 * L'annonce du locuteur dite par l'Archiviste, un silence, puis la réplique par le
 * personnage.
 *
 * Deux synthèses du MÊME texte (« Le docteur Sherman : Guéri ? Guéri de quoi ? ») : l'une
 * par la voix du narrateur, dont on garde l'annonce, l'autre par celle du personnage, dont on
 * garde la réplique ; les frontières de mots disent où couper. Pourquoi ne pas synthétiser
 * l'annonce et la réplique séparément : seules, une réplique courte (« Guéri ? ») et une
 * annonce brève (« L'agent Smith. », « La docteure Lin. ») partent en anglais ou en espagnol
 * (Whisper, 27/09/2026) — ensemble, elles se donnent mutuellement leur ancrage français.
 *
 * Demandé à l'écoute : l'annonce collait à la réplique, on ne distinguait pas qui parlait.
 * Dite par une autre voix et suivie d'un vrai silence, elle se détache sans casser le rythme.
 *
 * @param annonce l'annonce telle qu'elle ouvre le texte prononcé (« Le docteur Sherman : »)
 * @returns `null` si les frontières ne concordent pas avec l'annonce — l'appelant garde alors
 *   la synthèse d'un seul tenant, qui reste juste.
 */
export function composerAnnonce(options: {
  voixOff: Float32Array;
  frontieresVoixOff: FrontiereMot[];
  replique: Float32Array;
  frontieresReplique: FrontiereMot[];
  annonce: string;
  frequence: number;
}): { signal: Float32Array; frontieres: FrontiereMot[] } | null {
  const { voixOff, frontieresVoixOff, replique, frontieresReplique, annonce, frequence } = options;
  const nOff = frontieresDeLAnnonce(frontieresVoixOff, annonce);
  const n = frontieresDeLAnnonce(frontieresReplique, annonce);
  if (nOff === null || n === null) return null;
  // La réplique doit commencer au même mot dans les deux synthèses.
  if (simplifierMot(frontieresVoixOff[nOff].text) !== simplifierMot(frontieresReplique[n].text)) return null;

  const finAnnonceMot = frontieresVoixOff[nOff - 1].offset + frontieresVoixOff[nOff - 1].duration;
  // Une courte retombée après le dernier mot de l'annonce, sans empiéter sur la suite.
  const finAnnonce = Math.min(finAnnonceMot + 0.06, frontieresVoixOff[nOff].offset);
  const finMotPrecedent = frontieresReplique[n - 1].offset + frontieresReplique[n - 1].duration;
  const debutReplique = Math.max(finMotPrecedent, frontieresReplique[n].offset - 0.04);

  const a = Math.round(finAnnonce * frequence);
  const s = Math.round(SILENCE_APRES_ANNONCE * frequence);
  const b = Math.round(debutReplique * frequence);
  const suite = replique.subarray(Math.min(b, replique.length));
  const signal = new Float32Array(a + s + suite.length);
  signal.set(voixOff.subarray(0, Math.min(a, voixOff.length)), 0);
  signal.set(suite, a + s);

  const decalage = finAnnonce + SILENCE_APRES_ANNONCE - debutReplique;
  const frontieres = frontieresReplique.slice(n).map(f => ({ ...f, offset: f.offset + decalage }));
  return { signal, frontieres };
}

/**
 * Combien de frontières de mots l'annonce occupe en tête, suivies d'au moins un mot de
 * réplique — `null` sinon. On compare les lettres mises bout à bout plutôt que de compter
 * les mots : le service peut couper « L’agent » ou « quarante-neuf » en deux frontières.
 */
function frontieresDeLAnnonce(frontieres: FrontiereMot[], annonce: string): number | null {
  const cible = simplifierMot(annonce);
  if (!cible) return null;
  let lu = '';
  for (let i = 0; i < frontieres.length - 1; i++) {
    lu += simplifierMot(frontieres[i].text);
    if (!cible.startsWith(lu)) return null;
    if (lu === cible) return i + 1;
  }
  return null;
}

/** Un WAV PCM 16 bits mono, pour rendre l'audio transformé à un `<audio>`. */
export function encoderWav(signal: Float32Array, frequence: number): Uint8Array {
  const donnees = signal.length * 2;
  const tampon = new ArrayBuffer(44 + donnees);
  const v = new DataView(tampon);
  const ecrire = (pos: number, texte: string) => {
    for (let i = 0; i < texte.length; i++) v.setUint8(pos + i, texte.charCodeAt(i));
  };
  ecrire(0, 'RIFF');
  v.setUint32(4, 36 + donnees, true);
  ecrire(8, 'WAVE');
  ecrire(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, frequence, true);
  v.setUint32(28, frequence * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, 'data');
  v.setUint32(40, donnees, true);
  for (let i = 0; i < signal.length; i++) {
    const s = Math.max(-1, Math.min(1, signal[i]));
    v.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Uint8Array(tampon);
}
