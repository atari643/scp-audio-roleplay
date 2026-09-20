#!/usr/bin/env node
/**
 * Cherche le texte d'interface qui ne passe pas par `t()`.
 *
 * **Il ne cherche pas « du français ».** Les trois versions précédentes le
 * faisaient — accents, puis mots grammaticaux — et chacune a laissé passer
 * quelque chose. La dernière annonçait zéro pendant que l'écran affichait
 * « Chercheurs », « Factions », « Sites », « Ouvrir », « DOSSIERS »,
 * « BRANCHE » : aucun accent, aucun mot-outil, donc invisibles. Reconnaître une
 * langue par son orthographe ne marche pas.
 *
 * Le critère est mécanique : **un texte affiché doit venir d'une clé.** Peu
 * importe la langue dans laquelle il est écrit ; s'il est en dur, il ne
 * changera jamais. C'est vérifiable sans juger du contenu, donc sans angle
 * mort.
 *
 *   node scripts/detecter-francais.mjs            # le compte par fichier
 *   node scripts/detecter-francais.mjs --detail   # chaque occurrence
 *
 * Sort en code ≠ 0 dès qu'il trouve quelque chose : utilisable en CI.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const RACINES = ['src/components', 'src/desktop', 'src/mobile', 'src/shared'];

/** Attributs dont la valeur est lue par l'utilisateur ou son lecteur d'écran. */
const ATTRIBUTS = /\b(title|placeholder|aria-label|alt)="([^"]{2,})"/g;

/**
 * Texte entre l'ouverture d'une balise et sa fermeture, sur une ligne ou
 * plusieurs.
 *
 * La fermeture `</` est exigée : sans elle, le motif attrapait les génériques
 * TypeScript — `useState<Type>(valeur)` ressemble à s'y méprendre à du texte
 * entre deux chevrons.
 */
const TEXTE_JSX = />([^<>{}]{2,})<\//g;

/**
 * Ce qui n'est pas du texte d'interface.
 *
 * Sigles, codes de classification et noms propres du projet : ils s'écrivent
 * pareil dans toutes les langues, les mettre au dictionnaire reviendrait à
 * traduire un logo. Le reste est du balisage ou de la ponctuation.
 */
const TOLERE = [
  /^[\s·•|/\\<>→←↑↓✓●○—–-]*$/, // séparateurs, flèches, puces
  /^[A-Z0-9][A-Z0-9\s._:/#-]*$/, // SIGLES, CODES, SCP-173, O5-COMM, CL-5
  /^(SCP|SCiPNET|RAISA|CROM|CRT|CLI|BPM|HUD|TTS|MTF|FIM|GdI|GoI|O5|Site-19|Edge Neural TTS)/,
  /^[a-z][a-z0-9-]*(\s+[a-z0-9:[\]/.%()-]+)*$/, // classes utilitaires Tailwind
  /^[a-z]+\.[a-zA-Z0-9.]+$/, // une clé de traduction déjà posée
  /var\(--/,
  /^\{/,
  // Magritte, dessiné dans l'illustration de SCP-2950 : « Ceci n'est pas… » se
  // cite en français dans toutes les langues.
  /CECI N'EST PAS UN SCP/,
  // Décor de terminal : un chemin de fichier fictif et une invite de commande
  // ne se traduisent pas plus qu'un `C:\>` ne se traduirait.
  /^C:\\[A-Z\\]+$/,
  /^SCIPNET(&gt;|>)$/,
  // Croix de fermeture. L'intitulé lisible est dans son `aria-label`, lui
  // traduit — c'est là que le lecteur d'écran va chercher.
  /^\[x\]$/i
];

/** Fichiers dont le texte n'atteint jamais l'écran. */
const FICHIERS_HORS_SUJET = [
  // Étiquettes dessinées à l'intérieur des SVG : elles font partie du dessin.
  'illustrations/ScpIllustrations.tsx'
];

function fichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? fichiers(join(dossier, e.name)) : /\.tsx?$/.test(e.name) ? [join(dossier, e.name)] : []
  );
}

/** Neutralise commentaires et imports sans décaler les positions. */
function sansCommentaires(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, m => ' '.repeat(m.length))
    .replace(/^import .*$/gm, m => ' '.repeat(m.length));
}

function occurrences(source) {
  const propre = sansCommentaires(source);
  const trouvees = [];

  const ajouter = (texte, index) => {
    const net = texte.replace(/\s+/g, ' ').trim();
    if (net.length < 2) return;
    if (!/[A-Za-zÀ-ÿ]/.test(net)) return;
    if (TOLERE.some(r => r.test(net))) return;
    trouvees.push([propre.slice(0, index).split('\n').length, net.slice(0, 68)]);
  };

  for (const m of propre.matchAll(TEXTE_JSX)) ajouter(m[1], m.index);
  for (const m of propre.matchAll(ATTRIBUTS)) ajouter(m[2], m.index);

  return trouvees;
}

const cibles = RACINES.flatMap(fichiers).filter(f => {
  const chemin = f.split(sep).join('/');
  return !FICHIERS_HORS_SUJET.some(h => chemin.endsWith(h));
});

const parFichier = [];
let total = 0;

for (const f of cibles) {
  const trouvees = occurrences(readFileSync(f, 'utf8'));
  if (trouvees.length) {
    total += trouvees.length;
    parFichier.push([f.split(sep).join('/'), trouvees]);
  }
}

parFichier.sort((a, b) => b[1].length - a[1].length);

console.log(`textes affichés sans passer par t() : ${total}`);
console.log(`fichiers concernés                  : ${parFichier.length} / ${cibles.length}\n`);

for (const [f, trouvees] of parFichier) {
  console.log(String(trouvees.length).padStart(4), f);
  if (process.argv.includes('--detail')) {
    for (const [ligne, texte] of trouvees) console.log(`       ${String(ligne).padStart(4)}  ${texte}`);
  }
}

if (total > 0) {
  console.log('\nRelancer avec --detail pour voir chaque occurrence.');
  process.exit(1);
}
console.log("Tout le texte de l'interface passe par le dictionnaire.");
