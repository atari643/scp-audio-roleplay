/**
 * Construction du répertoire d'entités de la Fondation et de ses arêtes.
 *
 * POURQUOI CE SCRIPT EXISTE. Crom n'a pas de graphe d'entités : son schéma ne connaît
 * que des pages, des tags et des utilisateurs. « Ce dossier parle du Site-19 » doit
 * donc être DÉRIVÉ. Mais la communauté maintient déjà l'annuaire sous forme de pages
 * (`groups-of-interest`, `personnel-and-character-dossier`, `secure-facilities-locations`…)
 * et ces pages DÉCLARENT le tag Crom de chaque entité. On lit ce que le wiki écrit,
 * on n'invente rien : c'est toute la différence avec les `iconicScps` saisis à la main
 * que ce script remplace.
 *
 * L'ANGLAIS CLASSE, LES TRADUCTIONS HÉRITENT. Mesuré sur 600 dossiers par branche,
 * en héritant des relations de l'original via `translationOf` :
 *     fr  298 -> 417 arêtes      it  56 -> 281 (x5)      ru  3 -> 228 (x76)
 * La raison : les motifs d'extraction sont écrits dans la langue de la branche —
 * « Зона-19 » n'est pas « Site-19 ». Passer par l'original anglais contourne la
 * localisation entière. D'où l'ordre imposé : `--lang en` d'abord.
 *
 * Usage :
 *   node scripts/build-entities.mjs --profil            profils de branche (tags de type)
 *   node scripts/build-entities.mjs --repertoire        src/data/entities.json
 *   node scripts/build-entities.mjs --lang en           src/data/entityIndex.en.json
 *   node scripts/build-entities.mjs --lang fr --limit 800    échantillon, pour vérifier
 *   node scripts/build-entities.mjs --reconcilier       rapport sur departmentsData.ts
 *   node scripts/build-entities.mjs --classes           tags de classe de chaque branche
 *   node scripts/build-entities.mjs --iconiques --lang en   src/data/catalogue.en.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  gql,
  sourceDe,
  compter,
  idEntite,
  normaliserFim,
  normaliserInstallation,
  sansAccent,
  MOTIF_FIM,
  MOTIF_INSTALLATION,
  blocs,
  hubDuBloc,
  normaliserNomPersonne,
  titreDuBloc,
  tagDuBloc,
  resumeDuBloc,
  liensDuBloc,
  fichesPersonnel,
  nettoyerTitre
} from './entities-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, 'src', 'data');

/**
 * Les branches, recopiées de `SUPPORTED_LANGUAGES` (src/types/scp.ts).
 * L'anglais est en tête : c'est l'ordre de construction, pas un détail de présentation.
 */
const BRANCHES = [
  { code: 'en', baseUrl: 'http://scp-wiki.wikidot.com' },
  { code: 'fr', baseUrl: 'http://fondationscp.wikidot.com' },
  { code: 'es', baseUrl: 'http://lafundacionscp.wikidot.com' },
  { code: 'ru', baseUrl: 'http://scp-ru.wikidot.com' },
  { code: 'de', baseUrl: 'http://scp-wiki-de.wikidot.com' },
  { code: 'ja', baseUrl: 'http://scp-jp.wikidot.com' },
  { code: 'it', baseUrl: 'http://fondazionescp.wikidot.com' },
  { code: 'pl', baseUrl: 'http://scp-pl.wikidot.com' },
  { code: 'zh-CN', baseUrl: 'http://scp-wiki-cn.wikidot.com' },
  { code: 'ko', baseUrl: 'http://scpko.wikidot.com' }
];

/**
 * Les slugs d'annuaire, par catégorie.
 *
 * Les slugs ANGLAIS sont conservés par presque toutes les branches — vérifié sur les
 * dix : `groups-of-interest` existe partout, `personnel-and-character-dossier` sur
 * sept. Les variantes locales connues suivent ; une page absente est simplement
 * ignorée, le wiki est communautaire.
 */
const ANNUAIRES = {
  chercheur: ['personnel-and-character-dossier', 'poi-complete-list'],
  faction: ['groups-of-interest', 'goi-complete-list'],
  fim: ['task-forces', 'task-forces-complete-list', 'forces-intervention-mineures'],
  installation: ['secure-facilities-locations', 'facilities-complete-list'],
  departement: ['departments', 'departments-complete-list'],
  commandement: ['o5-command-dossier']
};

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const args = { mode: null, lang: null, limit: Infinity, sortie: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profil') args.mode = 'profil';
    else if (a === '--repertoire') args.mode = 'repertoire';
    else if (a === '--reconcilier') args.mode = 'reconcilier';
    else if (a === '--iconiques') args.mode = 'iconiques';
    else if (a === '--classes') args.mode = 'classes';
    else if (a === '--lang') { args.lang = argv[++i]; args.mode = args.mode ?? 'aretes'; }
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--out') args.sortie = argv[++i];
  }
  return args;
}

function lireJson(fichier, defaut = null) {
  try {
    return JSON.parse(fs.readFileSync(fichier, 'utf8'));
  } catch {
    return defaut;
  }
}

function ecrireJson(fichier, valeur) {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, JSON.stringify(valeur));
  return (fs.statSync(fichier).size / 1024).toFixed(0);
}

// ------------------------------------------------------------------ profils

/**
 * Découvre les tags de type d'une branche au lieu de les supposer.
 *
 * INDISPENSABLE, ET MESURÉ : la branche russe n'utilise pas le tag `scp` DU TOUT.
 * `tags: { eq: 'scp' }` sur scp-ru renvoie 0, alors qu'elle compte 4 653 dossiers
 * tagués `объект`. Un tag codé en dur produit un index vide, en silence.
 */
const CANDIDATS_DOSSIER = ['scp', 'объект', 'obiekt', 'objekt', 'oggetto'];
const CANDIDATS_CONTE = ['conte', 'tale', 'relato', 'рассказ', 'geschichte', 'racconto', 'opowiadanie', '故事', '이야기'];
const CANDIDATS_CENTRE = ['centre', 'hub', 'хаб', 'portalseite', 'nexus', 'centro', 'ハブ', '허브'];

const REQUETE_TAGS = `query($f: QueryPagesFilter, $a: ID) {
  pages(filter: $f, sort: { key: URL, order: ASC }, first: 100, after: $a) {
    pageInfo { hasNextPage endCursor }
    edges { node { wikidotInfo { tags } } }
  }
}`;

async function profilerBranche(branche) {
  const pages = await compter(branche.baseUrl);

  const essayer = async candidats => {
    let meilleur = null;
    for (const tag of candidats) {
      const n = await compter(branche.baseUrl, tag);
      if (n > 0 && (!meilleur || n > meilleur.n)) meilleur = { tag, n };
    }
    return meilleur;
  };

  let dossier = await essayer(CANDIDATS_DOSSIER);
  const conte = await essayer(CANDIDATS_CONTE);
  const centre = await essayer(CANDIDATS_CENTRE);

  // Aucun candidat connu : on balaie un échantillon et on propose le tag le plus
  // fréquent qui ne soit ni une langue, ni une classe d'objet, ni un tag technique.
  if (!dossier) {
    const freq = new Map();
    let curseur = null;
    let vus = 0;
    while (vus < 1500) {
      const data = await gql(REQUETE_TAGS, {
        f: { _and: [{ url: { startsWith: branche.baseUrl } }] },
        a: curseur
      });
      const edges = data?.pages?.edges ?? [];
      if (edges.length === 0) break;
      for (const { node } of edges) {
        vus++;
        for (const t of node.wikidotInfo?.tags ?? []) freq.set(t, (freq.get(t) ?? 0) + 1);
      }
      if (!data.pages.pageInfo.hasNextPage) break;
      curseur = data.pages.pageInfo.endCursor;
    }
    const exclus = /^(_|crom:|[a-z]{2}(-[a-z]{2})?$)/i;
    const [tag, n] = [...freq].filter(([t]) => !exclus.test(t)).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (tag) dossier = { tag, n: await compter(branche.baseUrl, tag) };
  }

  return {
    code: branche.code,
    baseUrl: branche.baseUrl,
    tagDossier: dossier?.tag ?? 'scp',
    tagConte: conte?.tag,
    tagCentre: centre?.tag,
    dossiers: dossier?.n ?? 0,
    pages
  };
}

