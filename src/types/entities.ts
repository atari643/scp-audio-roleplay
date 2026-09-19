/**
 * Le répertoire des entités de la Fondation — départements, chercheurs, factions,
 * installations, forces d'intervention, commandement — et les arêtes qui les relient
 * aux dossiers.
 *
 * POURQUOI CE FICHIER EXISTE. Crom n'a pas de graphe d'entités : son schéma ne connaît
 * que des pages, des tags et des utilisateurs (introspection du 9 septembre 2026). Un
 * lien « ce dossier parle du Site-19 » doit donc être DÉRIVÉ de quatre signaux, et ce
 * sont exactement les quatre valeurs de `Certitude`.
 *
 * L'ANGLAIS CLASSE, LES TRADUCTIONS HÉRITENT. La plupart des dossiers non anglais sont
 * des traductions (mesuré : fr 75 %, de 72 %, it 69 %, ru 55 %), et les motifs
 * d'extraction sont écrits dans la langue de la branche — « Зона-19 » n'est pas
 * « Site-19 ». Passer par l'original anglais contourne la localisation entière.
 * Mesuré sur 600 dossiers, branche seule → avec héritage :
 *   fr  298 → 417 arêtes     it  56 → 281 (×5)     ru  3 → 228 (×76)
 * C'est le levier principal du répertoire ; voir `EntreeEntites.o`.
 */

export type CategorieEntite =
  | 'departement'
  | 'chercheur'
  | 'faction'
  | 'site'
  | 'zone'
  | 'fim'
  | 'commandement';

/** Ordre d'affichage et libellés des catégories. */
export const CATEGORIES: Array<{ id: CategorieEntite; libelle: string; pluriel: string }> = [
  { id: 'departement', libelle: 'Département', pluriel: 'Départements' },
  { id: 'chercheur', libelle: 'Personnel', pluriel: 'Personnel scientifique' },
  { id: 'faction', libelle: "Groupe d'Intérêt", pluriel: "Groupes d'Intérêt" },
  { id: 'site', libelle: 'Site', pluriel: 'Sites' },
  { id: 'zone', libelle: 'Zone', pluriel: 'Zones' },
  { id: 'fim', libelle: "Force d'Intervention", pluriel: "Forces d'Intervention Mobiles" },
  { id: 'commandement', libelle: 'Commandement', pluriel: 'Commandement' }
];

/**
 * Comment la relation a été établie. Détermine ce que l'UI a le droit d'affirmer :
 * `tag` et `annuaire` sont des faits écrits par la communauté, `mention` est une
 * inférence de notre part. Les mélanger reproduirait le défaut des `iconicScps`
 * saisis à la main, qu'on est justement en train de retirer.
 */
export type Certitude = 'tag' | 'annuaire' | 'origine' | 'mention';

/** Les certitudes qu'on présente comme confirmées, par opposition aux mentions. */
export const CERTITUDES_CONFIRMEES: Certitude[] = ['tag', 'annuaire', 'origine'];

export interface Entite {
  /** Stable et ASCII, préfixé par catégorie : `site-19`, `faction-serpents-hand`. */
  id: string;
  categorie: CategorieEntite;
  /** Libellé par code de langue. Lire avec `nomEntite()`, jamais en direct. */
  noms: Record<string, string>;
  /** Tags Crom déclarés par les annuaires : `{ en: ['doctor-clef'], fr: ['dr-clef'] }`. */
  tags: Record<string, string[]>;
  /** Page d'origine par branche — la source citable de l'entité. */
  pages: Record<string, string>;
  /** Désignation canonique quand il y en a une : `Site-19`, `FIM Epsilon-11`. */
  designation?: string;
  /**
   * Résumé tiré de l'annuaire du wiki, **par branche**. Jamais rédigé par nous.
   *
   * Indexé par langue comme `noms` et `pages`, et pour la même raison : chaque
   * annuaire écrit sa propre présentation. Le champ était une chaîne unique, et
   * comme l'anglais est construit en premier, c'est sa version qui écrasait les
   * neuf autres — un francophone lisait un nom français suivi d'un résumé
   * anglais. Lire avec `resumeEntite()`, jamais en direct.
   */
  resume?: Record<string, string>;
}

export interface RepertoireEntites {
  construitLe: string;
  /** Branches dont les annuaires ont été lus. */
  branches: string[];
  entites: Entite[];
}

/**
 * Les rattachements d'un dossier. Clés courtes : elles sont répétées une fois par
 * dossier, sur ~60 000 dossiers — la version verbeuse triplait la taille du fichier,
 * pour la même information (même raisonnement que `EntreeIndex` de corpusIndex.ts).
 */
export interface EntreeEntites {
  /** Confirmé : le dossier porte le tag Crom de l'entité. */
  t?: string[];
  /** Confirmé : un annuaire du wiki cite ce dossier sous cette entité. */
  a?: string[];
  /** Confirmé : hérité de l'original anglais dont ce dossier est la traduction. */
  o?: string[];
  /** Probable : le texte nomme l'entité, sans que rien ne la déclare. */
  m?: string[];
}

export interface IndexEntites {
  langue: string;
  /** ISO de la construction, pour savoir quand l'index a vieilli. */
  construitLe: string;
  /** Slug de dossier → rattachements. */
  entrees: Record<string, EntreeEntites>;
  /** Index inverse : id d'entité → slugs, triés par note décroissante. */
  parEntite: Record<string, string[]>;
}

/**
 * Le profil d'une branche : quels tags y désignent un dossier, un conte, un centre.
 *
 * INDISPENSABLE, ET MESURÉ. La branche russe n'utilise pas le tag `scp` DU TOUT :
 * `tags: { eq: 'scp' }` sur scp-ru renvoie 0, alors qu'elle compte 4 653 dossiers
 * tagués `объект`. Un tag codé en dur produit un index vide en silence.
 */
export interface ProfilBranche {
  code: string;
  baseUrl: string;
  /** Tag qui désigne un dossier SCP sur cette branche. */
  tagDossier: string;
  /** Tag qui désigne un conte, si la branche en a un. */
  tagConte?: string;
  /** Tag qui désigne une page-centre, si la branche en a un. */
  tagCentre?: string;
  /** Nombre de pages portant `tagDossier`, au moment du profilage. */
  dossiers: number;
  /** Nombre total de pages de la branche. */
  pages: number;
}

export type ProfilsBranches = Record<string, ProfilBranche>;
