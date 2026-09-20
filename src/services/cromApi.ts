import { AttributionScp, LanguageBranch, ObjectClass, ScpItemDetail, ScpItemSummary, SUPPORTED_LANGUAGES, LANGUE_PAR_DEFAUT } from '../types/scp';
import { getSeriesById } from '../data/seriesData';
import { ICONIC_SCPS } from './scpDataApi';

const CROM_ENDPOINT = 'https://api.crom.avn.sh/graphql';

// Fast lookup map for enriched metadata of iconic dossiers
const iconicMap = new Map<string, ScpItemSummary>();
for (const item of ICONIC_SCPS) {
  iconicMap.set(item.slug.toLowerCase(), item);
  iconicMap.set(item.scpNumber.toLowerCase(), item);
}

// In-memory cache for full series to make tab switching instant
const seriesCache = new Map<string, ScpItemSummary[]>();

function extractObjectClass(tags?: string[]): ObjectClass {
  if (!tags) return 'Non assigné';
  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  if (tagSet.has('keter')) return 'Keter';
  if (tagSet.has('euclid') || tagSet.has('euclide')) return 'Euclid';
  if (tagSet.has('safe') || tagSet.has('sûr') || tagSet.has('sur')) return 'Safe';
  if (tagSet.has('thaumiel')) return 'Thaumiel';
  if (tagSet.has('apollyon')) return 'Apollyon';
  if (tagSet.has('archon')) return 'Archon';
  if (tagSet.has('neutralized') || tagSet.has('neutralisé')) return 'Neutralized';
  if (tagSet.has('decommissioned') || tagSet.has('déclassé')) return 'Decommissioned';

  return 'Non assigné';
}

function extractScpNumber(slugOrTitle: string): string {
  const match = slugOrTitle.match(/scp-([0-9a-z\-]+)/i);
  if (match) {
    return match[0].toUpperCase();
  }
  return slugOrTitle.toUpperCase();
}

/**
 * Do two pages say substantially the same thing?
 *
 * Some paginated dossiers publish alternative RENDERINGS rather than successive pages —
 * SCP-6747 ships an "ORIGINAL" and an "ACCESSIBLE" variant of the same article, 98% identical
 * word-for-word. Concatenating them would read the whole thing twice. Labels in the source
 * hint at this but are pure convention, so the call is made on the text.
 *
 * Cheap shingle sampling: take short slices at regular intervals and see how many occur in
 * the other text. Sequential pages of a genuine continuation share almost nothing.
 */
function isNearDuplicate(a: string, b: string): boolean {
  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return false;

  // Wildly different lengths cannot be the same article twice.
  const ratio = Math.min(x.length, y.length) / Math.max(x.length, y.length);
  if (ratio < 0.6) return false;

  const SLICE = 40;
  const STEP = Math.max(200, Math.floor(y.length / 60));
  let sampled = 0;
  let hits = 0;
  for (let i = 0; i + SLICE <= y.length; i += STEP) {
    sampled++;
    if (x.includes(y.slice(i, i + SLICE))) hits++;
  }
  if (sampled < 5) return x === y;
  return hits / sampled >= 0.8;
}

/**
 * Deux limites distinctes protègent Crom, et il ne faut pas les confondre :
 *
 *   QUOTA    300 000 points par fenêtre de 5 min, très large. Mesuré : une page coûte
 *            2 points QUELS QUE SOIENT les champs demandés — `textContent` est gratuit.
 *   RAFALE   un limiteur indépendant du quota, qui répond en clair
 *            « You're making requests too often! Please wait for N seconds ».
 *
 * C'est le second qui se déclenche en pratique, bien avant le quota, dès qu'on enchaîne
 * les requêtes (balayage de série, construction de l'index). Il annonce lui-même le délai
 * à respecter : on le lit plutôt que de deviner un backoff exponentiel.
 *
 * Sans cette reprise, `queryGraphQL` jetait sur ce message et l'appelant voyait une
 * liste vide — indiscernable d'un dossier réellement absent.
 */
const RAFALE_MAX_TENTATIVES = 4;

