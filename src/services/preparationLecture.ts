import { CharacterRole, SpeechSegment, VoiceProfile } from '../types/audioRoleplay';
import { DEFAULT_AI_ROLES_EN, DEFAULT_AI_ROLES_FR, NEURAL_VOICES_BY_LANG } from '../types/neuralVoices';
import {
  acronymPattern,
  censoredSpokenWord,
  glossaryFor,
  hasSpeakableContent,
  normalizeForSpeech
} from './speechText';
import { stageEffectFor } from './speechLexicon';
import type { WordBoundary } from './edgeTts';
import { VOIX_NATIVES } from './timbres';

/**
 * Ce qui décide de la façon dont un dossier SONNE : texte prononcé, voix, prosodie,
 * silences, caviardages.
 *
 * Tout vivait en méthodes privées de `SpeechEngine`, un singleton du navigateur (Audio,
 * `speechSynthesis`, IndexedDB) qu'on ne peut pas charger sous Node. D'où ce module sans état
 * ni dépendance au navigateur : le moteur l'appelle, et un script Node peut produire
 * exactement le même audio que l'application.
 *
 * Toute règle sur le son d'un dossier va donc ici, pas dans le moteur.
 */

/**
 * Silence entre deux segments, en millisecondes.
 *
 * edge-tts n'accepte aucun SSML : impossible de demander une pause au moteur. Le seul
 * levier interne au texte est la ponctuation, et il est faible — passer d'une virgule à
 * un point n'achète que 0,36 s, mesuré. Une vraie respiration ne peut donc venir que d'ici,
 * entre deux éléments audio.
 *
 * Sans ce délai, `onended` enchaînait immédiatement : un titre de section, un changement
 * d'interlocuteur et une phrase de corps se collaient, et les bruitages de transition
 * (intercom, friture radio) se superposaient aux premiers mots au lieu de les précéder.
 */
export const PAUSES = {
  /** Même locuteur, suite du récit : juste de quoi ne pas coller les phrases. */
  suite: 120,
  /** Quelqu'un d'autre prend la parole. */
  locuteur: 350,
  /** Autour d'un titre de section : c'est ce qui rend la structure du dossier audible. */
  titre: 500,
  /** Ouverture ou fermeture de journal — le bruitage d'intercom a besoin de la place. */
  journal: 600,
  /** Une note de bas de page s'insère dans le corps ; il faut l'en détacher. */
  note: 300
} as const;

/**
 * Combien de silence avant `suiv` ?
 *
 * On regarde les deux segments : le titre qu'on quitte compte autant que celui qu'on
 * aborde, sinon une section s'ouvrirait sans respiration après son propre intitulé.
 */
export function pauseAvant(prec: SpeechSegment | null, suiv: SpeechSegment): number {
  // « (Pause) », « (soupir) », « (rit) » : l'auteur demande explicitement du temps. On
  // l'ajoute à la transition plutôt que de le remplacer, sinon un « (Pause) » entre deux
  // interlocuteurs raccourcirait le silence au lieu de l'allonger. « (L'interrompt) », lui,
  // en retire : jamais sous zéro.
  const didascalie = stageEffectFor(suiv.stageDirections).pause ?? 0;
  const base = !prec
    ? 0
    : prec.isLogMarker || suiv.isLogMarker
      ? PAUSES.journal
      : prec.isHeader || suiv.isHeader
        ? PAUSES.titre
        : suiv.isFootnote || prec.isFootnote
          ? PAUSES.note
          : prec.speaker !== suiv.speaker
            ? PAUSES.locuteur
            : PAUSES.suite;
  return Math.max(0, base + didascalie);
}

/**
 * La voix neurale de chaque rôle pour une branche, ou `null` si le catalogue n'a aucune
 * voix pour elle — l'appelant garde alors les assignations qu'il avait.
 */
export function assignationsParDefaut(lang: string): Record<CharacterRole, string> | null {
  if (lang === 'en') return { ...DEFAULT_AI_ROLES_EN };
  if (lang === 'fr') return { ...DEFAULT_AI_ROLES_FR };

  const voices = NEURAL_VOICES_BY_LANG[lang];
  if (!voices || voices.length === 0) return null;

  const defaultVoice = voices[0].id;
  const assigned: Record<string, string> = {};
  const roles: CharacterRole[] = ['narrator', 'researcher', 'anomaly', 'classD', 'agent', 'commander', 'intercom'];
  roles.forEach((r, idx) => {
    assigned[r] = voices[idx % voices.length].id || defaultVoice;
  });
  return assigned as Record<CharacterRole, string>;
}

