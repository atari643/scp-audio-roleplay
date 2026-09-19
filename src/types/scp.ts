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
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    baseUrl: 'http://fondationscp.wikidot.com',
    locale: 'fr-FR'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    baseUrl: 'http://scp-wiki.wikidot.com',
    locale: 'en-US'
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
}