function delaiRafale(message: string): number | null {
  const m = message.match(/wait for (d+) second/i);
  return m ? (parseInt(m[1], 10) + 1) * 1000 : null;
}

async function queryGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  for (let tentative = 0; ; tentative++) {
    const response = await fetch(CROM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SCP-Audio-Roleplay/1.0'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Crom API HTTP error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const erreur: string | undefined = result.errors?.[0]?.message;
    if (!erreur) return result.data as T;

    const attente = delaiRafale(erreur);
    if (attente === null || tentative >= RAFALE_MAX_TENTATIVES) {
      throw new Error(`Crom GraphQL error: ${erreur}`);
    }
    await new Promise(resolve => setTimeout(resolve, attente));
  }
}

/**
 * Sélection commune à toutes les requêtes de liste.
 *
 * `voteCount` et `createdAt` sont ajoutés ici alors qu'ils n'étaient demandés nulle part :
 * mesuré, le service facture 2 points PAR PAGE quels que soient les champs, donc les
 * ajouter ne coûte rien en quota (seulement quelques octets), et ils portent à eux deux
 * les filtres « pépite » et « patrimoine ».
 */
const SELECTION_LISTE = `
  url
  alternateTitles { title }
  wikidotInfo {
    title
    rating
    voteCount
    tags
    createdAt
    thumbnailUrl
  }
`;

/**
 * Sélection commune aux deux requêtes de détail.
 *
 * `attributions` et `translationOf` sont là pour la licence, pas pour le décor :
 * le wiki SCP est en CC BY-SA 3.0, qui impose de citer l'auteur — le lien vers
 * la page source ne suffit pas. Sur une traduction, c'est l'auteur de
 * l'ORIGINAL qu'il faut créditer en plus du traducteur, d'où le second niveau.
 *
 * Le service facture par page et non par champ : ces deux champs ne coûtent
 * rien en quota.
 */
const SELECTION_DETAIL = `
  url
  alternateTitles {
    title
  }
  translations {
    url
  }
  attributions {
    type
    user { name }
  }
  translationOf {
    url
    attributions {
      type
      user { name }
    }
  }
  wikidotInfo {
    title
    rating
    tags
    textContent
    source
    thumbnailUrl
    createdAt
  }
`;

interface NoeudAttribution {
  type: string;
  user?: { name?: string } | null;
}

interface NoeudDetail {
  url: string;
  alternateTitles?: Array<{ title: string }>;
  translations?: Array<{ url: string }>;
  attributions?: NoeudAttribution[] | null;
  translationOf?: { url: string; attributions?: NoeudAttribution[] | null } | null;
  wikidotInfo?: {
    title: string;
    rating?: number;
    tags?: string[];
    textContent?: string;
    source?: string;
    thumbnailUrl?: string;
    createdAt?: string;
  };
}

/**
 * Rassemble les crédits d'un dossier : ceux de la page, puis ceux de l'original
 * quand c'est une traduction.
 *
 * Les doublons sont écartés sur le couple (nom, rôle) — une même personne peut
 * être créditée des deux côtés sans qu'il faille l'écrire deux fois.
 */
