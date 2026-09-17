/**
 * Audit de fidélité audio : compare ce que la page officielle contient à ce que
 * l'application lira réellement, dossier par dossier.
 *
 * Deux familles de défauts sont détectées, et il faut bien les deux :
 *
 *   PRONONCIATION  des formes qui atteignent le moteur de synthèse sans être prononçables
 *                  telles quelles (tiret de désignation, abréviation, bloc caviardé). Ce
 *                  défaut-là est invisible pour les deux autres métriques : le mot EST lu,
 *                  simplement il est mal dit. Voir `speechText.ts` / `speechLexicon.ts`.
 *
 *   PERTE        des mots de la page qui ne sortent jamais en audio.
 *   DUPLICATION  du contenu lu plusieurs fois. C'est le défaut de SCP-6747, dont les
 *                "fragments" sont deux RENDUS du même article (ORIGINAL / ACCESSIBLE) et
 *                non des pages successives. Ce défaut est invisible pour une simple
 *                mesure de couverture : les pages en double gonflent la source ET la
 *                sortie, donc la couverture reste à 100 % pendant que l'article est lu
 *                trois fois. D'où la détection de blocs répétés dans la sortie elle-même.
 *
 * Usage :
 *   node scripts/audit-coverage.mjs --limit 40                 échantillon par défaut
 *   node scripts/audit-coverage.mjs --prefix scp-6 --limit 60  une série
 *   node scripts/audit-coverage.mjs --slugs scp-5618,scp-6747  des dossiers précis
 *   node scripts/audit-coverage.mjs --lang en --limit 30
 *
 * Le cache disque (scripts/.audit-cache) rend le passage itératif : relancer après une
 * correction ne refait pas les appels réseau, seulement le parsing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CACHE_DIR = path.join(HERE, '.audit-cache');
const BUILD_DIR = path.join(HERE, '.build');

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const args = { limit: 40, lang: 'fr', prefix: null, slugs: null, refetch: false, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--lang') args.lang = argv[++i];
    else if (a === '--prefix') args.prefix = argv[++i];
    else if (a === '--slugs') args.slugs = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--refetch') args.refetch = true;
    else if (a === '--verbose') args.verbose = true;
  }
  return args;
}

// ---------------------------------------------------------------- métriques

const DUPLICATION_ALERT = 0.25;

/**
 * Formes que le moteur de synthèse ne sait pas lire telles quelles, et qui ne doivent donc
 * plus figurer dans le texte prononcé une fois `normalizeForSpeech` passé.
 *
 * Ce sont les défauts que les mesures de `scripts/probe-speech.mjs` ont établis comme réels.
 * Toute réapparition ici est une régression de la normalisation — que ni la couverture ni la
 * duplication ne verraient, puisque le mot est bien lu, seulement mal prononcé.
 */
const DEFAUTS_PRONONCIATION = [
  // « SCP-608-FR » est prononcé « SCP tiret 608 tiret FR », mesuré à l'octet près.
  { nom: 'tiret de désignation', re: /\p{Lu}[\p{L}\p{N}]*-[\p{L}\p{N}]*\p{N}/gu },
  { nom: 'abréviation de titre', re: /(^|[^\p{L}])(?:Dir|Agt|Ca?pt|Sgt)\.?(?=\s+\p{L}{2})/giu },
  { nom: 'bloc caviardé brut', re: /█/gu },
  { nom: 'heure sans minutes', re: /\d\s?h(?![\p{L}\p{N}]|\s*\d)/gu },
  // Identifiant de terminal « jvance1@@fondation.scp » : l'arobase est dite deux fois (lot
  // « terminal/ »). Le retour arrière « ^H » n'a pas de motif ici : l'étape 8 retire « ^ »
  // de toute façon, et le « H » orphelin qui en resterait est indiscernable d'une initiale.
  { nom: 'arobase doublée', re: /@@/gu }
];