/**
 * Ce qui dépend du dossier ENTIER et non du seul segment : qui s'annonce, et où chaque
 * sigle est développé.
 *
 * Calculé une fois par dossier, jamais au fil de la lecture : le préchargement synthétise
 * trois segments d'avance et appelle `texteDit` hors du flux de lecture — un contexte
 * calculé à la volée y serait périmé et rendrait la clé de cache instable.
 */
export interface ContexteLecture {
  /**
   * Segment id → annonce orale du locuteur (« L'Œil qui Voit : »), à insérer dans le texte
   * PRONONCÉ du premier segment de chaque prise de parole. Deux voix différentes ne disent
   * pas qui elles sont : à l'écran le badge du locuteur suffit, à l'oreille il n'existe pas.
   */
  annonces: Map<number, string>;
  /** Segment id → sigles à développer à cet endroit, leur première apparition. */
  premieresMentions: Map<number, Set<string>>;
}

/**
 * Le premier segment de chaque prise de parole d'un personnage reçoit « Nom : » — les
 * suivants du même locuteur non. Narrateur et intercom sont exclus : l'Archiviste se
 * présente assez, et annoncer chaque paragraphe « Archiviste : » noierait le dossier.
 * Les segments structurels (en-têtes, bornes de journal, notes) aussi : ils ont leur
 * propre traitement ou leur badge.
 */
export function annoncesLocuteur(segments: SpeechSegment[], lang: string): Map<number, string> {
  const annonces = new Map<number, string>();
  let dernierLocuteur = '';
  for (const segment of segments) {
    if (segment.isHeader || segment.isLogMarker || segment.isFootnote) continue;
    if (segment.role === 'narrator' || segment.role === 'intercom') continue;
    if (!segment.speaker) continue;
    if (segment.speaker !== dernierLocuteur) {
      annonces.set(segment.id, lang === 'fr' ? annonceFrancaise(segment.speaker) : `${segment.speaker}:`);
      dernierLocuteur = segment.speaker;
    }
  }
  return annonces;
}

/**
 * Les titres qui ouvrent un nom de locuteur, et la façon de les dire en français, article
 * compris.
 */
const TITRES_FR: [RegExp, string][] = [
  [/^(?:Dre|Docteure)\.?\s+/iu, 'La docteure '],
  [/^(?:Dr|Docteur)\.?\s+/iu, 'Le docteur '],
  [/^(?:Pre|Professeure)\.?\s+/iu, 'La professeure '],
  [/^(?:Pr|Prof|Professeur)\.?\s+/iu, 'Le professeur '],
  [/^Directrice\s+/iu, 'La directrice '],
  [/^(?:Dir|Directeur)\.?\s+/iu, 'Le directeur '],
  [/^Chercheuse\s+/iu, 'La chercheuse '],
  [/^Chercheur\s+/iu, 'Le chercheur '],
  [/^Agente\s+/iu, 'L’agente '],
  [/^Agent\s+/iu, 'L’agent '],
  [/^(?:Mme|Madame)\.?\s+/iu, 'Madame '],
  [/^(?:M\.|Monsieur)\s+/iu, 'Monsieur '],
  [/^(Sergent|Capitaine|Lieutenant|Colonel|Commandant|Général|Caporal|Major)e?\s+/iu, 'Le $1 ']
];

/**
 * L'annonce d'un locuteur, dite en français : « Dr Sherman » → « Le docteur Sherman : »,
 * « SCP-049 » → « SCP zéro quarante-neuf : ».
 *
 * Mesuré le 27/09/2026, Whisper sur Rémy et Vivienne : les voix multilingues devinent la
 * langue de la phrase entière, et « Dr Sherman : Guéri ? Guéri de quoi ? » était lu EN
 * ANGLAIS (« Gary ? », 76 %) — un nom anglais en tête, suivi d'une réplique courte, suffit
 * à faire basculer. « Le docteur Sherman : Guéri ? Guéri de quoi ? » est lu en français à
 * 99 %. L'article et le titre en toutes lettres donnent à la phrase l'ancrage français que
 * la réplique, trop courte, n'a pas. Et l'annonce passe par la normalisation, comme le
 * reste : un « SCP-049 » brut y aurait gardé son tiret et ses chiffres.
 */
function annonceFrancaise(locuteur: string): string {
  let nom = locuteur.trim();
  for (const [motif, remplacement] of TITRES_FR) {
    if (motif.test(nom)) {
      nom = nom.replace(motif, remplacement);
      // « Le Sergent » → « Le sergent » : le titre redevient un nom commun.
      nom = nom.replace(/^(Le|La) (\p{Lu})/u, (_, article: string, lettre: string) => `${article} ${lettre.toLowerCase()}`);
      break;
    }
  }
  return `${normalizeForSpeech(nom, 'fr')} :`;
}