async function construireProfils(args) {
  const cibles = args.lang ? BRANCHES.filter(b => b.code === args.lang) : BRANCHES;
  const fichier = path.join(DATA, 'branchProfiles.json');
  const profils = lireJson(fichier, {}) ?? {};

  console.log('code   pages  dossiers  tag dossier      tag conte        tag centre');
  for (const branche of cibles) {
    const profil = await profilerBranche(branche);
    profils[profil.code] = profil;
    console.log(
      `${profil.code.padEnd(6)} ${String(profil.pages).padStart(6)} ${String(profil.dossiers).padStart(9)}  ` +
        `${profil.tagDossier.padEnd(16)} ${(profil.tagConte ?? '—').padEnd(16)} ${profil.tagCentre ?? '—'}`
    );
  }

  const ko = ecrireJson(fichier, profils);
  console.log(`\nécrit : ${path.relative(ROOT, fichier)} (${ko} Ko)`);
  return profils;
}

// --------------------------------------------------------------- répertoire

/** Fusionne une entité dans le répertoire, en réconciliant par identifiant. */
function fusionner(repertoire, entite) {
  const existante = repertoire.get(entite.id);
  if (!existante) {
    repertoire.set(entite.id, entite);
    return entite;
  }
  Object.assign(existante.noms, entite.noms);
  Object.assign(existante.pages, entite.pages);
  for (const [langue, tags] of Object.entries(entite.tags)) {
    existante.tags[langue] = [...new Set([...(existante.tags[langue] ?? []), ...tags])];
  }
  // Fusion par branche, comme au-dessus. C'était auparavant « premier arrivé,
  // premier servi » : l'anglais étant construit en premier, son résumé écrasait
  // les neuf autres, qui étaient lues puis jetées.
  existante.resume ??= {};
  Object.assign(existante.resume, entite.resume);
  if (!existante.designation && entite.designation) existante.designation = entite.designation;
  return existante;
}

/**
 * Lit un annuaire et en tire des entités.
 *
 * `liens` récolte au passage les dossiers que l'annuaire cite sous chaque entité :
 * c'est la certitude « annuaire », la plus forte après le tag.
 */
function entitesDeLAnnuaire(categorie, source, langue, url, liens, titrePage) {
  const trouvees = [];

  const noter = (id, slugs) => {
    if (!slugs?.length) return;
    const deja = liens.get(id) ?? new Set();
    for (const slug of slugs) deja.add(slug);
    liens.set(id, deja);
  };

  /**
   * Un bloc décrit-il vraiment une entité ?
   *
   * Les annuaires contiennent des sections de service — sommaire, crédits, « Related
   * Pages », « Comment contribuer » — qui ont une ancre et un titre comme les autres.
   * Le signal structurel qui les sépare est le panneau `content-panel` dont le wiki
   * entoure chaque vraie fiche, ou à défaut un paragraphe de présentation. La seule
   * présence d'un lien de tag ne suffit PAS : « About this Page » en porte un
   * (`group-hub`) et se faisait passer pour une faction. Un filtre par liste de titres
   * aurait été à refaire dans les dix langues ; celui-ci n'en dépend pas.
   */
  const blocDeFond = corps =>
    /content-panel/.test(corps) ||
    /\*\*(?:Overview|Aperçu|Présentation|Description|Task Force Mission|Mission|Panoramica|Übersicht)\s*:?\*\*/i.test(corps);

  const ajouter = (id, cat, nom, tag, resume, designation) => {
    if (!nom || !id || /-$/.test(id)) return;
    trouvees.push({
      id,
      categorie: cat,
      noms: { [langue]: nom },
      tags: tag ? { [langue]: [tag] } : {},
      pages: { [langue]: url },
      designation,
      // Indexé par branche comme `noms` et `pages` : l'annuaire de chaque langue
      // écrit sa propre présentation, et `resumeDuBloc()` sait déjà les lire
      // toutes. Une chaîne unique faisait qu'un francophone lisait un nom
      // français suivi d'un résumé anglais.
      resume: resume ? { [langue]: resume } : {}
    });
  };

  // Le personnel utilise le motif en ligne `**[…/tag/X Nom] :** description`.
  // La clé est le NOM sans titre, pas le tag : `dr-clef` et `doctor-clef` désignent
  // la même personne, et sans cette réconciliation la fiche française ne reçoit
  // jamais les dossiers hérités de l'original anglais.
  if (categorie === 'chercheur') {
    for (const fiche of fichesPersonnel(source)) {
      const id = idEntite('chercheur', normaliserNomPersonne(fiche.nom));
      ajouter(id, 'chercheur', fiche.nom, fiche.tag, fiche.resume);
      noter(id, fiche.liens);
    }
    return trouvees;
  }

  // Les installations portent leur désignation dans leur titre de section.
  if (categorie === 'installation') {
    for (const bloc of blocs(source)) {
      const titre = titreDuBloc(bloc.corps);
      if (!titre) continue;
      // « Sites 00-09 », « Areas 10-19 », « Sites 300+ » : des intertitres de
      // regroupement, pas des installations. Sans ce rejet, Site-0 héritait du nom
      // « Sites 00-09 » et 81 dossiers se rattachaient à un « Site-300 » qui n'était
      // que le titre d'une section.
      if (/^\s*(?:sites?|areas?|zones?|sitios?|zonas?)\s+\d+\s*(?:[-–—]\s*\d+|\+)/i.test(titre)) continue;
      MOTIF_INSTALLATION.lastIndex = 0;
      const m = MOTIF_INSTALLATION.exec(titre);
      if (!m) continue;
      const norme = normaliserInstallation(m[1], m[2]);
      if (!norme) continue;
      ajouter(
        norme.id,
        norme.categorie,
        titre,
        tagDuBloc(bloc.corps),
        resumeDuBloc(bloc.corps),
        norme.designation
      );
      noter(norme.id, liensDuBloc(bloc.corps));
    }

    // Les désignations citées hors des sections nommées restent du VOCABULAIRE : ce
    // sont des installations réelles, sans page dédiée. Elles ne servent qu'à filtrer
    // les mentions — sans ce filtre, un texte écrivant « Site-404 » une seule fois
    // fabriquerait une installation fantôme. Mesuré : le vocabulaire complet fait
    // passer le rattachement des dossiers français de 15 % à 23 %.
    MOTIF_INSTALLATION.lastIndex = 0;
    for (const m of source.matchAll(MOTIF_INSTALLATION)) {
      const norme = normaliserInstallation(m[1], m[2]);
      if (!norme) continue;
      trouvees.push({
        id: norme.id,
        categorie: norme.categorie,
        noms: {},
        tags: {},
        pages: {},
        designation: norme.designation
      });
    }
    return trouvees;
  }

  // Les FIM sont réconciliées par leur désignation grecque. Vérifié : les ancres du
  // `task-forces` français et anglais sont identiques (`alpha-1`, `beta-777`…).
  if (categorie === 'fim') {
    for (const bloc of blocs(source)) {
      const titre = titreDuBloc(bloc.corps);
      const cle = normaliserFim(bloc.cle ?? '') ?? (titre ? normaliserFim(titre) : null);
      if (!cle) continue;
      const id = idEntite('fim', cle);
      const [lettre, numero] = cle.split('-');
      ajouter(
        id,
        'fim',
        titre ?? cle,
        tagDuBloc(bloc.corps),
        resumeDuBloc(bloc.corps),
        `FIM ${lettre.charAt(0).toUpperCase()}${lettre.slice(1)}-${numero}`
      );
      noter(id, liensDuBloc(bloc.corps));
    }
    return trouvees;
  }

  // Le Commandement O5 est UNE entité, pas un annuaire : sa page est un récit continu
  // (0 ancre, 1 titre, mesuré). On la prend telle quelle.
  if (categorie === 'commandement') {
    const id = 'commandement-o5';
    // Le titre de la PAGE, pas le premier `+` : la page O5 s'ouvre sur une bannière
    // décorative (« HELLO AND WELCOME, FRIEND. ») qui n'est pas son nom.
    ajouter(id, 'commandement', titrePage || 'Conseil O5', tagDuBloc(source), resumeDuBloc(source), 'O5');
    noter(id, liensDuBloc(source));
    return trouvees;
  }

  // Départements et factions : un bloc par entité, mais des clés différentes.
  //
  // Les départements se réconcilient par ANCRE — vérifié, `departments` français et
  // anglais partagent `antimemetics`, `alchemy-department`, `delta-t`…
  // Les factions, non : le `groups-of-interest` français n'a AUCUNE ancre et leurs
  // tags ne se traduisent pas (`serpents-hand` contre `main-du-serpent`). Toutes les
  // branches renvoient en revanche vers le même centre anglais, d'où la clé `*-hub`.
  for (const bloc of blocs(source)) {
    const titre = titreDuBloc(bloc.corps);
    if (!titre || !blocDeFond(bloc.corps)) continue;
    const tag = tagDuBloc(bloc.corps);
    const cle =
      categorie === 'faction'
        ? hubDuBloc(bloc.corps) ?? tag ?? bloc.cle ?? titre
        : bloc.cle ?? tag ?? titre;
    const id = idEntite(categorie, cle);
    ajouter(id, categorie, titre, tag, resumeDuBloc(bloc.corps));
    noter(id, liensDuBloc(bloc.corps));
  }

  return trouvees;
}