/**
 * Étiquettes de blocs structurés que le wiki écrit sous la forme « Libellé : valeur ».
 * La règle de dialogue du parseur les prend pour des personnages, ce qui range le libellé
 * dans `speaker` — or le moteur ne prononce que `text`. Le contenu disparaît donc de
 * l'audio sans que la couverture des mots ne bouge : invisible pour la métrique de perte.
 */
const STRUCTURED_LABELS =
  /^(?:name|age|position|additional\s+notes?|parties\s+present|foreword|afterword|fig\.?\s*[\d.]+|date|location|lieu|nom|âge|poste|introduction|conclusion|r[ée]sultat|result|intention|r[ée]action|objectif|objective|m[ée]thode|method|r[ée]sum[ée]|summary|hypoth[èe]se|hypothesis|avant-propos)$/i;

/**
 * Un `speaker` qui n'a pas l'allure d'un nom de personne : titre de section avalé par la
 * règle de dialogue. Les vrais locuteurs sont courts ("Dir. Vemhoff", "Micheals", "CLF").
 */
function isSuspiciousSpeaker(speaker) {
  const s = (speaker || '').trim();
  // Libellés que le parseur produit lui-même : ce sont des locuteurs voulus, pas des
  // titres avalés.
  if (!s || /^(?:archiviste|note de bas de page|footnote|intercom|narrateur|narrator)$/i.test(s)) {
    return false;
  }
  // Locuteur entièrement entre crochets ("[DONNÉES SUPPRIMÉES]") : une vraie réplique des
  // transcriptions — le parseur l'accepte désormais comme interlocuteur, l'audit aussi.
  if (/^\[[^\]]{2,40}\]$/.test(s)) return false;
  if (STRUCTURED_LABELS.test(s)) return true;
  const wordCount = s.split(/\s+/).length;
  // « Dr. Kain P. Crow » : quatre mots, mais un titre personnel en tête — une personne.
  const titrePersonnel = /^(?:dr|dre|docteure?|prof|professeure?|agente?|sgt|sergent|capt|capitaine|lt|lieutenant|dir|directeur|directrice|mme|mlle|m)\.?\s/i.test(s);
  if (wordCount > 3 && !titrePersonnel) return true;
  // Tout en capitales sur plusieurs mots : un titre, pas quelqu'un. Les sigles d'un seul
  // mot (CLF, BRT, KDK) sont de vrais locuteurs et doivent passer.
  const letters = s.replace(/[^\p{L}]/gu, '');
  const upper = s.replace(/[^\p{Lu}]/gu, '');
  if (wordCount > 1 && letters.length > 3 && upper.length / letters.length >= 0.9) return true;
  return false;
}