/**
 * Repère, pour chaque sigle du glossaire, le segment où il apparaît en premier.
 *
 * Parcours dans l'ordre de lecture : le premier segment qui contient le sigle le
 * développera, tous les autres le laisseront abrégé.
 */
export function premieresMentions(segments: SpeechSegment[], lang: string): Map<number, Set<string>> {
  const mentions = new Map<number, Set<string>>();
  const glossaire = glossaryFor(lang);
  const restants = new Set(Object.keys(glossaire));

  for (const segment of segments) {
    if (restants.size === 0) break;
    for (const sigle of restants) {
      if (!acronymPattern(sigle).test(segment.text)) continue;
      const deja = mentions.get(segment.id);
      if (deja) deja.add(sigle);
      else mentions.set(segment.id, new Set([sigle]));
      restants.delete(sigle);
    }
  }
  return mentions;
}

export function preparerContexte(segments: SpeechSegment[], lang: string): ContexteLecture {
  return {
    annonces: annoncesLocuteur(segments, lang),
    premieresMentions: premieresMentions(segments, lang)
  };
}

/**
 * Le texte réellement prononcé. Distinct de `segment.text`, qui reste ce qui est AFFICHÉ :
 * les crochets, les capitales de style et les marqueurs « (s) » se lisent mal à voix haute.
 */
export function texteDit(segment: SpeechSegment, lang: string, contexte: ContexteLecture): string {
  const normalized = normalizeForSpeech(segment.text, lang, {
    expandAcronyms: contexte.premieresMentions.get(segment.id)
  });
  // La normalisation peut réduire un segment à de la ponctuation (« ... » → « … »,
  // « — » → « , »). edge-tts refuse ce genre d'entrée avec NoAudioReceived, donc on
  // revient au texte d'origine dès qu'il ne reste plus rien de prononçable.
  const spoken = hasSpeakableContent(normalized) ? normalized : segment.text;

  // Une note de bas de page est annoncée à voix haute. Sans ça, elle s'enchaîne au
  // paragraphe précédent et on ne distingue plus l'annotation du corps du dossier —
  // à l'écran le badge du locuteur suffit, à l'oreille il n'existe pas.
  if (segment.isFootnote) {
    const prefix = lang === 'en' ? 'Note:' : 'Note :';
    // Ne pas doubler l'annonce si le texte de la note commence déjà par « Note ».
    if (!/^\s*(?:note|footnote)\b/i.test(spoken)) {
      return `${prefix} ${spoken}`;
    }
  }

  const annonce = contexte.annonces.get(segment.id);
  if (annonce && !spoken.startsWith(annonce)) {
    return `${annonce} ${spoken}`;
  }

  return spoken;
}

