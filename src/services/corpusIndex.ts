/**
 * Index de corpus : les métadonnées d'écoute que Crom ne sait pas calculer.
 *
 * Crom donne la note, les tags et le texte, mais jamais « combien de temps ça dure » ni
 * « est-ce que c'est joué ou narré ». Ces deux réponses demandent de faire tourner
 * `parseScpDossier` sur le texte, ce qui est trop lourd pour être fait à l'affichage d'une
 * liste. Elles sont donc calculées une fois par `scripts/build-index.mjs` et livrées avec
 * l'application (mesuré : 77 Ko gzip pour les 4586 SCP-FR, ~2 min de construction).
 *
 * Ce module est la SOURCE UNIQUE des seuils et du vocabulaire : le script de construction
 * l'importe (via le bundle esbuild de `npm run audit:build`) et l'application aussi, pour
 * qu'un palier ne puisse pas diverger entre l'index et l'interface.
 */

import type { ObjectClass } from '../types/scp';

/**
 * Vitesse de lecture effective du moteur, en mots par minute.
 *
 * MESURÉE, pas estimée : `edgeTts.synthesize({ wordBoundaries: true })` sur 14 vrais
 * segments de SCP-049, la durée étant lue sur la dernière frontière de mot renvoyée.
 *
 *   fr-FR-Remy (narrateur)    154     ko-KR-Hyunsu (anomalie)  147
 *   fr-FR-Vivienne (intercom) 175     en-AU-William (classe-D) 171
 *   en-US-Andrew (chercheur)  147
 *
 * Les silences de `PAUSES` (speechEngine) ajoutent 3 % — 46 s sur les 150 segments de
 * SCP-049. D'où 150 comme valeur effective, silences compris.
 *
 * À revérifier avec `probe-speech.mjs` si le catalogue de voix change.
 */
export const MOTS_PAR_MINUTE = 150;

/** Paliers de durée, en minutes. Contigus : aucun dossier ne doit tomber entre deux. */
export type PalierDuree = 'flash' | 'standard' | 'long' | 'expedition';

export const PALIERS_DUREE: Array<{
  id: PalierDuree;
  label: string;
  icone: string;
  min: number;
  max: number;
}> = [
  { id: 'flash', label: 'Flash', icone: '⚡', min: 0, max: 5 },
  { id: 'standard', label: 'Rapport standard', icone: '📄', min: 5, max: 15 },
  { id: 'long', label: 'Dossier long', icone: '📚', min: 15, max: 25 },
  { id: 'expedition', label: 'Grande expédition', icone: '🌌', min: 25, max: Infinity }
];

/**
 * Seuils de la distinction solo / théâtre, en part de segments narrés.
 *
 * Le nombre de rôles est un MAUVAIS critère, et c'est mesuré : SCP-3999 compte 4 rôles
 * mais 91 % de narration (c'est un rapport), tandis que SCP-914 n'en compte que 2 pour
 * 32 % de narration (c'est un dialogue). Trier sur le nombre de rôles les classe à
 * l'envers tous les deux. La part de narration, elle, les sépare correctement.
 *
 * La zone intermédiaire reste volontairement sans étiquette : mieux vaut ne rien dire que
 * mal ranger un dossier mixte.
 */
export const SEUIL_SOLO = 85;
export const SEUIL_THEATRE = 60;

export type TypeEcoute = 'solo' | 'theatre' | 'mixte';

/**
 * Ambiances : des regroupements de tags réels, vérifiés un par un contre l'API.
 *
 * Les tags sont TRADUITS par branche — `sûr`/`safe`, `mémétique`/`memetic`,
 * `espace-temps`/`spatial` — donc il faut un vocabulaire par langue, jamais une liste
 * unique. Les nombres en commentaire sont les occurrences mesurées sur la branche.
 *
 * Tags écartés parce que vérifiés à ZÉRO page : `astronomique`, `psychologique`,
 * `illustré`, `satire`, `maladie`, `infectieux`, `coalition-mondiale-occulte`,
 * `marshall-carter-et-dark`, `fondation-fabriquée`, `goi` en français ; `humor`, `goc`,
 * `astronomical`, `disease`, `infectious`, `goi-2020` en anglais.
 */
export type IdAmbiance = 'mental' | 'biologique' | 'science-fiction' | 'factions' | 'satire';

export interface Ambiance {
  id: IdAmbiance;
  label: string;
  icone: string;
  /** Bit occupé dans le champ `a` d'une entrée d'index. */
  bit: number;
  tags: Record<string, string[]>;
}