/**
 * Réconcilie les tags d'entité d'une branche avec ceux de l'anglais, en interrogeant
 * Crom sur les pages elles-mêmes.
 *
 * POURQUOI IL FAUT ÇA. Les annuaires ne donnent aucune identité inter-branches pour
 * les factions et le personnel : leurs tags ne se traduisent pas (`main-du-serpent`
 * contre `serpents-hand`, `dr-clef` contre `doctor-clef`), le `groups-of-interest`
 * français n'a pas d'ancres, et ses titres ne portent pas de lien de centre. Restait
 * une seule preuve : les DOSSIERS. Si les pages taguées `main-du-serpent` sont, dans
 * leur grande majorité, des traductions de pages taguées `serpents-hand`, alors les
 * deux tags désignent le même groupe. C'est le wiki qui l'affirme, pas nous.
 *
 * Sans cette passe, une fiche française n'affiche que les dossiers tagués en français
 * et rate tout ce que la traduction hérite de l'original — précisément le contraire
 * du but recherché.
 */
const REQUETE_ECHANTILLON = `query($f: QueryPagesFilter) {
  pages(filter: $f, sort: { key: RATING, order: DESC }, first: 25) {
    edges { node { translationOf { wikidotInfo { tags } } } }
  }
}`;

async function relierTagsParTraduction(entites, seuil = 0.5) {
  const tagsAnglais = new Map();
  for (const e of entites) {
    for (const tag of e.tags.en ?? []) tagsAnglais.set(tag.toLowerCase(), e.id);
  }

  const paires = [];
  const candidates = entites.filter(
    e => (e.categorie === 'faction' || e.categorie === 'chercheur') && !(e.tags.en ?? []).length
  );

  let examinees = 0;
  for (const entite of candidates) {
    for (const [langue, tags] of Object.entries(entite.tags)) {
      const base = BRANCHES.find(b => b.code === langue)?.baseUrl;
      if (!base) continue;
      for (const tag of tags) {
        examinees++;
        let data;
        try {
          data = await gql(REQUETE_ECHANTILLON, {
            f: { _and: [{ url: { startsWith: base } }, { wikidotInfo: { tags: { eq: tag } } }] }
          });
        } catch {
          continue;
        }
        const votes = new Map();
        let avecOriginal = 0;
        for (const { node } of data?.pages?.edges ?? []) {
          const tagsOriginal = node.translationOf?.wikidotInfo?.tags;
          if (!tagsOriginal) continue;
          avecOriginal++;
          const vus = new Set();
          for (const t of tagsOriginal) {
            const cible = tagsAnglais.get(String(t).toLowerCase());
            if (cible && !vus.has(cible)) {
              vus.add(cible);
              votes.set(cible, (votes.get(cible) ?? 0) + 1);
            }
          }
        }
        if (avecOriginal < 3) continue;
        const [meilleur, n] = [...votes].sort((a, b) => b[1] - a[1])[0] ?? [];
        // La cible doit être de la même catégorie : un dossier tagué à la fois d'une
        // faction et d'un personnage ne doit pas les confondre.
        const cible = entites.find(x => x.id === meilleur);
        if (meilleur && cible?.categorie === entite.categorie && n / avecOriginal >= seuil) {
          paires.push({ de: entite.id, vers: meilleur, confiance: n / avecOriginal });
        }
        break;
      }
    }
  }

  console.log(`  réconciliation par traduction : ${paires.length} rapprochements sur ${examinees} tags examinés`);
  return paires;
}

/**
 * Seconde passe : fusionne les entités qui se sont retrouvées sous deux clés.
 *
 * Une même entité peut arriver par deux annuaires aux ancres différentes — la
 * Division Antimémétique est `antimemetics` dans `departments` et
 * `antimemetics-division` dans `departments-complete-list`. Le tag Crom, lui, est le
 * même : c'est la preuve d'identité la plus sûre dont on dispose, puisque c'est celle
 * que le wiki utilise pour lister les dossiers.
 *
 * À défaut de tag, un nom identique dans une même langue et une même catégorie sert
 * de repli. On ne fusionne JAMAIS entre catégories : un site et un département
 * homonymes restent deux entités.
 */
