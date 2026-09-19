/**
 * Briques partagées du constructeur d'entités : transport Crom, normalisation des
 * désignations, et lecture des annuaires du wiki.
 *
 * Séparé de `build-entities.mjs` pour que la normalisation reste vérifiable seule —
 * c'est elle qui décide si deux écritures désignent la même entité, et une erreur
 * là-dedans dédouble silencieusement la moitié du répertoire.
 */

export const CROM_ENDPOINT = 'https://api.crom.avn.sh/graphql';

// ------------------------------------------------------------------- transport

/**
 * Le limiteur de rafale répond « Please wait for N seconds » : on lit le N plutôt que
 * de deviner. Les coupures réseau (ECONNRESET, rencontré sur des balayages de 25 000
 * pages) sont retentées à part — ce n'est pas une erreur GraphQL, elle n'a pas de
 * délai à lire.
 */
export async function gql(query, variables = {}) {
  for (let tentative = 0; tentative < 8; tentative++) {
    let reponse;
    try {
      reponse = await fetch(CROM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
    } catch {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    const json = await reponse.json();
    const erreur = json.errors?.[0]?.message;
    if (!erreur) return json.data;

    const attente = erreur.match(/wait for (\d+) second/i);
    if (!attente) throw new Error(`Crom : ${erreur}`);
    await new Promise(r => setTimeout(r, (parseInt(attente[1], 10) + 1) * 1000));
  }
  throw new Error('Crom : abandon après 8 tentatives.');
}

const REQUETE_SOURCE = `query($u: URL!) {
  page(url: $u) { url wikidotInfo { title source } }
}`;

/** La source Wikidot d'une page, ou `null` si elle n'existe pas sur cette branche. */
export async function sourceDe(url) {
  const data = await gql(REQUETE_SOURCE, { u: url });
  const info = data?.page?.wikidotInfo;
  if (!info?.source) return null;
  return { titre: info.title || '', source: info.source };
}

export const REQUETE_AGREGAT = `query($f: QueryAggregatePageWikidotInfosFilter) {
  aggregatePageWikidotInfos(filter: $f) { _count }
}`;

/** Combien de pages d'une branche portent un tag donné (ou en tout, sans tag). */
export async function compter(baseUrl, tag) {
  const _and = [{ url: { startsWith: baseUrl } }];
  if (tag) _and.push({ wikidotInfo: { tags: { eq: tag } } });
  const data = await gql(REQUETE_AGREGAT, { f: { _and } });
  return data.aggregatePageWikidotInfos._count;
}

// -------------------------------------------------------------- normalisation

const LETTRES_GRECQUES = {
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta',
  'η': 'eta', 'θ': 'theta', 'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
  'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma',
  'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega'
};

/**
 * Translittérations romanes des lettres grecques.
 *
 * MESURÉ : l'italien et l'espagnol écrivent « Alfa-1 » là où l'anglais écrit
 * « Alpha-1 ». Sans ces alias, `fim-alfa-1` et `fim-alpha-1` cohabitent dans le
 * répertoire comme deux unités distinctes — c'était le cas au premier balayage.
 */
const ALIAS_GRECS = {
  alfa: 'alpha', gama: 'gamma', teta: 'theta', dseta: 'zeta', csi: 'xi',
  ro: 'rho', fi: 'phi', ji: 'chi', ipsilon: 'upsilon', omicrone: 'omicron'
};

/** Retire les accents et passe en minuscules. `Bêta` et `Beta` doivent se confondre. */
export function sansAccent(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Identifiant stable d'une force d'intervention.
 *
 * MESURÉ : la même unité s'écrit `ALPHA-1`, `Alpha-1`, `Alpha-01`, `Δ-2`, `Bêta-1`,
 * `Beta-1` selon la page et la branche. Sans cette normalisation on compte 196 FIM
 * là où il y en a environ 98 — soit la moitié du répertoire en doublons.
 */
export function normaliserFim(brut) {
  let texte = String(brut).trim().toLowerCase();
  for (const [grec, latin] of Object.entries(LETTRES_GRECQUES)) {
    texte = texte.split(grec).join(latin);
  }
  texte = sansAccent(texte);
  const m = texte.match(/([a-z]{2,})[\s-]*0*(\d{1,3})/);
  if (!m) return null;
  const lettre = ALIAS_GRECS[m[1]] ?? m[1];
  return `${lettre}-${parseInt(m[2], 10)}`;
}

const GRECQUES_LATIN =
  'alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega';

/**
 * Le motif qui reconnaît une désignation de FIM dans un texte.
 *
 * Le préfixe (`MTF`, `FIM`, `SPM`…) est EXIGÉ : sans lui, « Delta 4 » attraperait des
 * numéros de version, des coordonnées et des noms de salles. C'est ce qui distingue
 * une extraction utilisable d'un bruit ingérable.
 */
export const MOTIF_FIM = new RegExp(
  `\\b(?:MTF|FIM|SPM|MOB|OZ)[\\s-]*((?:${GRECQUES_LATIN}|b[eê]ta|z[eê]ta|th[eê]ta|rh[oô]|om[ée]ga)[\\s-]?0*\\d{1,3})\\b`,
  'gi'
);

/**
 * Identifiant stable d'une installation.
 *
 * `Site-06` et `Site-6` sont le même lieu, `Site-0` et `Site-01` ne le sont pas :
 * d'où le passage par `parseInt` plutôt qu'un simple retrait des zéros de tête.
 * `Area` (anglais) et `Zone` (français) sont la même catégorie ; on retient `zone`,
 * la terminologie du `secure-facilities-locations` francophone.
 */
export function normaliserInstallation(genre, numero) {
  const g = sansAccent(genre);
  const categorie = g.startsWith('area') || g.startsWith('zon') ? 'zone' : 'site';
  const brut = String(numero);
  const n = parseInt(brut.replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  const suffixe = brut.match(/\d+([a-z])$/i);
  const lettre = suffixe ? suffixe[1].toLowerCase() : '';
  return {
    categorie,
    id: `${categorie}-${n}${lettre}`,
    designation: `${categorie === 'zone' ? 'Zone' : 'Site'}-${n}${lettre.toUpperCase()}`
  };
}

/** Le motif qui reconnaît une installation dans un texte, toutes branches. */
export const MOTIF_INSTALLATION =
  /\b(Sites?|Areas?|Zones?|Sito|Zona|Standort|Sitio)[-\s]?(\d{1,3}[A-Za-z]?)\b/g;

/** Identifiant d'entité : catégorie plus fragment ASCII stable. */
export function idEntite(categorie, cle) {
  const propre = sansAccent(cle)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${categorie}-${propre}`;
}

// ----------------------------------------------------------- lecture d'annuaire

/** Enlève le balisage Wikidot d'un titre : `[[[slug|Titre]]]`, `**gras**`, images. */
export function nettoyerTitre(brut) {
  return String(brut)
    .replace(/\[\[\[([^\]|]*)\|([^\]]*)\]\]\]/g, '$2')
    .replace(/\[\[\[([^\]]*)\]\]\]/g, '$1')
    .replace(/##[^|#]*\|([^#]*)##/g, '$1')
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(/\[[^\s\]]+\s+([^\]]*)\]/g, '$1')
    .replace(/[*_]{2,}/g, '')
    .replace(/@@\s*@@/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Enlève le balisage d'un paragraphe de description et le tronque proprement. */
export function nettoyerResume(brut, max = 420) {
  const texte = nettoyerTitre(brut).replace(/^\*\*[^:]*:\*\*\s*/, '');
  if (!texte) return undefined;
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max);
  const point = coupe.lastIndexOf('. ');
  return (point > max * 0.5 ? coupe.slice(0, point + 1) : coupe) + '…';
}

/**
 * Découpe la source d'un annuaire en blocs, un par entité.
 *
 * DEUX STRUCTURES COEXISTENT, et il faut les deux. Vérifié sur les dix branches :
 *   - `groups-of-interest` anglais, `departments`, `task-forces` : blocs `[[# ancre]]`
 *     (50, 27 et 113 ancres) — et les ancres sont IDENTIQUES d'une branche à l'autre
 *     pour les départements et les FIM, ce qui en fait la clé de réconciliation.
 *   - `secure-facilities-locations` : 4 ancres pour 118 titres `+ Site-19` ; et le
 *     `groups-of-interest` FRANÇAIS n'a aucune ancre du tout.
 * Se limiter aux ancres perdait les 118 installations nommées et toutes les factions
 * françaises — mesuré au premier balayage, qui ne rendait que des `Site-N` anonymes.
 */
export function blocs(source) {
  const ancres = [...source.matchAll(/\[\[#\s*([^\]\s]+)\s*\]\]/g)];
  if (ancres.length >= 5) {
    return ancres.map((m, i) => ({
      cle: m[1],
      corps: source.slice(m.index + m[0].length, i + 1 < ancres.length ? ancres[i + 1].index : source.length)
    }));
  }

  const titres = [...source.matchAll(/^\+{1,3}\s+(.+)$/gm)];
  return titres.map((m, i) => ({
    cle: null,
    corps: source.slice(m.index, i + 1 < titres.length ? titres[i + 1].index : source.length)
  }));
}

/**
 * Le centre auquel un bloc renvoie — `anderson-robotics-hub`, `third-law-hub`.
 *
 * C'est la clé de réconciliation des factions. Leurs tags ne se traduisent pas
 * (`serpents-hand` en anglais, `main-du-serpent` en français) et le français n'a pas
 * d'ancres, mais TOUTES les branches renvoient vers le même centre anglais. Sans ça,
 * « La Main du Serpent » et « The Serpent's Hand » restent deux entités séparées et
 * l'héritage de l'original ne remonte jamais dans la fiche française.
 */
export function hubDuBloc(corps) {
  const texte = String(corps);

  // 1. Le titre, quand il porte le lien — c'est la forme anglaise et italienne :
  //        + [[[*ambrose-restaurant-hub|Ambrose Restaurants]]]
  const ligneTitre = texte.match(/^\+{1,3}\s+(.+)$/m);
  if (ligneTitre) {
    const m = ligneTitre[1].match(/\[\[\[\*?([a-z0-9][a-z0-9-]*-hub)/i);
    if (m) return m[1].toLowerCase();
  }

  // 2. Sinon le corps, MAIS seulement s'il ne cite qu'un seul centre. Le français
  //    n'a pas de lien dans ses titres, il faut donc lire le corps ; et un corps qui
  //    cite plusieurs centres est ambigu — c'est ainsi que l'Insurrection du Chaos
  //    absorbait l'Initiative Horizon et Obskura, et « Personne » le Collectif
  //    Oneiroi. Un seul centre cité, c'est le sien.
  const centres = new Set(
    [...texte.matchAll(/\[\[\[\*?([a-z0-9][a-z0-9-]*-hub)/gi)].map(m => m[1].toLowerCase())
  );
  return centres.size === 1 ? [...centres][0] : null;
}

/**
 * Clé d'une personne, titres retirés.
 *
 * Les tags du personnel ne se traduisent pas non plus (`dr-clef` contre
 * `doctor-clef`), mais le nom, lui, est le même : « Dr Alto Clef » et
 * « Dr. Alto Clef » se réduisent tous deux à `alto-clef`.
 */
export function normaliserNomPersonne(nom) {
  const propre = sansAccent(nom)
    .replace(/["“”'’«»()]/g, ' ')
    .replace(/\b(dr|dre|drs|doctor|doctora|docteur|docteure|prof|professeur|professor|chercheur|chercheuse|researcher|investigador|agent|agente|agt|directeur|directrice|director|lt|cpt|capitaine|captain|sr|jr|technicien|technician|junior|senior)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return propre || sansAccent(nom).replace(/[^a-z0-9]+/g, '-');
}

/** Le premier titre `+ …` d'un bloc, nettoyé. */
export function titreDuBloc(corps) {
  const m = corps.match(/^\+{1,3}\s+(.+)$/m);
  return m ? nettoyerTitre(m[1]) : null;
}

/** Le tag Crom déclaré par un bloc, s'il y en a un. */
export function tagDuBloc(corps) {
  const m = corps.match(/system:page-tags\/tag\/([^\s\]|#]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return m[1].toLowerCase();
  }
}

/** Le paragraphe de présentation d'un bloc. */
export function resumeDuBloc(corps) {
  const m = corps.match(
    /\*\*(?:Overview|Aperçu|Présentation|Description|Task Force Mission|Mission|Panoramica|Übersicht)\s*:?\*\*\s*([^\n]+)/i
  );
  if (m) return nettoyerResume(m[1]);
  const paragraphes = corps
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p && !p.startsWith('[[') && !p.startsWith('+') && !p.startsWith(','));
  return paragraphes.length ? nettoyerResume(paragraphes[0]) : undefined;
}

/**
 * Les slugs de dossiers cités par un bloc.
 *
 * Les cibles à deux-points sont des pages système (`system:page-tags`, `nav:side`)
 * sauf `deleted:`, qui reste un vrai dossier — l'index de corpus en contient.
 */
export function liensDuBloc(corps) {
  const slugs = new Set();
  for (const m of String(corps).matchAll(/\[\[\[([^\]|#]+)/g)) {
    const cible = m[1].trim().toLowerCase();
    if (!cible || cible.startsWith('http') || cible.startsWith('/')) continue;
    if (cible.includes(':') && !cible.startsWith('deleted:')) continue;
    slugs.add(cible.replace(/\s+/g, '-'));
  }
  return [...slugs];
}

/**
 * Les fiches d'un annuaire de personnel.
 *
 * Motif mesuré sur fr et en : `**[…/system:page-tags/tag/<tag> <Nom>] :** <résumé>`.
 * Il donne d'un coup le tag Crom, le nom affiché et la description — la forme la plus
 * riche du corpus (184 fiches en anglais, 182 en japonais, 79 en français).
 */
export function fichesPersonnel(source) {
  const fiches = [];
  const motif =
    /\*\*\[(?:https?:\/\/[^\s/]+)?\/?system:page-tags\/tag\/([^\s\]]+)\s+([^\]]+)\]\s*[^:\n]{0,6}:\*\*\s*([^\n]*)/g;
  for (const m of source.matchAll(motif)) {
    let tag;
    try {
      tag = decodeURIComponent(m[1]).toLowerCase();
    } catch {
      tag = m[1].toLowerCase();
    }
    const nom = nettoyerTitre(m[2]);
    if (!tag || !nom) continue;
    fiches.push({ tag, nom, resume: nettoyerResume(m[3]), liens: liensDuBloc(m[3]) });
  }
  return fiches;
}