export const AMBIANCES: Ambiance[] = [
  {
    id: 'mental',
    label: 'Psychologique & mémétique',
    icone: '🧠',
    bit: 1,
    tags: {
      // danger-cognitif 384, mémétique 208, compulsion 203, mémoire 201, danger-info 152, antimémétique 64
      fr: ['danger-cognitif', 'mémétique', 'compulsion', 'mémoire', 'danger-info', 'antimémétique'],
      // mind-affecting 1682, cognitohazard 961, memory-affecting 580, compulsion 571, memetic 508, infohazard 334, antimemetic 315
      en: ['mind-affecting', 'cognitohazard', 'memory-affecting', 'compulsion', 'memetic', 'infohazard', 'antimemetic']
    }
  },
  {
    id: 'biologique',
    label: 'Horreur biologique',
    icone: '🧬',
    bit: 2,
    tags: {
      // biologique 243, cadavre 174, contagion 152, réanimation 96, parasitaire 94, médical 86
      fr: ['biologique', 'cadavre', 'contagion', 'réanimation', 'parasitaire', 'médical'],
      // biological 691, cadaver 585, reanimation 241, contagion 208, parasitic 195, medical 182
      en: ['biological', 'cadaver', 'reanimation', 'contagion', 'parasitic', 'medical']
    }
  },
  {
    id: 'science-fiction',
    label: 'SF & portails',
    icone: '🌀',
    bit: 4,
    tags: {
      // extra-dimensionnel 349, espace-temps 192, extraterrestre 179, temporel 176, téléportation 175, portail 127
      fr: ['extra-dimensionnel', 'espace-temps', 'extraterrestre', 'temporel', 'téléportation', 'portail'],
      // extradimensional 992, temporal 572, teleportation 545, spatial 519, extraterrestrial 489, portal 316
      en: ['extradimensional', 'temporal', 'teleportation', 'spatial', 'extraterrestrial', 'portal']
    }
  },
  {
    id: 'factions',
    label: 'Factions & lore',
    icone: '⚔️',
    bit: 8,
    tags: {
      // cmo 155, dieu-brisé 110, main-du-serpent 89, insurrection-du-chaos 73, comité-d-éthique 65
      fr: ['cmo', 'dieu-brisé', 'main-du-serpent', 'insurrection-du-chaos', 'comité-d-éthique'],
      // marshall-carter-and-dark 558, broken-god 468, foundation-made 382, chaos-insurgency 374, serpents-hand 356, ethics-committee 303
      en: ['marshall-carter-and-dark', 'broken-god', 'foundation-made', 'chaos-insurgency', 'serpents-hand', 'ethics-committee']
    }
  },
  {
    id: 'satire',
    label: 'Satire & détente',
    icone: '😂',
    bit: 16,
    tags: {
      // humour 252, classe-ésotérique 243, méta 238
      fr: ['humour', 'classe-ésotérique', 'méta'],
      // comedy 1166, esoteric-class 1066, meta 609, joke 503
      en: ['comedy', 'esoteric-class', 'meta', 'joke']
    }
  }
];

/** Vocabulaire de repli quand la branche n'a pas de traduction connue. */
export function tagsAmbiance(ambiance: Ambiance, langue: string): string[] {
  return ambiance.tags[langue] ?? ambiance.tags.en;
}

/** Ordre stable des classes, pour les stocker sur un seul chiffre dans l'index. */
export const CLASSES_INDEX: ObjectClass[] = [
  'Non assigné', 'Safe', 'Euclid', 'Keter', 'Thaumiel',
  'Apollyon', 'Archon', 'Neutralized', 'Decommissioned'
];

/**
 * Une entrée d'index. Les clés sont courtes parce qu'elles sont répétées 4586 fois :
 * la version verbeuse pesait trois fois plus pour la même information.
 */
export interface EntreeIndex {
  /** Mots réellement prononcés (sortie de `parseScpDossier`, pas le texte brut). */
  m: number;
  /** Nombre de segments. */
  s: number;
  /** Nombre de rôles distincts. */
  r: number;
  /** Part de segments narrés, en pourcentage. */
  n: number;
  /** Nombre de locuteurs distincts — c'est le « nombre de voix » affiché. */
  v: number;
  /** Note Wikidot (pour moins contre). */
  g: number;
  /** Nombre de votes (exposition). */
  c: number;
  /** Année de création, pour la normalisation par cohorte. */
  y: number;
  /** Classe d'objet, index dans `CLASSES_INDEX`. */
  k: number;
  /** Masque de bits des ambiances (voir `AMBIANCES[].bit`). */
  a: number;
  /** 1 si le dossier a une vignette. */
  i?: 1;
  /** 1 si création originale de la branche, absent si traduction. */
  o?: 1;
  /**
   * 1 si le dossier est paginé (module `ListPages`). Sa durée est alors SOUS-ESTIMÉE :
   * l'index ne compte que la page 1. Mesuré à 3,7 % du corpus.
   */
  p?: 1;
}