function fusionnerDoublons(entites, pairesSupplementaires = []) {
  const parent = new Map();
  const racine = id => {
    let r = id;
    while (parent.get(r) && parent.get(r) !== r) r = parent.get(r);
    return r;
  };
  for (const e of entites) parent.set(e.id, e.id);

  // L'INVARIANT : le tag anglais est l'identité. Deux entités qui portent des tags
  // anglais distincts sont deux entités, quoi que suggèrent leurs noms ou leurs
  // centres — sans ce garde-fou, « Are We Cool Yet? » absorbait
  // « Marshall, Carter & Dark », qui disparaissait du répertoire.
  const tagsEn = new Map();
  for (const e of entites) {
    const propres = (e.tags.en ?? []).map(t => t.toLowerCase());
    if (propres.length) tagsEn.set(e.id, new Set(propres));
  }
  const compatibles = (ra, rb) => {
    const a = tagsEn.get(ra);
    const b = tagsEn.get(rb);
    if (!a || !b) return true;
    for (const t of a) if (b.has(t)) return true;
    return false;
  };
  const unir = (a, b) => {
    const [ra, rb] = [racine(a), racine(b)];
    if (ra === rb || !compatibles(ra, rb)) return;
    parent.set(rb, ra);
    const ta = tagsEn.get(ra);
    const tb = tagsEn.get(rb);
    if (ta && tb) for (const t of tb) ta.add(t);
    else if (tb) tagsEn.set(ra, tb);
  };

  const parTag = new Map();
  const parNom = new Map();
  for (const e of entites) {
    for (const tags of Object.values(e.tags)) {
      for (const tag of tags) {
        const cle = `${e.categorie}|${tag}`;
        if (parTag.has(cle)) unir(parTag.get(cle), e.id);
        else parTag.set(cle, e.id);
      }
    }
    for (const [langue, nom] of Object.entries(e.noms)) {
      const cle = `${e.categorie}|${langue}|${sansAccent(nom)}`;
      if (parNom.has(cle)) unir(parNom.get(cle), e.id);
      else parNom.set(cle, e.id);
    }
  }

  for (const { de, vers } of pairesSupplementaires) unir(vers, de);

  const fusionnees = new Map();
  for (const e of entites) {
    const id = racine(e.id);
    const cible = fusionnees.get(id);
    if (!cible) {
      fusionnees.set(id, {
        ...e,
        id,
        noms: { ...e.noms },
        tags: { ...e.tags },
        pages: { ...e.pages },
        resume: { ...(e.resume ?? {}) }
      });
      continue;
    }
    for (const [langue, nom] of Object.entries(e.noms)) cible.noms[langue] ??= nom;
    for (const [langue, page] of Object.entries(e.pages)) cible.pages[langue] ??= page;
    for (const [langue, tags] of Object.entries(e.tags)) {
      cible.tags[langue] = [...new Set([...(cible.tags[langue] ?? []), ...tags])];
    }
    // `??=` par branche, pas sur le champ entier : deux variantes d'une même
    // entité peuvent chacune n'avoir que la moitié des langues.
    cible.resume ??= {};
    for (const [langue, resume] of Object.entries(e.resume ?? {})) cible.resume[langue] ??= resume;
    cible.designation ??= e.designation;
  }
  return { entites: [...fusionnees.values()], racine };
}

async function construireRepertoire(args) {
  const repertoire = new Map();
  const liens = new Map();
  const branches = [];
  const cibles = args.lang ? BRANCHES.filter(b => b.code === args.lang) : BRANCHES;

  for (const branche of cibles) {
    let lues = 0;
    for (const [categorie, slugs] of Object.entries(ANNUAIRES)) {
      for (const slug of slugs) {
        const url = `${branche.baseUrl}/${slug}`;
        let page;
        try {
          page = await sourceDe(url);
        } catch {
          continue;
        }
        if (!page) continue;
        lues++;
        for (const entite of entitesDeLAnnuaire(categorie, page.source, branche.code, url, liens, page.titre)) {
          fusionner(repertoire, entite);
        }
      }
    }
    if (lues > 0) branches.push(branche.code);
    const parBranche = [...repertoire.values()].filter(e => e.noms[branche.code]).length;
    console.log(`  ${branche.code.padEnd(6)} ${String(lues).padStart(2)} annuaires lus · ${parBranche} entités nommées`);
  }

  // Les entités sans nom lisible ne servent à rien dans une liste.
  const brutes = [...repertoire.values()];
  // Premier passage : les identités certaines (tag partagé, nom identique).
  const { entites: intermediaires } = fusionnerDoublons(brutes);
  // Second passage : ce que seule l'interrogation des dossiers peut établir.
  const paires = await relierTagsParTraduction(intermediaires);
  const { entites, racine } = fusionnerDoublons(brutes, paires);

  // Les liens d'annuaire pointent vers les identifiants d'AVANT fusion : sans ce
  // report, la moitié des dossiers cités se rattacherait à une entité disparue.
  const liensFusionnes = new Map();
  for (const [id, slugs] of liens) {
    const cible = racine(id);
    const deja = liensFusionnes.get(cible) ?? new Set();
    for (const slug of slugs) deja.add(slug);
    liensFusionnes.set(cible, deja);
  }
  liens.clear();
  for (const [id, slugs] of liensFusionnes) liens.set(id, slugs);

  for (const e of entites) {
    // `resume` est maintenant un objet : un objet vide est toujours truthy, donc
    // c'est le nombre de branches qui décide. Sans ça, 400 entités sans aucun
    // résumé emporteraient chacune un `{}` dans le fichier livré.
    if (!e.resume || Object.keys(e.resume).length === 0) delete e.resume;
    if (!e.designation) delete e.designation;
  }
  entites.sort((a, b) => a.categorie.localeCompare(b.categorie) || a.id.localeCompare(b.id));

  // Les résumés sortent du répertoire, un fichier par branche.
  //
  // Ils sont dix fois plus volumineux que tout le reste réuni : les garder ici
  // ferait télécharger les dix langues à qui n'en lit qu'une — mesuré, le
  // morceau passait de 82 à 221 Ko gzip. Même découpage que
  // `entityIndex.<lang>.json`, et `chargerEntites()` les charge avec l'index de
  // la branche, donc sans requête supplémentaire à l'usage.
  const resumesParLangue = {};
  for (const e of entites) {
    for (const [langue, texte] of Object.entries(e.resume ?? {})) {
      (resumesParLangue[langue] ??= {})[e.id] = texte;
    }
    delete e.resume;
  }
  for (const [langue, resumes] of Object.entries(resumesParLangue)) {
    const ko = ecrireJson(path.join(DATA, `entityResumes.${langue}.json`), resumes);
    console.log(`  résumés ${langue.padEnd(6)} ${String(Object.keys(resumes).length).padStart(4)} entités · ${ko} Ko`);
  }

  const repertoireFinal = { construitLe: new Date().toISOString(), branches, entites };
  const fichier = args.sortie ? path.resolve(args.sortie) : path.join(DATA, 'entities.json');
  const ko = ecrireJson(fichier, repertoireFinal);

  // Les liens d'annuaire vont dans un fichier à part : ils servent au calcul des
  // arêtes, pas à l'application, et ils pèsent plus lourd que le répertoire.
  const liensObjet = {};
  for (const [id, slugs] of liens) liensObjet[id] = [...slugs];
  const fichierLiens = path.join(DATA, '.entityLinks.json');
  ecrireJson(fichierLiens, liensObjet);

  const parCategorie = {};
  for (const e of entites) parCategorie[e.categorie] = (parCategorie[e.categorie] ?? 0) + 1;
  console.log(`\n=== RÉPERTOIRE — ${entites.length} entités ===`);
  for (const [cat, n] of Object.entries(parCategorie).sort((a, b) => b[1] - a[1])) {
    const avecTag = entites.filter(e => e.categorie === cat && Object.keys(e.tags).length).length;
    console.log(`  ${cat.padEnd(14)} ${String(n).padStart(5)}   dont ${avecTag} avec tag Crom`);
  }
  console.log(`  liens d'annuaire : ${liens.size} entités citant ${Object.values(liensObjet).reduce((s, v) => s + v.length, 0)} dossiers`);
  console.log(`\nécrit : ${path.relative(ROOT, fichier)} (${ko} Ko)`);
  return repertoireFinal;
}