function versAttributions(page: NoeudDetail): AttributionScp[] {
  const vues = new Set<string>();
  const credits: AttributionScp[] = [];

  const ajouter = (noeuds: NoeudAttribution[] | null | undefined, surOriginal: boolean) => {
    for (const noeud of noeuds || []) {
      const nom = noeud?.user?.name?.trim();
      if (!nom) continue;
      const cle = `${nom}|${noeud.type}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      credits.push(surOriginal ? { type: noeud.type, nom, surOriginal } : { type: noeud.type, nom });
    }
  };

  ajouter(page.attributions, false);
  ajouter(page.translationOf?.attributions, true);

  return credits;
}

interface NoeudListe {
  url: string;
  alternateTitles?: Array<{ title: string }>;
  wikidotInfo?: {
    title: string;
    rating?: number;
    voteCount?: number;
    tags?: string[];
    createdAt?: string;
    thumbnailUrl?: string;
  };
}

/** Traduit un nœud Crom en résumé applicatif. Unique point de conversion des listes. */
function versResume(page: NoeudListe): ScpItemSummary {
  const title = page.wikidotInfo?.title || page.url.split('/').pop() || 'Inconnu';
  const slug = page.url.split('/').pop() || title.toLowerCase();
  const tags = page.wikidotInfo?.tags || [];

  return {
    url: page.url,
    slug,
    title,
    scpNumber: extractScpNumber(slug || title),
    alternateTitle: page.alternateTitles?.[0]?.title,
    rating: page.wikidotInfo?.rating,
    voteCount: page.wikidotInfo?.voteCount,
    createdAt: page.wikidotInfo?.createdAt,
    tags,
    objectClass: extractObjectClass(tags),
    thumbnailUrl: page.wikidotInfo?.thumbnailUrl
  };
}

export type CleTriPages = 'URL' | 'TITLE' | 'CREATED_AT' | 'RATING';

export interface OptionsPages {
  /** Filtre GraphQL déjà construit (voir `filtreScp`). */
  filter: Record<string, unknown>;
  cle?: CleTriPages;
  ordre?: 'ASC' | 'DESC';
  /** Curseur `endCursor` de la page précédente. */
  apres?: string | null;
  /** 100 est le maximum accepté par le service. */
  taille?: number;
}

export interface PageDeResultats {
  items: ScpItemSummary[];
  /** À repasser en `apres` pour la page suivante ; `null` quand il n'y en a plus. */
  curseur: string | null;
}

/**
 * Construit un filtre `QueryPagesFilter` bien formé.
 *
 * ATTENTION, contrainte du service, vérifiée par l'erreur qu'il renvoie :
 *   « filter must only contain one property if {_and, _or, _not} are used »
 * On ne peut donc PAS mélanger `_and` et une propriété sœur au même niveau. D'où la forme
 * systématique { _and: [ … ] } : chaque critère est une entrée distincte du tableau.
 */
export function filtreScp(options: {
  baseUrl: string;
  prefixeUrl?: string;
  tags?: string[];
  /** Au moins un de ces tags (traduit en `_or`). */
  tagsAlternatifs?: string[];
  noteMin?: number;
  creeApres?: string;
  creeAvant?: string;
}): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [
    { url: { startsWith: options.prefixeUrl ?? options.baseUrl } }
  ];

  for (const tag of options.tags ?? []) {
    clauses.push({ wikidotInfo: { tags: { eq: tag } } });
  }
  if (options.tagsAlternatifs?.length) {
    clauses.push({
      _or: options.tagsAlternatifs.map(tag => ({ wikidotInfo: { tags: { eq: tag } } }))
    });
  }
  if (options.noteMin !== undefined) {
    clauses.push({ wikidotInfo: { rating: { gte: options.noteMin } } });
  }
  if (options.creeApres) {
    clauses.push({ wikidotInfo: { createdAt: { gte: options.creeApres } } });
  }
  if (options.creeAvant) {
    clauses.push({ wikidotInfo: { createdAt: { lt: options.creeAvant } } });
  }

  return { _and: clauses };
}

export const cromApi = {
  getLanguage(code: string): LanguageBranch {
    return SUPPORTED_LANGUAGES.find(l => l.code === code) || LANGUE_PAR_DEFAUT;
  },

  /**
   * Parcours paginé et TRIÉ du corpus.
   *
   * L'ancienne `GetPrefixPages` ne sélectionnait ni `pageInfo` ni `endCursor` et ne passait
   * aucun `sort:` : tout ce qui dépassait les 48 (ou 100) premiers résultats était
   * inatteignable, et aucun classement n'était possible. Le service, lui, sait faire les
   * deux depuis toujours — c'était la requête qui ne le demandait pas.
   */
  async fetchPages(options: OptionsPages): Promise<PageDeResultats> {
    const requete = `
      query ParcoursPages($filter: QueryPagesFilter, $first: Int!, $after: ID) {
        pages(
          filter: $filter
          sort: { key: ${options.cle ?? 'URL'}, order: ${options.ordre ?? 'ASC'} }
          first: $first
          after: $after
        ) {
          pageInfo { hasNextPage endCursor }
          edges { node { ${SELECTION_LISTE} } }
        }
      }
    `;

    interface Reponse {
      pages?: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: NoeudListe }>;
      };
    }

    try {
      const data = await queryGraphQL<Reponse>(requete, {
        filter: options.filter,
        first: Math.min(options.taille ?? 100, 100),
        after: options.apres ?? null
      });

      if (!data?.pages?.edges) return { items: [], curseur: null };

      return {
        items: data.pages.edges.map(edge => versResume(edge.node)),
        curseur: data.pages.pageInfo.hasNextPage ? data.pages.pageInfo.endCursor : null
      };
    } catch (err) {
      console.error('Erreur fetchPages Crom:', err);
      return { items: [], curseur: null };
    }
  },

  /**
   * Récupère les résumés d'une liste de dossiers désignés par leur slug.
   *
   * C'est ce qui permet d'afficher les dossiers d'une entité : l'index d'entités ne
   * garde que des slugs (il pèserait dix fois plus s'il stockait les titres et les
   * notes, qui vieillissent), et toutes les entités n'ont pas de tag Crom sur lequel
   * filtrer — les installations et les forces d'intervention n'en ont pratiquement
   * jamais, c'est mesuré.
   *
   * Les slugs sont découpés en paquets : `_or` est accepté par le service, mais une
   * liste de 150 clauses fait une requête énorme pour rien.
   */
  async fetchBySlugs(slugs: string[], langCode: string = 'fr'): Promise<ScpItemSummary[]> {
    if (slugs.length === 0) return [];
    const langue = this.getLanguage(langCode);
    const PAQUET = 40;
    const resultats: ScpItemSummary[] = [];

    for (let i = 0; i < slugs.length; i += PAQUET) {
      const paquet = slugs.slice(i, i + PAQUET);
      const filtre = {
        _or: paquet.map(slug => ({ url: { eq: `${langue.baseUrl}/${slug}` } }))
      };
      const page = await this.fetchPages({ filter: filtre, taille: PAQUET });
      resultats.push(...page.items);
    }

    // Le service rend les pages dans son propre ordre : on rétablit celui demandé,
    // qui est le tri par note de l'index.
    const rang = new Map(slugs.map((slug, i) => [slug.toLowerCase(), i]));
    return resultats.sort(
      (a, b) => (rang.get(a.slug.toLowerCase()) ?? 999) - (rang.get(b.slug.toLowerCase()) ?? 999)
    );
  },

  /**
   * Compte les dossiers correspondant à un filtre, et donne les bornes de leurs notes.
   *
   * Sert à deux choses : afficher le nombre exact de résultats AVANT que l'utilisateur ne
   * clique sur une facette, et dériver les seuils par cohorte de l'index (idée « pépite »).
   * Coûte ~2 points, quel que soit le nombre de pages comptées.
   */
  async aggregateScp(filter: Record<string, unknown>): Promise<{
    count: number;
    noteMoyenne: number | null;
    noteMax: number | null;
  }> {
    const requete = `
      query AgregatScp($filter: QueryAggregatePageWikidotInfosFilter) {
        aggregatePageWikidotInfos(filter: $filter) {
          _count
          rating { mean max }
        }
      }
    `;

    interface Reponse {
      aggregatePageWikidotInfos?: {
        _count: number;
        rating: { mean: number | null; max: number | null };
      };
    }

    try {
      const data = await queryGraphQL<Reponse>(requete, { filter });
      const a = data?.aggregatePageWikidotInfos;
      return {
        count: a?._count ?? 0,
        noteMoyenne: a?.rating?.mean ?? null,
        noteMax: a?.rating?.max ?? null
      };
    } catch (err) {
      console.error('Erreur aggregateScp Crom:', err);
      return { count: 0, noteMoyenne: null, noteMax: null };
    }
  },

  /**
   * Search SCP pages in the selected language branch
   */
  async searchScp(query: string, langCode: string = 'fr'): Promise<ScpItemSummary[]> {
    const lang = this.getLanguage(langCode);
    const searchQuery = `
      query SearchScp($query: String!, $baseUrls: [String!]) {
        searchPages(query: $query, filter: { anyBaseUrl: $baseUrls }) {
          ${SELECTION_LISTE}
        }
      }
    `;

    interface SearchResponse {
      searchPages: NoeudListe[];
    }

    try {
      const data = await queryGraphQL<SearchResponse>(searchQuery, {
        query: query.trim(),
        baseUrls: [lang.baseUrl]
      });

      let rawPages = data?.searchPages || [];

      // Fallback: If 0 results on current branch and query resembles an SCP number (e.g. "6172", "scp-6172")
      const numMatch = query.trim().match(/^(?:scp[-_\s]*)?(\d+[a-z\-]*)$/i);
      if (rawPages.length === 0 && numMatch) {
        const rawNum = numMatch[1].toLowerCase();
        const padNum = rawNum.padStart(3, '0');
        const directSlug = `scp-${padNum}`;

        const directPageQuery = `
          query GetDirectPage($url: URL!) {
            page(url: $url) {
              ${SELECTION_LISTE}
            }
          }
        `;

        interface DirectPageResponse {
          page?: NoeudListe;
        }

        // Try localized direct page first
        try {
          const localDirect = await queryGraphQL<DirectPageResponse>(directPageQuery, {
            url: `${lang.baseUrl}/${directSlug}`
          });
          if (localDirect?.page?.wikidotInfo) {
            rawPages = [localDirect.page];
          } else if (langCode !== 'en') {
            // Try English branch as fallback for untranslated dossiers (e.g. SCP-6172)
            const enBranch = SUPPORTED_LANGUAGES.find(l => l.code === 'en') || SUPPORTED_LANGUAGES[1];
            const enDirect = await queryGraphQL<DirectPageResponse>(directPageQuery, {
              url: `${enBranch.baseUrl}/${directSlug}`
            });
            if (enDirect?.page?.wikidotInfo) {
              rawPages = [{
                ...enDirect.page,
                alternateTitles: [{ title: 'Dossier en anglais (Non encore traduit en français)' }]
              }];
            }
          }
        } catch {
          // Ignore fallback errors
        }
      }

      return rawPages.map(versResume);
    } catch (err) {
      console.error('Erreur recherche Crom:', err);
      return [];
    }
  },

  /**
   * Fetch all SCP dossiers for an entire series using official series hub pages (1,000 SCPs per series)
   */
  async fetchSeries(seriesId: string, langCode: string = 'fr'): Promise<ScpItemSummary[]> {
    const cacheKey = `${seriesId}_${langCode}`;
    if (seriesCache.has(cacheKey)) {
      return seriesCache.get(cacheKey)!;
    }

    const series = getSeriesById(seriesId);
    if (!series) return [];

    const lang = this.getLanguage(langCode);
    const hubSlug = series.hubSlug || (series.id === 'series_fr' ? 'liste-fr' : 'scp-series');

    // For French series, always query the French wiki; for others query current lang or fallback to EN
    let primaryBaseUrl = lang.baseUrl;
    if (series.id === 'series_fr') {
      primaryBaseUrl = 'http://fondationscp.wikidot.com';
    }

    const hubUrl = `${primaryBaseUrl}/${hubSlug}`;
    const hubQuery = `
      query GetSeriesHub($url: URL!) {
        page(url: $url) {
          wikidotInfo {
            source
            title
          }
        }
      }
    `;

    interface HubResponse {
      page?: {
        wikidotInfo?: {
          source?: string;
          title?: string;
        };
      };
    }

    try {
      let data = await queryGraphQL<HubResponse>(hubQuery, { url: hubUrl });
      let source = data?.page?.wikidotInfo?.source;

      // Fallback: If not found on localized wiki, try French or English hub
      if (!source && primaryBaseUrl !== 'http://scp-wiki.wikidot.com') {
        const enUrl = `http://scp-wiki.wikidot.com/${hubSlug}`;
        const fallbackData = await queryGraphQL<HubResponse>(hubQuery, { url: enUrl });
        source = fallbackData?.page?.wikidotInfo?.source;
      }

      if (!source) {
        // Ultimate fallback: fetch by prefix if hub source unavailable
        return this.fetchByPrefix(series.prefix, langCode, 100);
      }

      const regex = /(?:[*#]|\b)\s*\[\[\[(?:([^|\]]+)\|)?(SCP-[0-9A-Za-z\-_]+)\]\]\]\s*(?:-\s*([^\n\r]+))?/gi;
      const items: ScpItemSummary[] = [];
      const seen = new Set<string>();
      let match: RegExpExecArray | null;

      while ((match = regex.exec(source)) !== null) {
        const rawSlug = (match[1] || match[2]).trim().toLowerCase();
        const scpNumber = match[2].trim().toUpperCase();
        if (seen.has(scpNumber)) continue;
        seen.add(scpNumber);

        let title = (match[3] || '').trim();
        title = title
          .replace(/\[!--.*?--\]/g, '')
          .replace(/\[\[.*?\]\]/g, '')
          .replace(/\*\*|\/\/|__/g, '')
          .trim();

        const slug = rawSlug.startsWith('http') ? rawSlug.split('/').pop() || rawSlug : rawSlug;
        const canonicalUrl = `${primaryBaseUrl}/${slug}`;

        // Enrich with iconic metadata if available
        const iconic = iconicMap.get(slug) || iconicMap.get(scpNumber.toLowerCase());

        items.push({
          url: canonicalUrl,
          slug,
          title: title || iconic?.title || scpNumber,
          scpNumber,
          alternateTitle: title || iconic?.alternateTitle || undefined,
          rating: iconic?.rating,
          objectClass: iconic?.objectClass || 'Non assigné',
          tags: iconic?.tags || [],
          thumbnailUrl: iconic?.thumbnailUrl
        });
      }

      if (items.length > 0) {
        seriesCache.set(cacheKey, items);
        return items;
      }

      return this.fetchByPrefix(series.prefix, langCode, 100);
    } catch (err) {
      console.error(`Erreur fetchSeries Crom (${seriesId}):`, err);
      return this.fetchByPrefix(series.prefix, langCode, 100);
    }
  },

  /**
   * Parcours par préfixe d'URL (« scp-0 », « scp-1 », « scp-15 », « scp-…-fr »…).
   *
   * Repose désormais sur `fetchPages`, donc trié par URL et capable de dépasser les 100
   * résultats d'une requête : au-delà, on enchaîne les curseurs. Les dossiers récupérés
   * portent maintenant `voteCount` et `createdAt`, que l'ancienne requête ne demandait pas.
   */
  async fetchByPrefix(prefix: string, langCode: string = 'fr', limit: number = 48): Promise<ScpItemSummary[]> {
    const lang = this.getLanguage(langCode);
    const filter = filtreScp({
      baseUrl: lang.baseUrl,
      prefixeUrl: `${lang.baseUrl}/${prefix}`
    });

    const items: ScpItemSummary[] = [];
    let curseur: string | null = null;

    do {
      const page: PageDeResultats = await this.fetchPages({
        filter,
        cle: 'URL',
        ordre: 'ASC',
        apres: curseur,
        taille: Math.min(limit - items.length, 100)
      });
      items.push(...page.items);
      curseur = page.curseur;
      if (page.items.length === 0) break;
    } while (curseur && items.length < limit);

    return items.slice(0, limit);
  },

  /**
   * Fetch full SCP article details by URL or slug
   */
  async fetchScpDetail(slugOrNumber: string, langCode: string = 'fr'): Promise<ScpItemDetail | null> {
    const lang = this.getLanguage(langCode);
    
    // Normalize slug (e.g., "049" -> "scp-049", "scp-173" -> "scp-173")
    let slug = slugOrNumber.toLowerCase().trim();
    if (!slug.startsWith('scp-') && /^\d+/.test(slug)) {
      slug = `scp-${slug.padStart(3, '0')}`;
    }

    // Canonical URLs on Crom are http://
    const canonicalUrl = `${lang.baseUrl}/${slug}`;

    const detailQuery = `
      query GetScpDetail($url: URL!) {
        page(url: $url) {
${SELECTION_DETAIL}
        }
      }
    `;

    interface DetailResponse {
      page?: NoeudDetail;
    }

    try {
      const data = await queryGraphQL<DetailResponse>(detailQuery, { url: canonicalUrl });
      const page = data?.page;
      const wiki = page?.wikidotInfo;

      if (!page || !wiki || !wiki.textContent) {
        // Fallback: Try searching for the slug if direct URL didn't match
        const searchResults = await this.searchScp(slug, langCode);
        if (searchResults.length > 0 && searchResults[0].url !== canonicalUrl) {
          return this.fetchScpDetailByUrl(searchResults[0].url);
        }
        return null;
      }

      const title = wiki.title || slug.toUpperCase();
      const tags = wiki.tags || [];

      // Paginated dossiers (see fetchFragments) only return their first page here. Keep the
      // extra pages SEPARATE rather than concatenating: each page carries its own
      // "Notes de bas de page" block with its own 1..N numbering, so a naive join would put
      // page 2 inside page 1's footnote section and lose it entirely.
      const fragments = await this.fetchFragments(slug, wiki.source || '', langCode, wiki.textContent || '');

      return {
        fragments: fragments.length > 0 ? fragments : undefined,
        url: page.url,
        slug,
        title,
        scpNumber: extractScpNumber(slug),
        alternateTitle: page.alternateTitles?.[0]?.title,
        rating: wiki.rating,
        tags,
        objectClass: extractObjectClass(tags),
        thumbnailUrl: wiki.thumbnailUrl,
        textContent: wiki.textContent,
        source: wiki.source,
        createdAt: wiki.createdAt,
        translations: page.translations?.map(t => ({ url: t.url })),
        attributions: versAttributions(page)
      };
    } catch (err) {
      console.error(`Erreur chargement SCP ${slug}:`, err);
      return null;
    }
  },

  /**
   * Fetch directly by full page URL
   */
  /**
   * Some dossiers are not one page: the article body is a Wikidot `ListPages` module that
   * pulls one "fragment" child page at a time, paginated through the URL
   * (`.../scp-5618/offset/1`). Crom only ever returns the FIRST page's text, so the app was
   * silently reading a fraction of these articles.
   *
   * SCP-5618 is the reference case — 723 characters of source producing 4 654 of text, with
   * a second page at `fragment:scp-5618-offset-1`.
   *
   * Fragment page names are NOT conventional across the wiki (`fragment:scp-5618-offset-1`,
   * `fragment:2117-1`, `fragment:2521-xxx-0`…) and Crom exposes no parent/child relation, so
   * we take the two reliable routes in order: the URLs authors list in an HTML comment, then
   * a bounded probe of the common naming patterns.
   */
  async fetchFragments(
    slug: string,
    source: string,
    langCode: string = 'fr',
    mainText: string = ''
  ): Promise<string[]> {
    // Only paginated articles have a ListPages module driven by the URL offset.
    if (!/\[\[module\s+ListPages[^\]]*offset\s*=\s*"?@URL/i.test(source)) return [];

    const lang = this.getLanguage(langCode);
    const seen = new Set<string>();
    const candidates: string[] = [];

    // Route 1: authors list the fragment URLs in an [!-- ... --] comment block, often with
    // a label. Those labels matter: SCP-6747 lists
    //   [!-- .../fragment:scp-6747-0 ORIGINAL --]
    //   [!-- .../fragment:scp-6747-1 ACCESSIBLE --]
    // which are two RENDERINGS OF THE SAME ARTICLE, not successive pages. Appending them
    // would read the whole dossier three times over.
    for (const m of source.matchAll(/https?:\/\/[^\s\]]*\/(fragment:[^\s\]]+)([^\n\]]*)/gi)) {
      const name = m[1].toLowerCase();
      if (!seen.has(name)) {
        seen.add(name);
        candidates.push(name);
      }
    }

    // Route 2: probe the usual naming patterns, bounded so a miss costs little.
    const num = slug.replace(/^scp-/i, '');
    for (let i = 1; i <= 8; i++) {
      for (const pattern of [`fragment:${slug}-offset-${i}`, `fragment:${slug}-${i}`, `fragment:${num}-${i}`]) {
        if (!seen.has(pattern)) {
          seen.add(pattern);
          candidates.push(pattern);
        }
      }
    }

    const query = `
      query GetFragment($url: URL!) {
        page(url: $url) {
          wikidotInfo {
            textContent
          }
        }
      }
    `;

    interface FragmentResponse {
      page?: { wikidotInfo?: { textContent?: string } };
    }

    const texts: string[] = [];
    // The page Crom already gave us is one of the fragments (offset 0), so it seeds the
    // duplicate check — otherwise "fragment:scp-6747-0" comes back as a second copy of it.
    const collected: string[] = mainText ? [mainText] : [];
    let consecutiveMisses = 0;
    for (const name of candidates) {
      // The main page itself is never a fragment of itself.
      if (name === `fragment:${slug}`) continue;
      try {
        const data = await queryGraphQL<FragmentResponse>(query, { url: `${lang.baseUrl}/${name}` });
        const content = data?.page?.wikidotInfo?.textContent;
        if (content && content.trim()) {
          // Only keep pages that actually add something. Labels are a convention we cannot
          // rely on, so the decision is made on the text itself.
          if (collected.some(existing => isNearDuplicate(existing, content))) {
            consecutiveMisses = 0;
          } else {
            texts.push(content);
            collected.push(content);
            consecutiveMisses = 0;
          }
        } else {
          consecutiveMisses++;
        }
      } catch {
        consecutiveMisses++;
      }
      // Stop probing once the pattern clearly runs out.
      if (consecutiveMisses >= 3 && texts.length > 0) break;
      if (consecutiveMisses >= 6) break;
    }

    return texts;
  },

  /**
   * When a dossier is absent from the current language branch, find out whether it exists
   * in English. Lets the UI say "pas encore traduite" (and offer the English original)
   * instead of the ambiguous "introuvable".
   *
   * Returns null when the dossier does not exist anywhere — a genuine dead link.
   */
  async findEnglishFallback(slugOrNumber: string): Promise<{ url: string; slug: string; title: string } | null> {
    let slug = slugOrNumber.toLowerCase().trim();
    if (!slug.startsWith('scp-') && /^\d+/.test(slug)) {
      slug = `scp-${slug.padStart(3, '0')}`;
    }

    const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
    if (!en) return null;

    const query = `
      query CheckEnglish($url: URL!) {
        page(url: $url) {
          url
          wikidotInfo {
            title
          }
        }
      }
    `;

    interface CheckResponse {
      page?: { url: string; wikidotInfo?: { title: string } };
    }

    try {
      const data = await queryGraphQL<CheckResponse>(query, { url: `${en.baseUrl}/${slug}` });
      const page = data?.page;
      if (!page || !page.wikidotInfo) return null;
      return { url: page.url, slug, title: page.wikidotInfo.title || slug.toUpperCase() };
    } catch (err) {
      console.error('Erreur findEnglishFallback:', err);
      return null;
    }
  },

  async fetchScpDetailByUrl(pageUrl: string): Promise<ScpItemDetail | null> {
    const canonicalUrl = pageUrl.replace(/^https:\/\//, 'http://');
    const slug = canonicalUrl.split('/').pop() || '';

    const detailQuery = `
      query GetScpByUrl($url: URL!) {
        page(url: $url) {
${SELECTION_DETAIL}
        }
      }
    `;

    interface DetailResponse {
      page?: NoeudDetail;
    }

    try {
      const data = await queryGraphQL<DetailResponse>(detailQuery, { url: canonicalUrl });
      const page = data?.page;
      const wiki = page?.wikidotInfo;

      if (!page || !wiki || !wiki.textContent) return null;

      const title = wiki.title || slug.toUpperCase();
      const tags = wiki.tags || [];

      return {
        url: page.url,
        slug,
        title,
        scpNumber: extractScpNumber(slug),
        alternateTitle: page.alternateTitles?.[0]?.title,
        rating: wiki.rating,
        tags,
        objectClass: extractObjectClass(tags),
        thumbnailUrl: wiki.thumbnailUrl,
        textContent: wiki.textContent,
        source: wiki.source,
        createdAt: wiki.createdAt,
        translations: page.translations?.map(t => ({ url: t.url })),
        attributions: versAttributions(page)
      };
    } catch (err) {
      console.error(`Erreur fetchScpDetailByUrl:`, err);
      return null;
    }
  }
};
