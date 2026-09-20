#!/usr/bin/env node
/**
 * Cherche ce qui a fui d'une branche à l'autre.
 *
 * `verifier-traductions.mjs` répond à « les clés sont-elles toutes là ? ».
 * Celui-ci répond à la question suivante, plus difficile : **le texte est-il
 * vraiment dans la bonne langue ?** Une clé peut être présente et pourtant
 * afficher du français à un lecteur espagnol — copier-coller oublié, phrase
 * traduite à moitié, marque d'interpolation perdue.
 *
 * Cinq contrôles, du plus sûr au plus indicatif :
 *
 *  1. **Alphabet attendu.** Le russe s'écrit en cyrillique, le japonais, le
 *     coréen et le chinois en CJK. Une valeur en alphabet latin y est presque
 *     toujours une traduction oubliée. C'est le contrôle le plus fiable : il ne
 *     dépend d'aucun lexique.
 *  2. **Copie mot pour mot du français.** Légitime pour « Audio », « Volume »
 *     ou « KETER » — suspect pour une phrase.
 *  3. **Mots français isolés**, dans une langue où ils n'existent pas. La liste
 *     est filtrée par langue : `la` est espagnol, `des` est allemand, `qui` est
 *     italien.
 *  4. **Marques d'interpolation.** Si `{n}` disparaît d'une traduction, le
 *     texte affiche un trou ; si une marque inconnue apparaît, elle s'affiche
 *     telle quelle.
 *  5. **Valeurs vides ou identiques à la clé.**
 *
 *   node scripts/auditer-langues.mjs             # le compte par branche
 *   node scripts/auditer-langues.mjs --detail    # chaque signalement
 *
 * Sort en code ≠ 0 sur tout signalement des contrôles 1, 4 et 5, qui ne
 * souffrent pas d'exception. Les contrôles 2 et 3 sont des indices : ils
 * s'affichent, sans faire échouer.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const I18N = 'src/i18n';

// --- Le dictionnaire de référence -------------------------------------------

const source = readFileSync(join(I18N, 'fr.ts'), 'utf8');
const FR = {};
for (const m of source.matchAll(/^ {2}'([A-Za-z0-9.]+)':\s*\n?\s*(['"])([\s\S]*?)\2,?\s*$/gm)) {
  FR[m[1]] = m[3];
}

/**
 * Identités légitimes entre le français et une autre langue.
 *
 * Ces mots s'écrivent pareil, ou sont des noms propres du projet. Les signaler
 * noierait les vrais oublis.
 */
const IDENTITES_NORMALES = new Set([
  'Audio', 'Volume', 'Terminal', 'Intercom', 'Version', 'Format', 'Type', 'Options',
  'Configuration', 'Application', 'Note', 'Action', 'Radio', 'Contact', 'Studio',
  'Sites', 'Site', 'Factions', 'Interface', 'Index', 'Score', 'Total', 'Menu',
  // Vérifiés un par un : ces mots s'écrivent pareil dans la branche visée.
  // Anglais.
  'Personnel', 'mention', 'mentions', 'Contribution', 'Maintenance', 'Catalogue',
  'Source', 'Code', 'Page', 'Site-19 standard',
  // Allemand : « Zone » et « Code » sont les mots allemands.
  'Zone',
  // Italien : la classe D et le mot « classe » s'écrivent ainsi.
  'Classe-D', 'Classe', 'Console RAISA',
  // Espagnol.
  'Audio disponible'
]);

/** Une valeur qui n'est faite que de sigles, chiffres et ponctuation. */
const SANS_MOTS = /^[^\p{L}]*$|^[A-Z0-9\s.,:;·•|/\\()[\]#@%+\-—–_☣✓●○→←]+$/u;

/**
 * Mots français à chercher dans les autres branches.
 *
 * `exclus` retire ceux qui existent aussi dans la langue visée : `la` et `son`
 * sont espagnols, `des` et `die` allemands, `qui` et `la` italiens, `que`
 * espagnol et portugais. Sans ce filtrage, l'audit crierait au loup sur chaque
 * phrase latine.
 */
const MOTS_FR = [
  'pour', 'dans', 'avec', 'sans', 'vers', 'aucun', 'aucune', 'cette', 'cet',
  'leur', 'leurs', 'tous', 'toute', 'toutes', 'sont', 'vous', 'nous', 'être',
  'avoir', 'peut', 'doit', 'ainsi', 'déjà', 'dont', 'voix', 'dossier', 'dossiers',
  'lecture', 'langue', 'fichier', 'page', 'aucune', 'depuis', 'chaque', 'plusieurs'
];

const EXCLUS_PAR_LANGUE = {
  en: ['page', 'lecture'],
  es: ['page'],
  it: ['page', 'dont'],
  de: ['page'],
  pl: ['page'],
  ru: [],
  ja: [],
  ko: [],
  'zh-CN': []
};

/**
 * Clés dont la valeur reste en alphabet latin dans toutes les branches.
 *
 * Les classes d'objet sont des termes propres à l'univers : le wiki japonais,
 * coréen et chinois écrit « Safe », « Euclid » et « Keter » tels quels. Les
 * traduire irait contre l'usage de ces communautés.
 */
const LATIN_VOULU = new Set([
  'classe.safe',
  'classe.euclid',
  'classe.keter',
  'classe.thaumiel',
  'classe.apollyon'
]);

/** Écriture attendue : une valeur sans elle est presque sûrement non traduite. */
const ECRITURE_ATTENDUE = {
  ru: { motif: /\p{Script=Cyrillic}/u, nom: 'cyrillique' },
  ja: { motif: /\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han}/u, nom: 'japonais' },
  ko: { motif: /\p{Script=Hangul}/u, nom: 'hangul' },
  'zh-CN': { motif: /\p{Script=Han}/u, nom: 'chinois' }
};