// ------------------------------------------------------------------ arêtes

const REQUETE_ARETES = `query($f: QueryPagesFilter, $first: Int!, $a: ID) {
  pages(filter: $f, sort: { key: URL, order: ASC }, first: $first, after: $a) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      url
      wikidotInfo { tags rating textContent }
      translationOf { url wikidotInfo { tags textContent } }
    } }
  }
}`;

/**
 * L'ensemble des entités qu'un texte et des tags désignent.
 *
 * Le vocabulaire du répertoire filtre les mentions : sans lui, un texte qui écrit
 * « Site-404 » une seule fois créerait une installation fantôme. On ne retient que
 * ce que le wiki a déjà déclaré quelque part.
 */
function relationsDe(tags, texte, parTag, vocabulaire) {
  const parCertitude = { t: new Set(), m: new Set() };

  for (const brut of tags ?? []) {
    const id = parTag.get(String(brut).toLowerCase());
    if (id) parCertitude.t.add(id);
  }

  if (texte) {
    MOTIF_INSTALLATION.lastIndex = 0;
    for (const m of texte.matchAll(MOTIF_INSTALLATION)) {
      const norme = normaliserInstallation(m[1], m[2]);
      if (norme && vocabulaire.has(norme.id)) parCertitude.m.add(norme.id);
    }
    MOTIF_FIM.lastIndex = 0;
    for (const m of texte.matchAll(MOTIF_FIM)) {
      const cle = normaliserFim(m[1]);
      if (!cle) continue;
      const id = idEntite('fim', cle);
      if (vocabulaire.has(id)) parCertitude.m.add(id);
    }
    if (/\bO5-\d{1,2}\b/.test(texte) && vocabulaire.has('commandement-o5')) {
      parCertitude.m.add('commandement-o5');
    }
  }

  return parCertitude;
}

async function construireAretes(args) {
  const profils = lireJson(path.join(DATA, 'branchProfiles.json'));
  if (!profils?.[args.lang]) {
    throw new Error(`Profil de branche « ${args.lang} » absent — lance d'abord --profil.`);
  }
  const repertoire = lireJson(path.join(DATA, 'entities.json'));
  if (!repertoire) throw new Error("Répertoire absent — lance d'abord --repertoire.");

  // L'anglais classe, les traductions héritent : construire une branche traduite sans
  // l'index anglais produirait un index appauvri SANS RIEN SIGNALER. Mesuré : ru passe
  // de 228 arêtes à 3 pour 600 dossiers. On refuse plutôt que de livrer ça.
  if (args.lang !== 'en' && !fs.existsSync(path.join(DATA, 'entityIndex.en.json'))) {
    throw new Error(
      "entityIndex.en.json absent. L'anglais classe et les traductions en héritent :\n" +
        '  lance d\'abord `node scripts/build-entities.mjs --lang en`.'
    );
  }

  const profil = profils[args.lang];
  const parTag = new Map();
  const vocabulaire = new Set();
  for (const e of repertoire.entites) {
    vocabulaire.add(e.id);
    for (const tags of Object.values(e.tags)) {
      for (const t of tags) if (!parTag.has(t)) parTag.set(t, e.id);
    }
  }
  const liensAnnuaire = lireJson(path.join(DATA, '.entityLinks.json'), {}) ?? {};
  const parSlug = new Map();
  for (const [id, slugs] of Object.entries(liensAnnuaire)) {
    for (const slug of slugs) {
      const deja = parSlug.get(slug) ?? new Set();
      deja.add(id);
      parSlug.set(slug, deja);
    }
  }

  const filtre = {
    _and: [
      { url: { startsWith: profil.baseUrl } },
      { wikidotInfo: { tags: { eq: profil.tagDossier } } }
    ]
  };
  const attendu = Math.min(profil.dossiers || (await compter(profil.baseUrl, profil.tagDossier)), args.limit);
  console.log(`Branche ${profil.code} — tag « ${profil.tagDossier} », ${attendu} dossiers`);
  console.log(`Répertoire : ${vocabulaire.size} entités, ${parTag.size} tags\n`);

  const entrees = {};
  const notes = new Map();
  const stats = { t: 0, a: 0, o: 0, m: 0, union: 0, aretes: 0, traductions: 0 };
  let curseur = null;
  let vus = 0;
  const debut = Date.now();

  while (vus < attendu) {
    const data = await gql(REQUETE_ARETES, {
      f: filtre,
      first: Math.min(100, attendu - vus),
      a: curseur
    });
    const edges = data?.pages?.edges ?? [];
    if (edges.length === 0) break;

    for (const { node } of edges) {
      if (vus >= attendu) break;
      vus++;
      const info = node.wikidotInfo;
      const slug = node.url.split('/').pop()?.toLowerCase();
      if (!info || !slug) continue;

      const propres = relationsDe(info.tags, info.textContent, parTag, vocabulaire);
      const annuaire = new Set(parSlug.get(slug) ?? []);

      // L'héritage : les relations calculées sur l'original anglais. C'est le levier
      // principal — il double les arêtes en français, les multiplie par 76 en russe.
      const origine = new Set();
      const original = node.translationOf;
      if (original?.wikidotInfo) {
        stats.traductions++;
        const heritees = relationsDe(
          original.wikidotInfo.tags,
          original.wikidotInfo.textContent,
          parTag,
          vocabulaire
        );
        for (const id of heritees.t) origine.add(id);
        for (const id of heritees.m) origine.add(id);
        const slugOriginal = original.url.split('/').pop()?.toLowerCase();
        for (const id of parSlug.get(slugOriginal) ?? []) origine.add(id);
      }

      // Une entité confirmée ne doit pas réapparaître comme simple mention.
      for (const id of propres.t) { annuaire.delete(id); origine.delete(id); }
      for (const id of annuaire) origine.delete(id);
      for (const id of [...propres.t, ...annuaire, ...origine]) propres.m.delete(id);

      const entree = {};
      if (propres.t.size) entree.t = [...propres.t];
      if (annuaire.size) entree.a = [...annuaire];
      if (origine.size) entree.o = [...origine];
      if (propres.m.size) entree.m = [...propres.m];

      if (Object.keys(entree).length === 0) continue;
      entrees[slug] = entree;
      notes.set(slug, info.rating ?? 0);

      if (entree.t) stats.t++;
      if (entree.a) stats.a++;
      if (entree.o) stats.o++;
      if (entree.m) stats.m++;
      stats.union++;
      stats.aretes += (entree.t?.length ?? 0) + (entree.a?.length ?? 0) + (entree.o?.length ?? 0) + (entree.m?.length ?? 0);
    }

    curseur = data.pages.pageInfo.endCursor;
    process.stdout.write(`\r  ${vus}/${attendu} (${((100 * vus) / attendu).toFixed(0)} %)   `);
    if (!data.pages.pageInfo.hasNextPage) break;
  }
  process.stdout.write('\r' + ' '.repeat(40) + '\r');

  // Index inverse, trié par note décroissante : la liste des dossiers d'une entité
  // doit commencer par les meilleurs, sinon elle est inutilisable au-delà de 20 lignes.
  const parEntite = {};
  for (const [slug, entree] of Object.entries(entrees)) {
    for (const id of [...(entree.t ?? []), ...(entree.a ?? []), ...(entree.o ?? []), ...(entree.m ?? [])]) {
      (parEntite[id] ??= []).push(slug);
    }
  }
  for (const id of Object.keys(parEntite)) {
    parEntite[id].sort((a, b) => (notes.get(b) ?? 0) - (notes.get(a) ?? 0));
  }

  const index = {
    langue: profil.code,
    construitLe: new Date().toISOString(),
    entrees,
    parEntite
  };
  const fichier = args.sortie
    ? path.resolve(args.sortie)
    : path.join(DATA, `entityIndex.${profil.code}.json`);
  const ko = ecrireJson(fichier, index);

  const pct = n => `${((100 * n) / Math.max(1, vus)).toFixed(0)} %`;
  console.log(`=== ARÊTES ${profil.code.toUpperCase()} — ${vus} dossiers en ${((Date.now() - debut) / 1000).toFixed(0)} s ===\n`);
  console.log(`  par tag           ${String(stats.t).padStart(5)}  ${pct(stats.t)}`);
  console.log(`  par annuaire      ${String(stats.a).padStart(5)}  ${pct(stats.a)}`);
  console.log(`  hérité de l'original ${String(stats.o).padStart(2)}  ${pct(stats.o)}   (sur ${stats.traductions} traductions)`);
  console.log(`  mention seule     ${String(stats.m).padStart(5)}  ${pct(stats.m)}`);
  console.log(`  UNION             ${String(stats.union).padStart(5)}  ${pct(stats.union)}   ${stats.aretes} arêtes`);
  console.log(`  entités touchées  ${String(Object.keys(parEntite).length).padStart(5)} / ${vocabulaire.size}`);
  console.log(`\nécrit : ${path.relative(ROOT, fichier)} (${ko} Ko)`);
  return index;
}

