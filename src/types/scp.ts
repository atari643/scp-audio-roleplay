export type ObjectClass = 
  | 'Safe' 
  | 'Euclid' 
  | 'Keter' 
  | 'Thaumiel' 
  | 'Apollyon' 
  | 'Archon' 
  | 'Neutralized' 
  | 'Decommissioned' 
  | 'Non assigné';

export interface LanguageBranch {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  baseUrl: string;
  locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageBranch[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    baseUrl: 'http://scp-wiki.wikidot.com',
    locale: 'en-US'
  },
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    baseUrl: 'http://fondationscp.wikidot.com',
    locale: 'fr-FR'
  },
  {
    code: 'es',
    name: 'Espagnol',
    nativeName: 'Español',
    flag: '🇪🇸',
    baseUrl: 'http://lafundacionscp.wikidot.com',
    locale: 'es-ES'
  },
  {
    code: 'ru',
    name: 'Russe',
    nativeName: 'Русский',
    flag: '🇷🇺',
    baseUrl: 'http://scp-ru.wikidot.com',
    locale: 'ru-RU'
  },
  {
    code: 'de',
    name: 'Allemand',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    baseUrl: 'http://scp-wiki-de.wikidot.com',
    locale: 'de-DE'
  },
  {
    code: 'ja',
    name: 'Japonais',
    nativeName: '日本語',
    flag: '🇯🇵',
    baseUrl: 'http://scp-jp.wikidot.com',
    locale: 'ja-JP'
  },
  {
    code: 'it',
    name: 'Italien',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    baseUrl: 'http://fondazionescp.wikidot.com',
    locale: 'it-IT'
  },
  {
    code: 'pl',
    name: 'Polonais',
    nativeName: 'Polski',
    flag: '🇵🇱',
    baseUrl: 'http://scp-pl.wikidot.com',
    locale: 'pl-PL'
  },
  {
    code: 'zh-CN',
    name: 'Chinois',
    nativeName: '中文',
    flag: '🇨🇳',
    baseUrl: 'http://scp-wiki-cn.wikidot.com',
    locale: 'zh-CN'
  },
  {
    code: 'ko',
    name: 'Coréen',
    nativeName: '한국어',
    flag: '🇰🇷',
    baseUrl: 'http://scpko.wikidot.com',
    locale: 'ko-KR'
  }
];

/**
 * La branche ouverte quand rien d'autre ne la désigne.
 *
 * L'anglais : c'est la branche la plus fournie, celle des communautés où le
 * projet est partagé, et un visiteur qui arrive sans préférence connue doit
 * pouvoir lire. Le français reste la langue du code et du dictionnaire de
 * référence — ce sont deux choses différentes.
 *
 * Constante explicite plutôt que `SUPPORTED_LANGUAGES[0]` : trois appelants
 * dépendaient en silence de l'ordre du tableau, qui n'est qu'un ordre
 * d'affichage.
 */
export const LANGUE_PAR_DEFAUT: LanguageBranch =
  SUPPORTED_LANGUAGES.find(l => l.code === 'en') ?? SUPPORTED_LANGUAGES[0];


export interface ScpItemSummary {
  url: string;
  slug: string;
  title: string;
  scpNumber: string;
  alternateTitle?: string;
  snippet?: string;
  rating?: number;
  /**
   * Nombre de votes, distinct de `rating` (qui vaut « pour » moins « contre »).
   * C'est la mesure de l'EXPOSITION, pas de la qualité : mesuré sur la branche FR, le taux
   * d'approbation est à 100 % médian, donc il ne discrimine rien — alors que le nombre de
   * votes sépare nettement le patrimoine (SCP-173 : 336 votes) du reste (médiane 31).
   * Crom ne sait pas filtrer dessus ; il faut le lire page par page.
   */
  voteCount?: number;
  /** Date de création ISO. Sert à normaliser la note par cohorte annuelle. */
  createdAt?: string;
  tags?: string[];
  objectClass: ObjectClass;
  thumbnailUrl?: string;
}

export interface ScpItemDetail extends ScpItemSummary {
  textContent: string;
  /**
   * Extra pages for dossiers built as a paginated Wikidot `ListPages` module (SCP-5618 and
   * friends). Kept separate from `textContent` because each page has its own footnote block
   * with its own numbering — see cromApi.fetchFragments.
   */
  fragments?: string[];
  source?: string;
  translations?: Array<{ url: string; language?: string }>;
  authors?: string[];
  /**
   * Qui a écrit le dossier, et à quel titre.
   *
   * Ce n'est pas un ornement : la licence CC BY-SA 3.0 du wiki impose de citer
   * le titre, la source, l'auteur et la licence — la règle « TSAL ». Un lien
   * vers la page d'origine couvre les trois premiers, pas l'auteur. Crom le
   * connaît, on le demande donc et on l'affiche.
   *
   * Pour une traduction, la liste contient le traducteur ET l'auteur de
   * l'original, que la licence oblige à créditer tout autant.
   */
  attributions?: AttributionScp[];
}

/** Une personne créditée sur un dossier, telle que Crom la renvoie. */
export interface AttributionScp {
  /** AUTHOR, SUBMITTER, TRANSLATOR, REWRITE, CONTRIBUTOR, MAINTAINER. */
  type: string;
  nom: string;
  /** Renseigné quand la personne est créditée sur l'original traduit. */
  surOriginal?: boolean;
}
