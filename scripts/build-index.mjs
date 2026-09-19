/**
 * Construction de l'index de corpus.
 *
 * Balaie une branche entière via Crom, fait tourner le VRAI parseur de l'application sur
 * chaque dossier, et écrit `src/data/corpusIndex.<lang>.json`. C'est ce fichier qui rend
 * possibles les filtres « durée » et « théâtre », que ni Crom ni une heuristique de
 * surface ne savent produire.
 *
 * POURQUOI C'EST ABORDABLE. Le service facture 2 points PAR PAGE quels que soient les
 * champs demandés — `textContent` est donc gratuit. Mesuré : 4586 SCP-FR en ~2 min pour
 * un index de 77 Ko gzip. Le coût réel est la bande passante (~16 Ko/page), pas le quota.
 *
 * LES DEUX LIMITES. Le quota (300 000 points / 5 min) n'est jamais le problème ; c'est le
 * limiteur de RAFALE qui l'est, et il annonce lui-même le délai à respecter. On le lit.
 *
 * Usage :
 *   node scripts/build-index.mjs                       la branche fr, corpus complet
 *   node scripts/build-index.mjs --lang en             la branche anglaise
 *   node scripts/build-index.mjs --limit 300           un échantillon, pour vérifier
 *   node scripts/build-index.mjs --out /tmp/idx.json   ailleurs que dans src/data/
 *
 * Nécessite `npm run audit:build` au préalable (il produit scripts/.build/).
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BUILD_DIR = path.join(HERE, '.build');
const CROM_ENDPOINT = 'https://api.crom.avn.sh/graphql';

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const args = { lang: 'fr', limit: Infinity, out: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--lang') args.lang = argv[++i];
    else if (argv[i] === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------- transport

/**
 * Le limiteur de rafale répond « Please wait for N seconds ». On lit le N plutôt que de
 * deviner : c'est la seule façon d'enchaîner 46 requêtes sans se faire couper.
 */