// ------------------------------------------------------------ réconciliation

/**
 * Rapproche les 68 entités écrites à la main du répertoire tiré du wiki.
 *
 * Ne supprime rien : `departmentsData.ts` reste le calque éditorial (lore, devises,
 * couleurs), que le wiki ne donne pas. Le script dit seulement ce qui correspond à
 * quelque chose de réel et ce qui n'y correspond pas — la décision reste éditoriale.
 */
async function reconcilier() {
  const repertoire = lireJson(path.join(DATA, 'entities.json'));
  if (!repertoire) throw new Error("Répertoire absent — lance d'abord --repertoire.");

  const source = fs.readFileSync(path.join(DATA, 'departmentsData.ts'), 'utf8');
  const manuelles = [];
  for (const m of source.matchAll(/"id":\s*"([^"]+)",\s*\n\s*"slug":\s*"([^"]+)",\s*\n\s*"name":\s*"([^"]+)",\s*\n\s*"code":\s*"([^"]+)",\s*\n\s*"category":\s*"([^"]+)"/g)) {
    // Les mots-clés suivent le bloc de l'entité : ils servent de repli d'identité
    // quand le nom composé ne ressemble à rien de ce que le wiki écrit.
    const bloc = source.slice(m.index, m.index + 2600).match(/"queryKeywords":\s*\[([^\]]*)\]/);
    const clefs = bloc ? [...bloc[1].matchAll(/"([^"]+)"/g)].map(x => x[1].toLowerCase()) : [];
    manuelles.push({ id: m[1], slug: m[2], nom: m[3], code: m[4], categorie: m[5], clefs });
  }

  const mots = texte =>
    new Set(
      sansAccent(texte)
        .split(/[^a-z0-9]+/)
        .filter(x => x.length > 3)
    );

  const index = repertoire.entites.map(e => ({
    entite: e,
    mots: mots(Object.values(e.noms).join(' ') + ' ' + (e.designation ?? '') + ' ' + e.id)
  }));

  const CORRESPONDANCE = { department: 'departement', researcher: 'chercheur', goi: 'faction', site: 'site' };
  const trouvees = [];
  const orphelines = [];

  for (const manuelle of manuelles) {
    const attendue = CORRESPONDANCE[manuelle.categorie];

    // Les installations se rapprochent par leur DÉSIGNATION, jamais par les mots :
    // « Site-19 » et « Site-17 » ne partagent que le mot « site », et le nombre — la
    // seule chose qui les distingue — est trop court pour peser dans un score
    // lexical. Sans ce cas particulier, les seize sites écrits à la main se
    // rapprochaient tous du même « site-0 ».
    if (attendue === 'site') {
      MOTIF_INSTALLATION.lastIndex = 0;
      // `code` est en capitales (« SITE-19 ») et le motif ne l'est pas : on lit le nom.
      const m = MOTIF_INSTALLATION.exec(manuelle.nom);
      const norme = m ? normaliserInstallation(m[1], m[2]) : null;
      const cible = norme ? repertoire.entites.find(e => e.id === norme.id) : null;
      if (cible) trouvees.push({ manuelle, score: 1, entite: cible });
      else orphelines.push(manuelle);
      continue;
    }

    const cible = mots(manuelle.nom + ' ' + manuelle.slug);
    let meilleure = null;
    for (const candidat of index) {
      if (attendue && candidat.entite.categorie !== attendue && !(attendue === 'site' && candidat.entite.categorie === 'zone')) continue;
      let communs = 0;
      for (const mot of cible) if (candidat.mots.has(mot)) communs++;
      const score = communs / Math.max(1, Math.min(cible.size, candidat.mots.size));
      if (score > 0.34 && (!meilleure || score > meilleure.score)) {
        meilleure = { score, entite: candidat.entite };
      }
    }
    if (meilleure) {
      trouvees.push({ manuelle, ...meilleure });
      continue;
    }

    // Repli : un mot-clé qui EST un tag Crom du répertoire vaut identité. C'est ce
    // qui rattrape « Dr Jack Bright (Dr Elias Shaw) », dont le nom composé ne
    // ressemble à rien mais dont le mot-clé `bright` désigne bien `dr-bright`.
    const clefsUtiles = manuelle.clefs.filter(c => c.length >= 4);
    const parTagExact = repertoire.entites.filter(
      e =>
        e.categorie === attendue &&
        Object.values(e.tags)
          .flat()
          .some(t => clefsUtiles.includes(String(t).toLowerCase()))
    );
    // À défaut, un mot-clé présent comme mot entier dans le nom d'UNE SEULE entité de
    // la catégorie. L'unicité est la condition : « medical » ou « 963 » désigneraient
    // sinon n'importe quoi. C'est ce qui rattrape « Initiative Manna Bienfaisante »,
    // dont un seul mot sur trois recoupe « Manna Charitable Foundation » — trop peu
    // pour le score lexical, mais sans ambiguïté possible.
    const parNomUnique =
      parTagExact.length === 0
        ? repertoire.entites.filter(
            e =>
              e.categorie === attendue &&
              clefsUtiles.some(c =>
                Object.values(e.noms).some(n => new RegExp(`\b${c}\b`, 'i').test(sansAccent(n)))
              )
          )
        : [];
    const parClef =
      parTagExact.length === 1 ? parTagExact[0] : parNomUnique.length === 1 ? parNomUnique[0] : null;
    if (parClef) trouvees.push({ manuelle, score: 0.5, entite: parClef });
    else orphelines.push(manuelle);
  }

  console.log(`=== RÉCONCILIATION — ${manuelles.length} entités écrites à la main ===\n`);
  console.log(`  ${trouvees.length} rapprochées du wiki, ${orphelines.length} sans correspondance\n`);
  console.log('--- rapprochées ---');
  for (const t of trouvees.sort((a, b) => b.score - a.score)) {
    console.log(`  ${t.manuelle.id.padEnd(24)} -> ${t.entite.id.padEnd(38)} (${(t.score * 100).toFixed(0)} %)`);
  }
  console.log('\n--- sans correspondance dans le wiki ---');
  for (const o of orphelines) {
    console.log(`  ${o.categorie.padEnd(12)} ${o.id.padEnd(24)} « ${o.nom} »`);
  }

  const rapport = { construitLe: new Date().toISOString(), trouvees: trouvees.map(t => ({ manuelle: t.manuelle.id, entite: t.entite.id, score: t.score })), orphelines };
  const fichier = path.join(ROOT, 'scripts', 'reconciliation.json');
  ecrireJson(fichier, rapport);
  console.log(`\nécrit : ${path.relative(ROOT, fichier)}`);
  return rapport;
}