const MARQUES = /\{([a-zA-Z]+)\}/g;

function marques(texte) {
  return [...texte.matchAll(MARQUES)].map(m => m[1]).sort().join(',');
}

/**
 * Le texte sans ses marques d'interpolation.
 *
 * `{dossier}` et `{voix}` sont des noms de paramètres, écrits en français parce
 * que le code l'est : les laisser faisait signaler « mots français » sur des
 * traductions japonaises parfaites, et comptait `「{titre}」` comme une valeur
 * non traduite alors qu'elle n'est faite que de guillemets.
 */
function sansMarques(texte) {
  return texte.replace(MARQUES, ' ');
}

// --- Audit -------------------------------------------------------------------

const branches = readdirSync(join(I18N, 'langues'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace(/\.json$/, ''));

const detail = process.argv.includes('--detail');
let bloquants = 0;

console.log(`référence : ${Object.keys(FR).length} clés lues dans fr.ts\n`);

for (const branche of branches) {
  const dico = JSON.parse(readFileSync(join(I18N, 'langues', `${branche}.json`), 'utf8'));
  const exclus = new Set(EXCLUS_PAR_LANGUE[branche] ?? []);
  const motsCherches = MOTS_FR.filter(m => !exclus.has(m));
  const ecriture = ECRITURE_ATTENDUE[branche];

  const ecritureManquante = [];
  const copiesDuFr = [];
  const motsFrancais = [];
  const marquesCassees = [];
  const vides = [];

  for (const [cle, attendu] of Object.entries(FR)) {
    const valeur = dico[cle];
    if (valeur === undefined) continue; // la complétude est l'affaire de l'autre script

    if (!String(valeur).trim() || valeur === cle) {
      vides.push([cle, valeur]);
      continue;
    }

    if (marques(valeur) !== marques(attendu)) {
      marquesCassees.push([cle, `${marques(attendu) || '∅'} → ${marques(valeur) || '∅'}`]);
    }

    const nu = sansMarques(valeur);

    if (ecriture && !LATIN_VOULU.has(cle) && !SANS_MOTS.test(nu) && !ecriture.motif.test(nu)) {
      ecritureManquante.push([cle, valeur]);
    }

    if (valeur === attendu && !IDENTITES_NORMALES.has(valeur) && !SANS_MOTS.test(valeur)) {
      copiesDuFr.push([cle, valeur]);
    }

    const trouves = motsCherches.filter(m =>
      new RegExp(`(^|[^\\p{L}])${m}([^\\p{L}]|$)`, 'iu').test(nu)
    );
    if (trouves.length && valeur !== attendu) {
      motsFrancais.push([cle, `${trouves.join(', ')} — ${valeur.slice(0, 54)}`]);
    }
  }

  const dur = ecritureManquante.length + marquesCassees.length + vides.length;
  const indices = copiesDuFr.length + motsFrancais.length;
  bloquants += dur;

  const etat = dur === 0 ? (indices === 0 ? 'ok' : 'à regarder') : 'DÉFAUT';
  console.log(
    `  ${branche.padEnd(7)} ${etat.padEnd(11)}` +
      (ecriture ? ` écriture ${ecriture.nom} absente : ${ecritureManquante.length}` : '') +
      `  copies du fr : ${copiesDuFr.length}  mots fr : ${motsFrancais.length}` +
      `  marques : ${marquesCassees.length}  vides : ${vides.length}`
  );

  if (detail) {
    const bloc = (titre, liste) => {
      if (!liste.length) return;
      console.log(`      ${titre}`);
      for (const [cle, quoi] of liste.slice(0, 40)) console.log(`        ${cle.padEnd(30)} ${quoi}`);
      if (liste.length > 40) console.log(`        … et ${liste.length - 40} de plus`);
    };
    bloc(`écriture ${ecriture?.nom ?? ''} absente`, ecritureManquante);
    bloc('marques d’interpolation', marquesCassees);
    bloc('vides', vides);
    bloc('copie mot pour mot du français', copiesDuFr);
    bloc('mots français repérés', motsFrancais);
  }
}

console.log('');
if (bloquants === 0) {
  console.log('Aucun défaut bloquant. Les « à regarder » sont des indices, pas des erreurs.');
} else {
  console.error(`${bloquants} défaut(s) bloquant(s) — écriture, interpolation ou valeur vide.`);
  process.exit(1);
}