export interface IndexCorpus {
  langue: string;
  /** ISO de la construction, pour savoir quand l'index a vieilli. */
  construitLe: string;
  /**
   * Seuils de note par année de création. Indispensable : la note dépend de l'ÂGE.
   * Mesuré sur la branche FR — cohorte 2013 : moyenne 15,1 / max 128 ; cohorte 2024 :
   * moyenne 5,2 / max 29. Aucun dossier de 2024 ne peut donc atteindre un seuil absolu
   * de 80 : un seuil fixe ne dit pas « c'est bon », il dit « c'est vieux ».
   */
  cohortes: Record<string, { p85: number; p95: number; votesMedians: number }>;
  /**
   * 95e percentile de la note sur TOUTE la branche — la barre de la visibilité globale.
   * Sert à définir la pépite en creux : le haut de sa génération qui ne franchit jamais
   * cette barre, donc qu'un tri par note ne fera jamais remonter.
   */
  noteGlobaleP95: number;
  entrees: Record<string, EntreeIndex>;
}

// ------------------------------------------------------------------ lecture

/** Durée d'écoute estimée, en minutes. */
export function dureeMinutes(entree: EntreeIndex): number {
  return entree.m / MOTS_PAR_MINUTE;
}

export function palierDuree(entree: EntreeIndex): PalierDuree {
  const min = dureeMinutes(entree);
  return (PALIERS_DUREE.find(p => min >= p.min && min < p.max) ?? PALIERS_DUREE[0]).id;
}

/**
 * Durée formatée. Un dossier paginé est préfixé « ~ » et suffixé « + » : l'index ne
 * connaît que sa première page, et avouer l'approximation vaut mieux que mentir.
 */
export function dureeLisible(entree: EntreeIndex): string {
  const total = Math.max(1, Math.round(dureeMinutes(entree)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const texte = h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
  return entree.p ? `~${texte} +` : texte;
}

export function typeEcoute(entree: EntreeIndex): TypeEcoute {
  if (entree.n >= SEUIL_SOLO) return 'solo';
  if (entree.n < SEUIL_THEATRE) return 'theatre';
  return 'mixte';
}

export function ambiancesDe(entree: EntreeIndex): IdAmbiance[] {
  return AMBIANCES.filter(a => (entree.a & a.bit) !== 0).map(a => a.id);
}

/** Masque d'ambiances d'une liste de tags, pour la construction de l'index. */
export function masqueAmbiances(tags: string[], langue: string): number {
  const presents = new Set(tags.map(t => t.toLowerCase()));
  let masque = 0;
  for (const ambiance of AMBIANCES) {
    if (tagsAmbiance(ambiance, langue).some(t => presents.has(t))) masque |= ambiance.bit;
  }
  return masque;
}

/**
 * Distinction patrimoine / pépite, normalisée par cohorte annuelle.
 *
 * DEUX PIÈGES, tous deux mesurés, tous deux contre-intuitifs.
 *
 * 1. Un seuil de note ABSOLU ne dit pas « c'est bon », il dit « c'est vieux ». Cohorte
 *    2013 : note moyenne 15,1, max 128. Cohorte 2024 : moyenne 5,2, max 29. Aucun dossier
 *    récent ne peut franchir une barre calibrée sur les anciens. D'où la normalisation par
 *    année de création.
 *
 * 2. « Bien noté MAIS peu vu » est vide par construction. La corrélation entre la note et
 *    le nombre de votes est mesurée à 0,96 sur la branche FR : les votes négatifs sont si
 *    rares que la note EST le compte de votes. Chercher un dossier bien noté et peu vu ne
 *    renvoie rien — c'est la première formulation qui avait été tentée, et elle sortait
 *    zéro résultat sur 4586 dossiers.
 *
 * La pépite se définit donc EN CREUX, et sur la seule dimension qui reste indépendante :
 * le haut de sa propre génération, qui ne franchit jamais la barre de visibilité globale.
 * Autrement dit, précisément ce qu'un tri par note ne fera jamais remonter.
 */
export type Notoriete = 'patrimoine' | 'pepite' | null;

export function notoriete(entree: EntreeIndex, index: IndexCorpus): Notoriete {
  const cohorte = index.cohortes[String(entree.y)];
  if (!cohorte) return null;

  // Patrimoine : le haut de sa génération, ET largement vu.
  if (entree.g >= cohorte.p95 && entree.c >= cohorte.votesMedians) return 'patrimoine';

  // Pépite : excellent pour sa génération, mais sous la barre de visibilité globale.
  if (entree.g >= cohorte.p85 && entree.g < index.noteGlobaleP95) return 'pepite';

  return null;
}