// ---------------------------------------------------------------- iconiques

const REQUETE_ICONIQUES = `query($f: QueryPagesFilter, $a: ID) {
  pages(filter: $f, sort: { key: RATING, order: DESC }, first: 100, after: $a) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      url
      alternateTitles { title }
      wikidotInfo { title rating voteCount tags createdAt thumbnailUrl }
    } }
  }
}`;

/**
 * Les tags de classe de la branche anglaise, et la valeur d'`ObjectClass` qu'ils
 * portent. C'est le point de départ de la découverte : tout le reste en dérive.
 */
const CLASSES_EN = [
  ['safe', 'Safe'], ['euclid', 'Euclid'], ['keter', 'Keter'], ['thaumiel', 'Thaumiel'],
  ['apollyon', 'Apollyon'], ['archon', 'Archon'], ['neutralized', 'Neutralized'],
  ['decommissioned', 'Decommissioned']
];

/**
 * Les tags de classe d'une branche, appris ou à défaut ceux de l'anglais.
 *
 * `branchProfiles.json` porte `tagsClasse` dès que `--classes` a tourné. Sans lui,
 * on retombe sur les tags anglais : c'est juste pour les branches qui les gardent
 * (ja, zh-CN, it…) et faux pour les autres, ce que le compte de dossiers sans
 * classe affiché en fin de `--iconiques` rend visible.
 */
function tagsClasseDe(profil) {
  const appris = Object.entries(profil.tagsClasse ?? {}).map(([tag, classe]) => [tag.toLowerCase(), classe]);
  const connues = new Set(appris.map(([, classe]) => classe));
  // Les classes rares — Apollyon, Archon, Decommissioned — n'apparaissent pas assez
  // dans l'échantillon de certaines branches pour être apprises. Le tag anglais leur
  // sert de repli : la plupart des branches le gardent tel quel, et un tag appris
  // passe de toute façon avant.
  return [...appris, ...CLASSES_EN.filter(([, classe]) => !connues.has(classe))];
}

// ------------------------------------------------------- découverte des classes

const REQUETE_CLASSES = `query($f: QueryPagesFilter, $a: ID) {
  pages(filter: $f, sort: { key: RATING, order: DESC }, first: 100, after: $a) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      wikidotInfo { tags }
      translationOf { wikidotInfo { tags } }
    } }
  }
}`;

/**
 * Apprend les tags de classe d'une branche en lisant ses traductions.
 *
 * POURQUOI. `--iconiques` lisait la classe d'un dossier dans une table écrite en
 * anglais et en français. Sur la branche russe, les 64 dossiers du catalogue
 * ressortaient donc « Non assigné » — le tag y est « кетер », pas « keter » — et
 * 64 sur 64 en coréen. Une carte sur deux affichait une classe fausse.
 *
 * COMMENT. Le même raisonnement que `relierTagsParTraduction()`, appliqué aux
 * classes : si les pages russes dont l'ORIGINAL anglais est tagué `keter` portent
 * presque toutes le tag « кетер », alors « кетер » est le tag Keter de la branche.
 * C'est le wiki qui l'affirme, par ses propres liens de traduction.
 *
 * Deux conditions, et les deux comptent :
 *  - `P(tag | classe) ≥ 0,5` : le tag accompagne vraiment la classe ;
 *  - `P(tag | pas cette classe) ≤ 0,08` : il ne l'accompagne QUE là. Sans cette
 *    seconde condition, le tag de type de la branche (« объект », posé sur tous
 *    les dossiers) sortirait vainqueur pour les huit classes à la fois.
 */
async function apprendreClasses(profil, echantillon = 1200) {
  // Crom ne sait pas filtrer sur `translationOf` : on prend les dossiers de la
  // branche, et on écarte à la lecture ceux qui n'ont pas d'original. Une branche
  // presque entièrement originale (l'anglaise, la française pour ses `-FR`) en
  // fournit donc moins — d'où l'échantillon large et le plafond de pages visitées.
  const filtre = {
    _and: [
      { url: { startsWith: profil.baseUrl } },
      { wikidotInfo: { tags: { eq: profil.tagDossier } } }
    ]
  };

  const pages = [];
  let curseur = null;
  let visitees = 0;
  while (pages.length < echantillon && visitees < 5000) {
    let data;
    try {
      data = await gql(REQUETE_CLASSES, { f: filtre, a: curseur });
    } catch {
      break;
    }
    const edges = data?.pages?.edges ?? [];
    if (edges.length === 0) break;
    for (const { node } of edges) {
      visitees++;
      const siens = node.wikidotInfo?.tags;
      const originaux = node.translationOf?.wikidotInfo?.tags;
      if (!siens || !originaux) continue;
      pages.push({
        siens: new Set(siens.map(t => String(t).toLowerCase())),
        originaux: new Set(originaux.map(t => String(t).toLowerCase()))
      });
      if (pages.length >= echantillon) break;
    }
    if (!data.pages.pageInfo.hasNextPage) break;
    curseur = data.pages.pageInfo.endCursor;
  }

  const appris = {};
  const journal = [];
  for (const [tagEn, classe] of CLASSES_EN) {
    const dedans = pages.filter(p => p.originaux.has(tagEn));
    const dehors = pages.filter(p => !p.originaux.has(tagEn));
    // Moins de huit exemples : on ne conclut pas. Archon et Decommissioned sont
    // rares partout, et une classe apprise sur trois pages serait un tirage.
    if (dedans.length < 8) continue;

    const compteDedans = new Map();
    for (const p of dedans) for (const t of p.siens) compteDedans.set(t, (compteDedans.get(t) ?? 0) + 1);

    let meilleur = null;
    for (const [tag, n] of compteDedans) {
      const dans = n / dedans.length;
      if (dans < 0.5) continue;
      const hors = dehors.length ? dehors.filter(p => p.siens.has(tag)).length / dehors.length : 0;
      if (hors > 0.08) continue;
      if (!meilleur || dans - hors > meilleur.marge) meilleur = { tag, marge: dans - hors, dans, hors };
    }
    if (!meilleur) continue;
    appris[meilleur.tag] = classe;
    journal.push({ classe, tag: meilleur.tag, exemples: dedans.length, dans: meilleur.dans, hors: meilleur.hors });
  }

  return { appris, journal, examinees: pages.length };
}