/** Un pourcentage au format attendu par edge-tts (« +10% », « -8% »). */
export function versPourcentage(ratio: number): string {
  const pct = Math.round((ratio - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Le wiki écrit ses avertissements en capitales.
 *
 * `softenUppercaseRun` les remet en casse de phrase avant la synthèse — nécessaire, sinon
 * le repli navigateur épelle — mais ce faisant il efface l'intention. Le cri redevient une
 * phrase ordinaire. On la récupère ici, où elle s'exprime en volume et en débit plutôt
 * qu'en typographie. La détection se fait sur `segment.text`, l'original, pas sur le texte
 * normalisé qui n'a justement plus de capitales.
 */
export function estCrie(segment: SpeechSegment): boolean {
  const lettres = segment.text.replace(/[^\p{L}]/gu, '');
  if (lettres.length < 12) return false;
  const capitales = segment.text.replace(/[^\p{Lu}]/gu, '');
  return capitales.length / lettres.length >= 0.9;
}

export interface ParametresVoix {
  voice: string;
  pitch: string;
  rate: string;
  volume: string;
}

/** Ce que les réglages d'un rôle apportent à la prosodie. */
export type ProfilProsodie = Pick<VoiceProfile, 'pitch' | 'rate'>;

/**
 * La voix, la hauteur, le débit et le volume inscrits DANS l'audio généré d'un segment.
 *
 * IMPORTANT : la vitesse globale du lecteur n'en fait délibérément PAS partie. Elle
 * s'applique à la lecture via `HTMLAudioElement.playbackRate`, instantanément et sans
 * nouvelle synthèse. La cuire ici aussi l'appliquerait deux fois, et désaccorderait la clé
 * du cache de l'URL : un extrait en cache garderait l'ancienne vitesse pour toujours.
 */
export function parametresVoix(
  segment: SpeechSegment,
  lang: string,
  assignations: Partial<Record<CharacterRole, string>>,
  profils: Record<CharacterRole, ProfilProsodie>
): ParametresVoix {
  const profile = profils[segment.role] || profils.narrator;

  let voice =
    segment.voiceSignature?.voiceId ||
    assignations[segment.role] ||
    (lang === 'en' ? 'en-US-AndrewMultilingualNeural' : 'fr-FR-RemyMultilingualNeural');

  // Là où deux voix natives jouent tous les rôles (`timbres.ts`), la voix de base suit le
  // genre du personnage : une Classe-D ou une directrice n'ont pas de signature vocale
  // propre, et la voix de leur rôle — Rémy — les aurait fait parler en homme, puis la
  // personne féminine tirée pour elles aurait haussé cette voix d'homme.
  const natives = VOIX_NATIVES[lang];
  if (natives && segment.role !== 'narrator' && segment.role !== 'intercom') {
    if (segment.gender === 'female' && voice === natives.homme) voice = natives.femme;
    else if (segment.gender === 'male' && voice === natives.femme) voice = natives.homme;
  }

  let pitch = segment.voiceSignature?.pitch;
  if (!pitch) {
    pitch = '+0Hz';
    if (segment.role === 'anomaly') {
      pitch = '-18Hz'; // timbre grave, dérangeant, pas naturel
    } else if (segment.role === 'classD') {
      pitch = '+10Hz'; // tendu, agité
    } else if (segment.role === 'agent') {
      pitch = '-5Hz'; // discipliné, tactique
    } else if (profile.pitch < 0.9) {
      pitch = '-15Hz';
    } else if (profile.pitch > 1.1) {
      pitch = '+15Hz';
    }
  }

  let rate = segment.voiceSignature?.rate;
  if (!rate) {
    rate = '+0%';
    let calculatedRate = profile.rate;
    if (segment.role === 'classD') calculatedRate *= 1.08; // un peu pressé
    else if (segment.role === 'anomaly') calculatedRate *= 0.92; // débit lent, menaçant

    // Un titre de section lu au débit du corps ne s'entend pas comme un titre. Avec la
    // pause qui l'entoure (PAUSES.titre), c'est ce qui rend la structure du dossier
    // audible.
    if (segment.isHeader) calculatedRate *= 0.92;
    else if (estCrie(segment)) calculatedRate *= 0.95;

    if (calculatedRate !== 1.0) {
      rate = versPourcentage(calculatedRate);
    }
  }

  // Didascalies : « (lentement) », « (murmure) », « (crie) ». Appliquées PAR-DESSUS le
  // débit du rôle, y compris quand le personnage a sa propre signature vocale — une
  // indication de jeu vaut pour ce passage-là, pas pour le personnage en général.
  const didascalie = stageEffectFor(segment.stageDirections);
  if (didascalie.rate) {
    const actuel = parseInt(rate, 10);
    rate = versPourcentage((1 + (isNaN(actuel) ? 0 : actuel) / 100) * didascalie.rate);
  }

  // edge-tts accepte --volume : le levier sert au seul cas mesurable, l'avertissement en
  // capitales, dont l'insistance disparaissait à la normalisation.
  const volume = didascalie.volume ?? (estCrie(segment) ? '+12%' : '+0%');

  return { voice, pitch, rate, volume };
}

/** Un caviardage repéré dans l'audio synthétisé, en secondes. */
export interface PlageCensure {
  start: number;
  end: number;
}

/**
 * Repère les caviardages dans l'audio à partir des frontières de mots.
 *
 * `normalizeForSpeech` a déjà remplacé « ██ » par une formule fixe (« donnée expurgée ») ;
 * il suffit donc de retrouver cette suite de mots dans les frontières. Le balayage est
 * séquentiel, et les caviardages consécutifs sont fusionnés : « ██ ██ ██ » ne doit donner
 * qu'un seul bip, trois à la suite sonneraient comme un défaut.
 */
export function plagesCensure(frontieres: WordBoundary[], lang: string): PlageCensure[] {
  const simplifier = (mot: string) =>
    mot
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\p{L}\p{N}]/gu, '');

  const attendus = censoredSpokenWord(lang).split(/\s+/).map(simplifier);
  const plages: PlageCensure[] = [];

  for (let i = 0; i < frontieres.length; i++) {
    let k = 0;
    while (
      k < attendus.length &&
      i + k < frontieres.length &&
      simplifier(frontieres[i + k].text) === attendus[k]
    ) {
      k++;
    }
    if (k !== attendus.length) continue;

    const debut = frontieres[i].offset;
    const fin = frontieres[i + k - 1].offset + frontieres[i + k - 1].duration;
    const precedente = plages[plages.length - 1];
    // Fusion des caviardages qui se suivent de près.
    if (precedente && debut - precedente.end < 0.35) precedente.end = fin;
    else plages.push({ start: debut, end: fin });
    i += k - 1;
  }

  return plages;
}
