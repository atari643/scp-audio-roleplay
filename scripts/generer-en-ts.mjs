#!/usr/bin/env node
/**
 * Régénère `src/i18n/en.ts` depuis `src/i18n/langues/en.json`.
 *
 * L'anglais est la langue par défaut : le charger en `import()` comme les huit
 * autres ferait afficher le français le temps d'un rendu. Il est donc embarqué
 * dans le paquet d'entrée, sous forme de module TypeScript typé `Dictionnaire`
 * — ce qui a un second effet, voulu : `tsc` refuse le build si une clé manque,
 * sans qu'aucun script n'ait à le vérifier.
 *
 * Le JSON reste la source d'édition, comme pour les autres branches. Ce script
 * est le pont entre les deux ; le lancer après toute modification de `en.json`.
 *
 *   node scripts/generer-en-ts.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'src/i18n/langues/en.json';
const CIBLE = 'src/i18n/en.ts';

const ordre = [...readFileSync('src/i18n/fr.ts', 'utf8').matchAll(/^ {2}'([A-Za-z0-9.]+)':/gm)].map(m => m[1]);
const dico = JSON.parse(readFileSync(SOURCE, 'utf8'));

const manquantes = ordre.filter(c => !(c in dico));
if (manquantes.length) {
  console.error(`${SOURCE} : ${manquantes.length} clé(s) manquante(s) — ${manquantes.slice(0, 6).join(', ')}`);
  process.exit(1);
}

const entete = `import type { Dictionnaire } from './fr';

/**
 * L'anglais, embarqué dans le paquet d'entrée.
 *
 * C'est la langue par défaut de l'application : la charger en \`import()\` comme
 * les huit autres afficherait le français au premier rendu, puis l'anglais une
 * fraction de seconde plus tard — le clignotement qu'on cherche précisément à
 * éviter. Une dizaine de kilo-octets compressés, payés une fois.
 *
 * Typé \`Dictionnaire\` : \`tsc\` refuse le fichier s'il manque une clé, ce qu'aucun
 * script n'a donc à vérifier pour l'anglais.
 *
 * **Généré — ne pas modifier à la main.** La source est \`langues/en.json\` ;
 * relancer \`node scripts/generer-en-ts.mjs\` après l'avoir changée.
 */
export const EN: Dictionnaire = {`;

const corps = ordre.map((cle, i) => `  '${cle}': ${JSON.stringify(dico[cle])}${i === ordre.length - 1 ? '' : ','}`);

writeFileSync(CIBLE, [entete, ...corps, '};', ''].join('\n'));
console.log(`${CIBLE} régénéré : ${ordre.length} clés`);