const words = s => (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
const normalise = s => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Classe une ligne non lue. Toutes les pertes ne sont pas des défauts : le bandeau de
 * navigation, le bloc crédits et les légendes d'images sont écartés volontairement.
 * Seule la catégorie "contenu" compte comme un vrai manque.
 */
function classifyMissingLine(line) {
  const l = line.trim();
  if (/^[«»<>|\-–—\s]+$/.test(l)) return 'chrome';
  if (/(^|\s)(«|»)\s*(voir|retour|acc[eé]der|mode|ep\s*\d)/i.test(l)) return 'chrome';
  if (/^ep\s*\d/i.test(l)) return 'chrome';
  if (/^\(\d+\/\d+\)$/.test(l)) return 'chrome';
  if (/^(notes?\s+de\s+bas\s+de\s+page|footnotes?)$/i.test(l)) return 'chrome';
  if (/^(titre original|auteur|traducteur|images?|date de publication)\s*:/i.test(l)) return 'credits';
  if (/^(cr[eé]dits?|credit)$/i.test(l)) return 'credits';
  if (/\.(jpg|jpeg|png|gif|svg|mp4|webm)\b/i.test(l)) return 'media';
  return 'contenu';
}

/**
 * Blocs substantiels répétés dans la sortie audio : la signature d'un dossier lu
 * plusieurs fois. Renvoie le nombre de mots concernés.
 *
 * Une répétition que la page écrit elle-même n'est pas un défaut : un dossier à itérations
 * (SCP-2317, SCP-338-FR…) recopie le dossier d'un onglet à l'autre, et doit être lu ainsi.
 * Un bloc est donc toléré autant de fois qu'UNE MÊME page le contient — le maximum sur les
 * pages, pas la somme : des fragments paginés qui se dupliquent d'une page à l'autre (le
 * défaut de SCP-6747) restent signalés.
 */
function detectRepeatedBlocks(segments, pages, lang) {
  const censure = lang === 'en' ? ' redacted ' : ' censuré ';
  const pagesMots = pages.map(p => ` ${words((p || '').replace(/█+/g, censure)).join(' ')} `);
  const toleres = texte => {
    const aiguille = ` ${words(texte).join(' ')} `;
    let max = 0;
    for (const page of pagesMots) {
      let n = 0;
      for (let i = page.indexOf(aiguille); i !== -1; i = page.indexOf(aiguille, i + 1)) n++;
      max = Math.max(max, n);
    }
    return max;
  };

  const seen = new Map();
  let duplicatedWords = 0;
  const repeated = [];
  for (const seg of segments) {
    const key = normalise(seg.text);
    if (key.length < 120) continue; // les phrases courtes se répètent légitimement
    const prev = seen.get(key) || 0;
    if (prev > 0 && prev >= toleres(seg.text)) {
      duplicatedWords += words(seg.text).length;
      if (repeated.length < 3) repeated.push(seg.text.slice(0, 70));
    }
    seen.set(key, prev + 1);
  }
  return { duplicatedWords, repeated };
}

// ---------------------------------------------------------------- audit d'un dossier

function auditPrononciation(segments, normalizeForSpeech, lang) {
  const restes = {};
  for (const seg of segments) {
    const parle = normalizeForSpeech(seg.text, lang);
    for (const { nom, re } of DEFAUTS_PRONONCIATION) {
      const hits = parle.match(re);
      if (hits) restes[nom] = (restes[nom] || 0) + hits.length;
    }
  }
  return restes;
}

/**
 * Titres d'onglets lus d'un bloc : autant de segments consécutifs que la vue a d'onglets,
 * égaux à ses titres dans l'ordre. C'est ainsi que CROM aplatit un `[[tabview]]` ; le parseur
 * doit replacer chaque titre devant son onglet. Garde de non-régression.
 */
function titresOngletsGroupes(segments, source) {
  if (!source || !/\[\[tabview/i.test(source)) return 0;
  // Comparaison au texte près (espaces réduits) : le bloc de CROM reprend les titres tels
  // quels, alors qu'une énumération du dossier qui les cite porte sa ponctuation
  // (« Elder Ann Barlowe; Ra.aic; », en_scp-6172) et qu'un titre replacé finit par un point.
  // Les parenthèses tombent des deux côtés : le parseur les retire du texte lu.
  const cle = t => t.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  let groupes = 0;
  for (const vue of source.split(/\[\[tabview[^\]]*\]\]/i).slice(1)) {
    const titres = [...vue.matchAll(/\[\[tab\s+([^\]]*)\]\]/gi)].map(m => cle(m[1])).filter(Boolean);
    // Le bloc complet, dans l'ordre.
    if (titres.length < 2) continue;
    for (let i = 0; i + titres.length <= segments.length; i++) {
      if (titres.every((t, k) => cle(segments[i + k].text) === t)) {
        groupes++;
        break;
      }
    }
  }
  return groupes;
}

function auditDossier(slug, detail, segments, { retirerTexteBarre, retirerApercuCache, texteDesBlocsHtml }, lang) {
  // La page telle que le lecteur la voit : sans l'aperçu caché (display: none) que CROM
  // laisse dans textContent, avec le texte des blocs [[html]] que CROM ne rend pas.
  const page0 = retirerApercuCache(detail.textContent, detail.source);
  const html = texteDesBlocsHtml(detail.source, page0);
  const pages = [html ? `${page0}\n${html}` : page0, ...(detail.fragments || [])];
  // Les gabarits ACS laissent parfois des emplacements non substitués ({$item-number},
  // {$container-class}…). Le parseur les retire à dessein — les compter comme du contenu
  // source ferait passer ce correctif pour une perte de couverture.
  // Même chose pour le script d'initialisation des onglets, que le parseur retire aussi.
  const sourceText = pages
    .join('\n')
    .replace(/\{\$[a-z0-9\-_]+\}/gi, ' ')
    .replace(/\/\/<!\[CDATA\[[\s\S]*?\/\/\]\]>/g, ' ');

  // Les passages barrés sont retirés du texte lu (décision produit : un texte rayé ne se
  // lit pas). Ils ne sont ni une couverture manquée ni une perte — on les sort du
  // décompte. Un mot barré qui réapparaît ailleurs en clair est retiré de partout : la
  // couverture peut alors être légèrement sous-estimée, jamais gonflée.
  const { motsRetires: motsBarres } = retirerTexteBarre(pages, detail.source);
  const barres = new Set(motsBarres);

  const srcWords = words(sourceText).filter(w => !barres.has(w));
  const outWords = words(segments.map(s => `${s.speaker} ${s.text}`).join(' '));

  // Couverture : chaque mot source doit se retrouver dans la sortie (multiset).
  const bag = new Map();
  for (const w of outWords) bag.set(w, (bag.get(w) || 0) + 1);
  let matched = 0;
  for (const w of srcWords) {
    const c = bag.get(w) || 0;
    if (c > 0) {
      bag.set(w, c - 1);
      matched++;
    }
  }
  const coverage = srcWords.length ? matched / srcWords.length : 1;

  // Lignes entières absentes, classées par nature.
  const spokenBag = new Set(words(segments.map(s => `${s.speaker} ${s.text}`).join(' ')));
  const buckets = { chrome: 0, credits: 0, media: 0, contenu: 0 };
  const contentLosses = [];
  for (const line of sourceText.split('\n').map(l => l.trim()).filter(Boolean)) {
    const lw = words(line).filter(w => !barres.has(w));
    if (lw.length < 4) continue;
    const present = lw.filter(w => spokenBag.has(w)).length / lw.length;
    if (present >= 0.6) continue; // la ligne est lue, éventuellement reformatée
    const kind = classifyMissingLine(line);
    buckets[kind] += lw.length;
    if (kind === 'contenu' && contentLosses.length < 4) contentLosses.push(line.slice(0, 90));
  }

  const { duplicatedWords, repeated } = detectRepeatedBlocks(segments, pages, lang);

  return {
    slug,
    pages: pages.length,
    segments: segments.length,
    footnotes: segments.filter(s => s.isFootnote).length,
    srcWords: srcWords.length,
    coverage,
    motsBarres: motsBarres.length,
    lostContentWords: buckets.contenu,
    lostChromeWords: buckets.chrome + buckets.credits + buckets.media,
    duplicatedWords,
    duplicationRatio: srcWords.length ? duplicatedWords / srcWords.length : 0,
    unresolvedTokens: segments.filter(s => /@@(?:NOTE\d|TABLEAU|ONGLET|TERMINAL|SAISIE)/.test(s.text)).length,
    // Le script d'initialisation des onglets, lu à voix haute.
    scriptFuites: segments.filter(s => /CDATA\[|OZONE\.dom|YAHOO\.widget/.test(s.text)).length,
    titresOngletsGroupes: titresOngletsGroupes(segments, detail.source),
    parasiticSpeakers: segments.filter(s => /^(objet\s*n[o°]?|classe|item|niveau)$/i.test(s.speaker)).length,
    templateVars: segments.filter(s => /\{\$[a-z0-9\-_]+\}/i.test(s.text)).length,
    suspiciousSpeakers: [...new Set(segments.filter(s => isSuspiciousSpeaker(s.speaker)).map(s => s.speaker))],
    contentLosses,
    repeated,
    prononciation: {}
  };
}

// ---------------------------------------------------------------- exécution

async function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(path.join(BUILD_DIR, 'cromApi.mjs'))) {
    console.error('Bundles absents. Lance d\'abord :  npm run audit:build');
    process.exit(1);
  }
  // pathToFileURL : sur Windows un chemin absolu "C:\…" n'est pas une URL ESM valide.
  const { cromApi } = await import(pathToFileURL(path.join(BUILD_DIR, 'cromApi.mjs')).href);
  const parseur = await import(pathToFileURL(path.join(BUILD_DIR, 'scriptParser.mjs')).href);
  const { parseScpDossier } = parseur;
  const { normalizeForSpeech } = await import(pathToFileURL(path.join(BUILD_DIR, 'speechText.mjs')).href);

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Quels dossiers auditer ?
  let slugs = args.slugs;
  if (!slugs) {
    const prefix = args.prefix || 'scp-';
    process.stderr.write(`Récupération de la liste (${prefix}, ${args.lang})…\n`);
    const items = await cromApi.fetchByPrefix(prefix, args.lang, args.limit);
    slugs = items.map(i => i.slug).filter(s => /^scp-/i.test(s));
  }
  slugs = slugs.slice(0, args.limit);

  const results = [];
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    process.stderr.write(`\r[${i + 1}/${slugs.length}] ${slug}`.padEnd(60));

    const cacheFile = path.join(CACHE_DIR, `${args.lang}_${slug}.json`);
    let detail = null;
    if (!args.refetch && fs.existsSync(cacheFile)) {
      try {
        detail = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch {
        detail = null;
      }
    }
    if (!detail) {
      try {
        detail = await cromApi.fetchScpDetail(slug, args.lang);
      } catch {
        detail = null;
      }
      if (detail) fs.writeFileSync(cacheFile, JSON.stringify(detail));
      await new Promise(r => setTimeout(r, 120)); // ne pas marteler une API communautaire
    }
    if (!detail || !detail.textContent) continue;

    const segments = parseScpDossier(
      [detail.textContent, ...(detail.fragments || [])],
      detail.title,
      args.lang,
      // La source Wikidot porte les cibles des liens (et, au cas 5, le texte barré) — sans
      // elle, l'audit ne voit pas ce que l'application voit.
      detail.source
    );
    const rapport = auditDossier(slug, detail, segments, parseur, args.lang);
    rapport.prononciation = auditPrononciation(segments, normalizeForSpeech, args.lang);
    results.push(rapport);
  }
  process.stderr.write('\r'.padEnd(60) + '\r');

  // ------------------------------------------------------------- rapport
  const n = results.length;
  if (!n) {
    console.log('Aucun dossier récupéré.');
    return;
  }

  const avg = results.reduce((a, r) => a + r.coverage, 0) / n;
  const perfect = results.filter(r => r.coverage >= 0.995 && r.duplicatedWords === 0).length;
  // Seuil calibré sur les deux cas réels : le bug de SCP-6747 (fragments non dédupliqués)
  // produit 143 % de duplication, tandis que SCP-5618 en affiche 5 % pour un encart
  // d'avertissement que l'article répète volontairement sur ses deux pages.
  const dupes = results.filter(r => r.duplicationRatio > DUPLICATION_ALERT);
  const dupSuspect = results.filter(
    r => r.duplicationRatio > 0.02 && r.duplicationRatio <= DUPLICATION_ALERT
  );
  const lossy = results.filter(r => r.lostContentWords > 25);
  const broken = results.filter(
    r =>
      r.unresolvedTokens > 0 ||
      r.parasiticSpeakers > 0 ||
      r.templateVars > 0 ||
      r.scriptFuites > 0 ||
      r.titresOngletsGroupes > 0
  );
  const mute = results.filter(r => r.suspiciousSpeakers.length > 0);
  const muteTotal = mute.reduce((a, r) => a + r.suspiciousSpeakers.length, 0);

  console.log(`\n=== AUDIT DE FIDÉLITÉ AUDIO — ${n} dossiers (${args.lang}) ===\n`);
  console.log(`couverture moyenne des mots : ${(avg * 100).toFixed(1)} %`);
  console.log(`dossiers nickel             : ${perfect}/${n}`);
  console.log(`avec DUPLICATION            : ${dupes.length}`);
  console.log(`avec perte de CONTENU >25 m.: ${lossy.length}`);
  console.log(`avec défaut de parsing      : ${broken.length}`);
  console.log(`titres avalés en locuteurs  : ${muteTotal} sur ${mute.length} dossier(s)`);

  const prononciation = {};
  for (const r of results) {
    for (const [nom, n] of Object.entries(r.prononciation)) {
      prononciation[nom] = (prononciation[nom] || 0) + n;
    }
  }
  const totalPrononciation = Object.values(prononciation).reduce((a, b) => a + b, 0);
  console.log(`défauts de PRONONCIATION    : ${totalPrononciation}`);
  if (totalPrononciation) {
    console.log('\n--- PRONONCIATION (formes qui atteignent le moteur mal écrites) ---');
    for (const [nom, n] of Object.entries(prononciation).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${nom.padEnd(24)} ${n}`);
    }
    const pires = results
      .filter(r => Object.keys(r.prononciation).length)
      .sort((a, b) => Object.values(b.prononciation).reduce((x, y) => x + y, 0)
                    - Object.values(a.prononciation).reduce((x, y) => x + y, 0))
      .slice(0, 6);
    for (const r of pires) {
      const detail = Object.entries(r.prononciation).map(([k, v]) => `${k}×${v}`).join(', ');
      console.log(`      ${r.slug.padEnd(14)} ${detail}`);
    }
  }

  if (mute.length) {
    console.log('\n--- TITRES AVALÉS (rangés dans speaker → jamais prononcés) ---');
    for (const r of mute.sort((a, b) => b.suspiciousSpeakers.length - a.suspiciousSpeakers.length).slice(0, 12)) {
      console.log(`  ${r.slug.padEnd(12)} ${r.suspiciousSpeakers.length} : ${r.suspiciousSpeakers.slice(0, 6).join(' · ')}`);
    }
  }

  if (dupes.length) {
    console.log('\n--- DUPLICATION (contenu lu plusieurs fois) ---');
    for (const r of dupes.sort((a, b) => b.duplicationRatio - a.duplicationRatio)) {
      console.log(`  ${r.slug.padEnd(12)} ${(r.duplicationRatio * 100).toFixed(0)}% dupliqué, ${r.pages} page(s)`);
      r.repeated.forEach(t => console.log(`      ↳ « ${t}… »`));
    }
  }

  if (lossy.length) {
    console.log('\n--- PERTE DE CONTENU ---');
    for (const r of lossy.sort((a, b) => b.lostContentWords - a.lostContentWords).slice(0, 15)) {
      console.log(`  ${r.slug.padEnd(12)} ${r.lostContentWords} mots perdus (couverture ${(r.coverage * 100).toFixed(1)} %)`);
      r.contentLosses.forEach(t => console.log(`      · ${t}`));
    }
  }

  if (broken.length) {
    console.log('\n--- DÉFAUTS DE PARSING ---');
    for (const r of broken) {
      console.log(
        `  ${r.slug.padEnd(12)} jetons @@ non résolus: ${r.unresolvedTokens}, locuteurs parasites: ${r.parasiticSpeakers}, ` +
          `script lu: ${r.scriptFuites}, vues aux titres groupés: ${r.titresOngletsGroupes}`
      );
    }
  }

  if (args.verbose) {
    console.log('\n--- DÉTAIL ---');
    for (const r of results.sort((a, b) => a.coverage - b.coverage)) {
      console.log(
        `  ${r.slug.padEnd(12)} cov=${(r.coverage * 100).toFixed(1)}% pages=${r.pages} seg=${r.segments} notes=${r.footnotes} perdu=${r.lostContentWords} dup=${r.duplicatedWords}`
      );
    }
  }

  const out = path.join(HERE, `audit-${args.lang}.json`);
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  console.log(`\nrapport complet : ${path.relative(ROOT, out)}`);

  // Sortie non nulle si un défaut bloquant subsiste : utilisable en CI.
  if (dupes.length || broken.length) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