/**
 * `--classes` : écrit `tagsClasse` dans `branchProfiles.json`, branche par branche.
 *
 * L'anglais n'a rien à apprendre — il EST la référence — et se voit simplement
 * inscrire ses propres tags, pour que `tagsClasseDe()` n'ait pas de cas à part.
 */
async function construireClasses(args) {
  const fichier = path.join(DATA, 'branchProfiles.json');
  const profils = lireJson(fichier);
  if (!profils) throw new Error("Profils absents — lance d'abord --profil.");

  const cibles = args.lang ? [args.lang] : Object.keys(profils);
  console.log(`=== TAGS DE CLASSE — ${cibles.length} branche(s) ===\n`);

  for (const code of cibles) {
    const profil = profils[code];
    if (!profil) {
      console.log(`  ${code.padEnd(7)} profil absent, ignorée`);
      continue;
    }
    if (code === 'en') {
      profil.tagsClasse = Object.fromEntries(CLASSES_EN);
      console.log(`  en      référence — ${CLASSES_EN.length} tags inscrits tels quels`);
      continue;
    }

    const { appris, journal, examinees } = await apprendreClasses(profil);
    profil.tagsClasse = appris;
    console.log(`  ${code.padEnd(7)} ${examinees} traductions lues → ${journal.length} classes apprises`);
    for (const j of journal) {
      console.log(
        `            ${j.classe.padEnd(15)} « ${j.tag} »` +
          `   ${(j.dans * 100).toFixed(0)} % des ${j.exemples} exemples, ${(j.hors * 100).toFixed(1)} % ailleurs`
      );
    }
  }

  // Une table à plat, pour le client.
  //
  // `cromApi.extractObjectClass()` lit les tags d'une page sans savoir de quelle
  // branche elle vient, et n'avait donc qu'une liste anglaise et française écrite en
  // dur : une recherche dans la branche russe renvoyait des dossiers tous « Non
  // assigné ». Les tags appris peuvent être réunis sans risque, parce qu'aucun ne
  // désigne deux classes — « кетер » ne veut dire Keter nulle part ailleurs. Les
  // collisions sont signalées plutôt que résolues en silence.
  const plat = {};
  const collisions = [];
  for (const [code, profil] of Object.entries(profils)) {
    for (const [tag, classe] of Object.entries(profil.tagsClasse ?? {})) {
      const t = tag.toLowerCase();
      if (plat[t] && plat[t] !== classe) collisions.push(`${t} : ${plat[t]} contre ${classe} (${code})`);
      plat[t] = classe;
    }
  }

  const ko = ecrireJson(fichier, profils);
  const fichierPlat = path.join(DATA, 'tagsClasse.json');
  const koPlat = ecrireJson(fichierPlat, plat);
  console.log(`\n${Object.keys(plat).length} tags de classe réunis pour le client`);
  for (const c of collisions) console.log(`  COLLISION  ${c}`);
  console.log(`écrit : ${path.relative(ROOT, fichier)} (${ko} Ko)`);
  console.log(`écrit : ${path.relative(ROOT, fichierPlat)} (${koPlat} Ko)`);
  return profils;
}

/**
 * Régénère `ICONIC_SCPS` depuis Crom.
 *
 * Les valeurs actuelles sont inventées — notes à 12 850, vignettes et titres
 * alternatifs jamais vérifiés. Même rôle (liste de démarrage instantanée), même forme
 * `ScpItemSummary`, mais des chiffres réels.
 */
async function construireIconiques(args) {
  const profils = lireJson(path.join(DATA, 'branchProfiles.json'));
  const code = args.lang ?? 'fr';
  const profil = profils?.[code];
  if (!profil) throw new Error(`Profil « ${code} » absent — lance d'abord --profil.`);

  const combien = Number.isFinite(args.limit) ? args.limit : 64;
  const tableClasses = tagsClasseDe(profil);
  const filtre = {
    _and: [
      { url: { startsWith: profil.baseUrl } },
      { wikidotInfo: { tags: { eq: profil.tagDossier } } }
    ]
  };

  const items = [];
  let curseur = null;
  while (items.length < combien) {
    const data = await gql(REQUETE_ICONIQUES, { f: filtre, a: curseur });
    const edges = data?.pages?.edges ?? [];
    if (edges.length === 0) break;
    for (const { node } of edges) {
      if (items.length >= combien) break;
      const info = node.wikidotInfo;
      const slug = node.url.split('/').pop();
      if (!info || !slug) continue;
      const tags = (info.tags ?? []).map(t => t.toLowerCase());
      const classe = tableClasses.find(([tag]) => tags.includes(tag))?.[1] ?? 'Non assigné';
      const item = {
        url: node.url,
        slug,
        title: info.title || slug,
        scpNumber: (info.title || slug).match(/SCP-[\dA-Z-]+/i)?.[0]?.toUpperCase() ?? slug.toUpperCase(),
        objectClass: classe,
        rating: info.rating ?? 0,
        voteCount: info.voteCount ?? 0,
        createdAt: info.createdAt ?? undefined,
        tags: (info.tags ?? []).filter(t => !t.startsWith('_') && !t.startsWith('crom:')).slice(0, 6)
      };
      const alterne = node.alternateTitles?.[0]?.title;
      if (alterne) item.alternateTitle = alterne;
      if (info.thumbnailUrl) item.thumbnailUrl = info.thumbnailUrl;
      items.push(item);
    }
    if (!data.pages.pageInfo.hasNextPage) break;
    curseur = data.pages.pageInfo.endCursor;
  }

  // Un fichier par branche, et non un module unique.
  //
  // La liste servait de catalogue de démarrage quelle que soit la langue, alors
  // qu'elle n'était bâtie que sur une seule branche : un lecteur anglophone voyait
  // « SCP-101-FR » et « La Statue - L'original ». Même découpage que
  // `entityIndex.<lang>.json`, chargé à la demande par `catalogueDefaut.ts`.
  const fichier = path.join(DATA, `catalogue.${profil.code}.json`);
  const ko = ecrireJson(fichier, items);

  const sansClasse = items.filter(i => i.objectClass === 'Non assigné').length;
  console.log(`=== CATALOGUE DE DÉMARRAGE ${profil.code.toUpperCase()} — ${items.length} dossiers ===`);
  console.log(`  notes : ${items[0]?.rating} (max) … ${items[items.length - 1]?.rating} (min)`);
  console.log(
    `  classes : ${items.length - sansClasse} lues, ${sansClasse} non assignées` +
      (profil.tagsClasse ? ` (tags appris par --classes)` : ` (tags anglais par défaut — lance --classes)`)
  );
  console.log(`  vignettes : ${items.filter(i => i.thumbnailUrl).length} · titres alternatifs : ${items.filter(i => i.alternateTitle).length}`);
  console.log(`
écrit : ${path.relative(ROOT, fichier)} (${ko} Ko)`);
  return items;
}

// ------------------------------------------------------------- point d'entrée

const args = parseArgs(process.argv);
const modes = {
  profil: construireProfils,
  repertoire: construireRepertoire,
  aretes: construireAretes,
  reconcilier,
  iconiques: construireIconiques,
  classes: construireClasses
};

if (!args.mode) {
  console.error('Précise un mode : --profil, --repertoire, --lang <code>, --reconcilier, --iconiques, --classes');
  process.exit(1);
}

modes[args.mode](args).catch(err => {
  console.error(`\nÉCHEC : ${err.message}`);
  process.exit(1);
});
