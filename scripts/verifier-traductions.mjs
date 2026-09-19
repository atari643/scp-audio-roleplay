#!/usr/bin/env node
/**
 * Vérifie que les neuf branches traduites couvrent le dictionnaire français.
 *
 * Ce contrôle existe parce qu'un contrôle bricolé m'avait menti : son motif de
 * clés était `[a-zA-Z.]+`, donc il ne voyait pas les clés contenant un chiffre
 * — `etat.niveau4`, `feuille.moins10`, `rp.ordreO5`. Pire, le script de fusion
 * utilisait le même motif pour réordonner les fichiers : il les **supprimait**
 * à chaque passage. Cinq clés ont ainsi été « traduites » plusieurs fois sans
 * jamais atteindre un seul fichier, et l'interface affichait le français en
 * repli sans que rien ne le signale.
 *
 * D'où un script versionné plutôt qu'une ligne jetable, et un motif qui admet
 * les chiffres.
 *
 *   node scripts/verifier-traductions.mjs
 *
 * Sort en code ≠ 0 si une branche est incomplète : utilisable en CI.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const I18N = 'src/i18n';
const MOTIF_CLE = /^ {2}'([A-Za-z0-9.]+)':/gm;

const source = readFileSync(join(I18N, 'fr.ts'), 'utf8');
const attendues = [...source.matchAll(MOTIF_CLE)].map(m => m[1]);

if (attendues.length === 0) {
  console.error('Aucune clé lue dans fr.ts — le motif ne correspond plus.');
  process.exit(2);
}

const doublons = attendues.filter((c, i) => attendues.indexOf(c) !== i);
if (doublons.length) {
  console.error(`Clés en double dans fr.ts : ${[...new Set(doublons)].join(', ')}`);
  process.exit(2);
}

const branches = readdirSync(join(I18N, 'langues'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace(/\.json$/, ''));

let defauts = 0;

console.log(`référence : ${attendues.length} clés (fr)\n`);

for (const branche of branches) {
  const dico = JSON.parse(readFileSync(join(I18N, 'langues', `${branche}.json`), 'utf8'));

  const manquantes = attendues.filter(c => !(c in dico));
  const enTrop = Object.keys(dico).filter(c => !attendues.includes(c));
  const vides = Object.entries(dico).filter(([, v]) => !String(v).trim()).map(([c]) => c);
  // Une valeur identique au français n'est pas fautive en soi — « Volume »,
  // « Intercom » ou « Terminal » se disent pareil — mais un bloc entier
  // identique trahit un copier-coller oublié. On le signale sans échouer.
  const identiques = attendues.filter(c => dico[c] === sourceValeur(c)).length;

  const souci = manquantes.length + enTrop.length + vides.length;
  defauts += souci;

  const etat = souci === 0 ? 'ok' : 'INCOMPLET';
  console.log(
    `  ${branche.padEnd(7)} ${String(Object.keys(dico).length).padStart(4)}/${attendues.length}  ${etat}` +
      (identiques > attendues.length / 2 ? `  (${identiques} valeurs identiques au français)` : '')
  );
  if (manquantes.length) console.log(`      manquantes : ${manquantes.slice(0, 8).join(', ')}${manquantes.length > 8 ? '…' : ''}`);
  if (enTrop.length) console.log(`      en trop    : ${enTrop.slice(0, 8).join(', ')}`);
  if (vides.length) console.log(`      vides      : ${vides.slice(0, 8).join(', ')}`);
}

function sourceValeur(cle) {
  const m = source.match(new RegExp(`^ {2}'${cle.replace(/\./g, '\\.')}':\\s*(.*)$`, 'm'));
  if (!m) return undefined;
  const brut = m[1].trim().replace(/,$/, '');
  return brut.length > 1 ? brut.slice(1, -1) : undefined;
}

console.log('');
if (defauts === 0) {
  console.log(`Les ${branches.length} branches sont complètes.`);
} else {
  console.error(`${defauts} défaut(s) — une branche affichera du français en repli.`);
  process.exit(1);
}
