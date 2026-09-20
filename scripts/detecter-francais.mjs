#!/usr/bin/env node
/**
 * Cherche le français resté en dur dans l'interface.
 *
 * Ce script existe parce que mes deux détecteurs précédents m'ont menti, et pas
 * de la même façon :
 *
 *  · le premier ne regardait que le JSX d'une seule ligne et les attributs. Il
 *    a laissé passer `BOOT_LINES` — onze lignes rangées dans un tableau, et
 *    affichées plein écran pendant les dix premières secondes ;
 *  · le second a ajouté les chaînes littérales, mais ignorait le **JSX réparti
 *    sur plusieurs lignes**, où les deux écrans d'accueil cachent tout leur
 *    texte de présentation.
 *
 * D'où les trois formes cherchées ici, et le fait qu'il soit versionné : une
 * mesure jetable se retrompe à chaque fois.
 *
 *   node scripts/detecter-francais.mjs            # le compte par fichier
 *   node scripts/detecter-francais.mjs --detail   # chaque occurrence
 *
 * Sort en code ≠ 0 dès qu'il trouve quelque chose : utilisable en CI.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const RACINES = ['src/components', 'src/desktop', 'src/mobile', 'src/shared'];

/** Un accent, ou un mot grammatical que l'anglais n'emploie pas ainsi. */
const FRANCAIS =
  /[àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ]|\b(le|la|les|des|une|un|pour|dans|avec|sur|par|est|sont|vers|aucun|aucune|cette|ce|vos|votre|qui|que|sans|plus|tout|tous|leur)\b/i;

/**
 * Ce qui ressemble à du texte mais n'en est pas.
 *
 * Les sigles et noms propres du projet ne se traduisent pas — les mettre dans
 * le dictionnaire reviendrait à traduire un logo. Les étiquettes dessinées dans
 * les illustrations SVG sont déjà en anglais.
 */
const IGNORE = [
  /^(\.{1,2}\/|https?:|\/|#)/,
  /^[a-z][a-z0-9-]*(\s+[a-z0-9:[\]/.%-]+)*$/, // classes utilitaires
  /^[a-z]+\.[a-zA-Z0-9.]+$/, // clés de traduction déjà posées
  /var\(--/,
  /^\d/,
  /^(SCP|SCiPNET|RAISA|CRT|CLI|BPM|HUD|O5|MTF|FIM)[\s\-_:/]*$/i,
  // Un gabarit qui n'est fait que de classes utilitaires et d'interpolations.
  // `icôneCouleur` est un nom de propriété, pas un texte : il porte un accent
  // parce que le code du projet est en français.
  /^[a-z0-9\s:[\]/.%-]*\$\{[^}]*\}[a-z0-9\s:[\]/.%${}-]*$/i,
  // Message de diagnostic réservé au développement : `import.meta.env.DEV` le
  // garde hors production, et il s'adresse au contributeur, pas au visiteur.
  /^\[useScpApp\]|^dans App\.tsx|^unique de speechEngine/,
  // Valeur du type `ObjectClass` quand le wiki n'annonce aucune classe. C'est
  // une clé de données, pas un libellé : `habillageClasse()` l'indexe, et
  // l'affichage passe par `abrege`.
  /^Non assigné$/,
  // Magritte, dessiné dans l'illustration de SCP-2950. « Ceci n'est pas… » se
  // cite en français dans toutes les langues : le traduire détruirait la
  // référence, qui est tout le propos de l'image.
  /CECI N'EST PAS UN SCP/
];

function fichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? fichiers(join(dossier, e.name)) : /\.tsx?$/.test(e.name) ? [join(dossier, e.name)] : []
  );
}

/** Retire commentaires et imports : ils ne s'affichent jamais. */
function sansCommentaires(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^import .*$/gm, '');
}

function occurrences(source) {
  const propre = sansCommentaires(source);
  const trouvees = [];

  const ajouter = (texte, index) => {
    const net = texte.replace(/\s+/g, ' ').trim();
    if (net.length < 4) return;
    if (!FRANCAIS.test(net)) return;
    if (IGNORE.some(r => r.test(net))) return;
    trouvees.push([propre.slice(0, index).split('\n').length, net.slice(0, 72)]);
  };

  // 1. Texte JSX, sur une ligne ou plusieurs.
  for (const m of propre.matchAll(/>([^<>{}]{4,})</g)) ajouter(m[1], m.index);

  // 2. Chaînes littérales : tableaux, objets, arguments, attributs.
  for (const m of propre.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n]){4,})\1/g)) ajouter(m[2], m.index);

  return trouvees;
}

const cibles = RACINES.flatMap(fichiers);
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

console.log(`chaînes françaises en dur : ${total}`);
console.log(`fichiers concernés        : ${parFichier.length} / ${cibles.length}\n`);

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
console.log("Aucun français en dur dans l'interface.");