async function gql(query, variables = {}) {
  for (let tentative = 0; tentative < 6; tentative++) {
    const reponse = await fetch(CROM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const json = await reponse.json();
    const erreur = json.errors?.[0]?.message;
    if (!erreur) return json.data;

    const attente = erreur.match(/wait for (\d+) second/i);
    if (!attente) throw new Error(`Crom : ${erreur}`);
    await new Promise(r => setTimeout(r, (parseInt(attente[1], 10) + 1) * 1000));
  }
  throw new Error('Crom : limiteur de rafale, abandon après 6 tentatives.');
}

// ---------------------------------------------------------------- cohortes

/** Percentile d'un tableau NON trié (il est trié sur place). */
function percentile(valeurs, p) {
  if (valeurs.length === 0) return 0;
  const tri = valeurs.slice().sort((a, b) => a - b);
  return tri[Math.min(tri.length - 1, Math.floor((p / 100) * tri.length))];
}

/**
 * Seuils par année de création.
 *
 * Calculés ICI, sur le corpus déjà en mémoire, et non par des requêtes d'agrégat : on a
 * déjà toutes les pages, donc les percentiles sont exacts et ne coûtent rien de plus.
 */
function calculerCohortes(entrees) {
  const parAnnee = new Map();
  for (const e of Object.values(entrees)) {
    if (!e.y) continue;
    if (!parAnnee.has(e.y)) parAnnee.set(e.y, { notes: [], votes: [] });
    const cohorte = parAnnee.get(e.y);
    cohorte.notes.push(e.g);
    cohorte.votes.push(e.c);
  }

  const cohortes = {};
  for (const [annee, { notes, votes }] of parAnnee) {
    // Sous 20 dossiers un percentile ne veut rien dire : on laisse l'année sans seuil,
    // `notoriete()` renverra null plutôt qu'un classement au hasard.
    if (notes.length < 20) continue;
    cohortes[String(annee)] = {
      p85: percentile(notes, 85),
      p95: percentile(notes, 95),
      votesMedians: percentile(votes, 50)
    };
  }
  return cohortes;
}

// ---------------------------------------------------------------- balayage

const REQUETE_BALAYAGE = `
  query BalayageCorpus($filter: QueryPagesFilter, $first: Int!, $after: ID) {
    pages(filter: $filter, sort: { key: URL, order: ASC }, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        url
        wikidotInfo { title rating voteCount tags createdAt thumbnailUrl textContent source }
      } }
    }
  }
`;

async function construire(args) {
  const { parseScpDossier } = await import(pathToFileURL(path.join(BUILD_DIR, 'scriptParser.mjs')).href);
  const { CLASSES_INDEX, masqueAmbiances } = await import(pathToFileURL(path.join(BUILD_DIR, 'corpusIndex.mjs')).href);
  const { cromApi } = await import(pathToFileURL(path.join(BUILD_DIR, 'cromApi.mjs')).href);

  const langue = cromApi.getLanguage(args.lang);
  if (langue.code !== args.lang) {
    throw new Error(`Branche « ${args.lang} » inconnue de SUPPORTED_LANGUAGES.`);
  }

  const filter = {
    _and: [
      { url: { startsWith: langue.baseUrl } },
      { wikidotInfo: { tags: { eq: 'scp' } } }
    ]
  };

  const total = await cromApi.aggregateScp(filter);
  const attendu = Math.min(total.count, args.limit);
  console.log(`Branche ${langue.code} (${langue.baseUrl})`);
  console.log(`${total.count} dossiers tagués « scp »${args.limit < Infinity ? ` — on en traite ${attendu}` : ''}\n`);

  const entrees = {};
  const debut = Date.now();
  let curseur = null;
  let vus = 0;
  let pagines = 0;
  let vides = 0;

  while (vus < attendu) {
    const data = await gql(REQUETE_BALAYAGE, {
      filter,
      first: Math.min(100, attendu - vus),
      after: curseur
    });
    const edges = data?.pages?.edges ?? [];
    if (edges.length === 0) break;

    for (const { node } of edges) {
      vus++;
      const w = node.wikidotInfo;
      const slug = node.url.split('/').pop();
      if (!w || !slug) { vides++; continue; }

      const texte = w.textContent || '';
      const source = w.source || '';
      const tags = w.tags || [];

      // Un dossier paginé ne rend que sa page 1 : sa durée sera sous-estimée, on le note.
      const estPagine = /\[\[module\s+ListPages[^\]]*offset\s*=\s*"?@URL/i.test(source);
      if (estPagine) pagines++;

      let segments = [];
      try {
        segments = parseScpDossier([texte], w.title || slug, langue.code, source);
      } catch {
        // Le wiki est communautaire : un balisage inattendu ne doit pas arrêter le balayage.
        vides++;
        continue;
      }

      const mots = segments.reduce(
        (n, s) => n + s.text.trim().split(/\s+/).filter(Boolean).length,
        0
      );
      const narres = segments.filter(s => s.role === 'narrator').length;
      const classe = CLASSES_INDEX.indexOf(classeDepuisTags(tags));

      const entree = {
        m: mots,
        s: segments.length,
        r: new Set(segments.map(s => s.role)).size,
        n: segments.length ? Math.round((100 * narres) / segments.length) : 100,
        v: new Set(segments.map(s => s.speaker)).size,
        g: w.rating ?? 0,
        c: w.voteCount ?? 0,
        y: parseInt((w.createdAt || '').slice(0, 4), 10) || 0,
        k: classe < 0 ? 0 : classe,
        a: masqueAmbiances(tags, langue.code)
      };
      if (w.thumbnailUrl) entree.i = 1;
      // Le tag de la branche marque une création originale ; les traductions portent
      // le tag de leur langue d'origine. Mesuré sur FR : 884 créations, 3394 traductions.
      if (tags.includes(langue.code)) entree.o = 1;
      if (estPagine) entree.p = 1;

      entrees[slug] = entree;
    }

    curseur = data.pages.pageInfo.endCursor;
    const pct = ((100 * vus) / attendu).toFixed(0);
    process.stdout.write(`\r  ${vus}/${attendu} (${pct} %)   `);
    if (!data.pages.pageInfo.hasNextPage) break;
  }

  process.stdout.write('\r' + ' '.repeat(40) + '\r');

  const index = {
    langue: langue.code,
    construitLe: new Date().toISOString(),
    cohortes: calculerCohortes(entrees),
    // Barre de visibilité globale : au-dessus, un dossier remonte tout seul dans un tri
    // par note. C'est ce qui définit la pépite en creux (voir `notoriete`).
    noteGlobaleP95: percentile(Object.values(entrees).map(e => e.g), 95),
    entrees
  };

  const sortie = args.out
    ? path.resolve(args.out)
    : path.join(ROOT, 'src', 'data', `corpusIndex.${langue.code}.json`);
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  const json = JSON.stringify(index);
  fs.writeFileSync(sortie, json);

  const gz = zlib.gzipSync(Buffer.from(json)).length;
  const secondes = ((Date.now() - debut) / 1000).toFixed(0);
  const nb = Object.keys(entrees).length;

  console.log(`=== INDEX ${langue.code.toUpperCase()} — ${nb} dossiers en ${secondes} s ===\n`);
  console.log(`  taille        : ${(json.length / 1024).toFixed(0)} Ko brut / ${(gz / 1024).toFixed(0)} Ko gzip`);
  console.log(`  paginés       : ${pagines} (${((100 * pagines) / Math.max(1, nb)).toFixed(1)} %) — durée sous-estimée`);
  console.log(`  illisibles    : ${vides}`);
  console.log(`  cohortes      : ${Object.keys(index.cohortes).length} années avec seuils`);

  resumer(index);
  console.log(`\nécrit : ${path.relative(ROOT, sortie)}`);
  return index;
}

/** Reprend la logique de `cromApi.extractObjectClass`, qui n'est pas exportée. */
function classeDepuisTags(tags) {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has('keter')) return 'Keter';
  if (t.has('euclid') || t.has('euclide')) return 'Euclid';
  if (t.has('safe') || t.has('sûr') || t.has('sur')) return 'Safe';
  if (t.has('thaumiel')) return 'Thaumiel';
  if (t.has('apollyon')) return 'Apollyon';
  if (t.has('archon')) return 'Archon';
  if (t.has('neutralized') || t.has('neutralisé')) return 'Neutralized';
  if (t.has('decommissioned') || t.has('déclassé')) return 'Decommissioned';
  return 'Non assigné';
}

/** Contrôle de vraisemblance : la répartition doit ressembler à ce qui a été mesuré. */
function resumer(index) {
  const MPM = 150;
  const paliers = { '< 5 min': 0, '5-15 min': 0, '15-25 min': 0, '> 25 min': 0 };
  const ecoute = { solo: 0, theatre: 0, mixte: 0 };
  let illustres = 0;
  let originaux = 0;

  for (const e of Object.values(index.entrees)) {
    const min = e.m / MPM;
    if (min < 5) paliers['< 5 min']++;
    else if (min < 15) paliers['5-15 min']++;
    else if (min < 25) paliers['15-25 min']++;
    else paliers['> 25 min']++;

    if (e.n >= 85) ecoute.solo++;
    else if (e.n < 60) ecoute.theatre++;
    else ecoute.mixte++;

    if (e.i) illustres++;
    if (e.o) originaux++;
  }

  let patrimoine = 0;
  let pepites = 0;
  for (const e of Object.values(index.entrees)) {
    const c = index.cohortes[String(e.y)];
    if (!c) continue;
    if (e.g >= c.p95 && e.c >= c.votesMedians) patrimoine++;
    else if (e.g >= c.p85 && e.g < index.noteGlobaleP95) pepites++;
  }

  const nb = Object.keys(index.entrees).length || 1;
  const pct = n => `${((100 * n) / nb).toFixed(0)} %`;
  console.log('\n  répartition par durée :');
  for (const [k, v] of Object.entries(paliers)) console.log(`     ${k.padEnd(10)} ${String(v).padStart(5)}  ${pct(v)}`);
  console.log('  type d\'écoute :');
  for (const [k, v] of Object.entries(ecoute)) console.log(`     ${k.padEnd(10)} ${String(v).padStart(5)}  ${pct(v)}`);
  console.log(`  illustrés : ${illustres} (${pct(illustres)})   créations originales : ${originaux} (${pct(originaux)})`);
  console.log(`  patrimoine : ${patrimoine} (${pct(patrimoine)})   pépites : ${pepites} (${pct(pepites)})   barre globale p95 = ${index.noteGlobaleP95}`);
}

// ---------------------------------------------------------------- point d'entrée

const args = parseArgs(process.argv);
if (!fs.existsSync(path.join(BUILD_DIR, 'scriptParser.mjs'))) {
  console.error('scripts/.build/ absent — lance d\'abord `npm run audit:build`.');
  process.exit(1);
}
construire(args).catch(err => {
  console.error('\nÉCHEC :', err.message);
  process.exit(1);
});
