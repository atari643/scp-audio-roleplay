#!/usr/bin/env node
/**
 * Génère les icônes de l'application à partir du sceau de la Fondation.
 *
 * Pourquoi un script et pas un fichier de plus dans `public/` : il faut le même
 * sceau en une dizaine de tailles (manifeste web, écran d'accueil iOS, les cinq
 * densités Android, la fiche Play Store), et un jeu d'icônes recopié à la main
 * se désynchronise au premier changement de couleur. Ici, la source est le
 * `public/favicon.svg` — redessiné en primitives, pas rastérisé : le SVG ne
 * contient que des cercles et des segments, ce qui évite d'embarquer un moteur
 * de rendu et ses 40 Mo de dépendances pour neuf fichiers.
 *
 * Aucune dépendance : `zlib` suffit à écrire un PNG.
 *
 *   node scripts/generer-icones.mjs
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- Palette, reprise telle quelle du favicon -------------------------------
const ROUGE = [220, 38, 38, 255];
const CLAIR = [241, 245, 249, 255];
const FOND = [10, 12, 16, 255];
const TRANSPARENT = [0, 0, 0, 0];

// --- Écriture d'un PNG ------------------------------------------------------

function morceau(type, corps) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(corps.length);
  const nom = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([nom, corps])) >>> 0);
  return Buffer.concat([longueur, nom, corps, crc]);
}

const TABLE_CRC = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function ecrirePng(chemin, largeur, hauteur, pixels) {
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 6; // RGBA
  // 10, 11, 12 : compression, filtre, entrelacement — tous à zéro.

  // Un octet de filtre « aucun » en tête de chaque ligne.
  const brut = Buffer.alloc(hauteur * (largeur * 4 + 1));
  for (let y = 0; y < hauteur; y++) {
    const depart = y * (largeur * 4 + 1);
    brut[depart] = 0;
    pixels.copy(brut, depart + 1, y * largeur * 4, (y + 1) * largeur * 4);
  }

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    morceau('IHDR', entete),
    morceau('IDAT', deflateSync(brut, { level: 9 })),
    morceau('IEND', Buffer.alloc(0))
  ]);

  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, png);
  return png.length;
}

// --- Dessin ----------------------------------------------------------------
//
// Tout se ramène à une distance signée : un point appartient à la forme si sa
// distance au cercle ou au segment est inférieure à la demi-épaisseur. Quatre
// échantillons par axe (seize par pixel) suffisent à lisser les bords.

const SUR_ECHANTILLON = 4;

function distanceSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const longueur2 = vx * vx + vy * vy;
  let t = longueur2 === 0 ? 0 : (wx * vx + wy * vy) / longueur2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}

/** Le sceau, décrit dans le repère 0-100 du SVG d'origine. */
function couleurEn(x, y, avecFond) {
  const dCentre = Math.hypot(x - 50, y - 50);

  // Disque central plein.
  if (dCentre <= 14) return ROUGE;

  // Anneau extérieur, pointillé : douze unités de trait, quatre de vide, le long
  // d'une circonférence de 2πr.
  if (Math.abs(dCentre - 46) <= 2) {
    const perimetre = 2 * Math.PI * 46;
    const angle = Math.atan2(y - 50, x - 50) + Math.PI;
    const position = (angle / (2 * Math.PI)) * perimetre;
    if (position % 16 < 12) return ROUGE;
  }

  // Anneau intermédiaire, plein.
  if (Math.abs(dCentre - 30) <= 1.5) return CLAIR;

  // Les trois flèches qui pointent vers le centre.
  const fleches = [
    [[50, 4, 50, 20], [44, 14, 50, 20], [50, 20, 56, 14]],
    [[89.8, 73, 76, 65], [73, 73, 76, 65], [76, 65, 82, 68]],
    [[10.2, 73, 24, 65], [18, 68, 24, 65], [24, 65, 27, 73]]
  ];
  for (const fleche of fleches) {
    for (const [ax, ay, bx, by] of fleche) {
      if (distanceSegment(x, y, ax, ay, bx, by) <= 1.5) return CLAIR;
    }
  }

  return avecFond ? FOND : TRANSPARENT;
}

/**
 * @param largeur  largeur de l'image, en pixels.
 * @param hauteur  hauteur de l'image (égale à la largeur pour une icône).
 * @param options  `fond` remplit le rectangle (icône Android, qui ne tolère pas
 *                 la transparence sur la fiche Play) ; `echelle` rétrécit le
 *                 sceau pour laisser la marge que réclame un masque adaptatif,
 *                 ou pour le poser au centre d'un écran de démarrage.
 */
function dessiner(largeur, hauteur = largeur, { fond = false, echelle = 1 } = {}) {
  const pixels = Buffer.alloc(largeur * hauteur * 4);
  const pas = 1 / SUR_ECHANTILLON;
  // Le sceau reste circulaire sur un écran allongé : c'est le plus petit côté
  // qui donne la référence, jamais la largeur seule.
  const cote = Math.min(largeur, hauteur);

  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SUR_ECHANTILLON; sy++) {
        for (let sx = 0; sx < SUR_ECHANTILLON; sx++) {
          // Coordonnées de l'échantillon dans le repère 0-100 du dessin.
          const u = ((x + (sx + 0.5) * pas - largeur / 2) / cote) * (100 / echelle) + 50;
          const v = ((y + (sy + 0.5) * pas - hauteur / 2) / cote) * (100 / echelle) + 50;
          const c = couleurEn(u, v, fond);
          r += c[0] * c[3];
          g += c[1] * c[3];
          b += c[2] * c[3];
          a += c[3];
        }
      }

      const n = SUR_ECHANTILLON * SUR_ECHANTILLON;
      const i = (y * largeur + x) * 4;
      pixels[i] = a === 0 ? 0 : Math.round(r / a);
      pixels[i + 1] = a === 0 ? 0 : Math.round(g / a);
      pixels[i + 2] = a === 0 ? 0 : Math.round(b / a);
      pixels[i + 3] = Math.round(a / n);
    }
  }

  return pixels;
}

// --- Bannières --------------------------------------------------------------
//
// Deux images larges manquaient : l'aperçu social de GitHub (ce qu'affiche un
// lien collé dans une conversation — sans lui, l'adresse reste nue) et la
// bannière de la fiche Play Store, qui était le seul visuel encore à produire à
// la main. Même contrainte que le reste du fichier : aucune dépendance, donc pas
// de moteur de rendu — et sans moteur de rendu, pas de police. Les lettres sont
// donc tracées en segments droits, ce qui tombe bien : un alphabet au pochoir est
// exactement le registre visuel de la Fondation.

/**
 * L'alphabet, réduit aux huit lettres de « SCP AUDIO ».
 *
 * Chaque lettre vit dans une boîte de 6 × 10, décrite par des segments. Les
 * courbes sont volontairement carrées (le `D` garde deux biseaux, sans quoi il ne
 * se distinguerait pas d'un `O`).
 */
const POCHOIR = {
  S: [[0, 0, 6, 0], [0, 0, 0, 5], [0, 5, 6, 5], [6, 5, 6, 10], [0, 10, 6, 10]],
  C: [[6, 0, 0, 0], [0, 0, 0, 10], [0, 10, 6, 10]],
  P: [[0, 10, 0, 0], [0, 0, 6, 0], [6, 0, 6, 5], [6, 5, 0, 5]],
  A: [[0, 10, 0, 0], [0, 0, 6, 0], [6, 0, 6, 10], [0, 5, 6, 5]],
  U: [[0, 0, 0, 10], [0, 10, 6, 10], [6, 10, 6, 0]],
  D: [[0, 0, 4, 0], [4, 0, 6, 2], [6, 2, 6, 8], [6, 8, 4, 10], [4, 10, 0, 10], [0, 0, 0, 10]],
  I: [[3, 0, 3, 10], [1, 0, 5, 0], [1, 10, 5, 10]],
  O: [[0, 0, 6, 0], [6, 0, 6, 10], [6, 10, 0, 10], [0, 10, 0, 0]]
};

const MOT = 'SCP AUDIO';

/** Largeur du mot, dans l'unité « une lettre fait 6 de large ». */
function largeurDuMot(ecart, espaceMot) {
  let total = 0;
  for (const c of MOT) total += (c === ' ' ? espaceMot : 6 + ecart);
  return total - ecart;
}

/**
 * Une bannière : fond sombre, sceau à gauche, « SCP AUDIO » au pochoir à droite,
 * souligné d'un trait rouge.
 *
 * @param largeur  largeur en pixels.
 * @param hauteur  hauteur en pixels.
 */
function dessinerBanniere(largeur, hauteur) {
  const pixels = Buffer.alloc(largeur * hauteur * 4);

  // Le sceau occupe la colonne de gauche, le texte le reste. Tout est dérivé de
  // la hauteur pour que les deux formats gardent les mêmes proportions.
  const diametre = hauteur * 0.62;
  const sceauX = hauteur * 0.5;
  const sceauY = hauteur * 0.5;

  const ecart = 3.2; // en unités de la boîte 6 × 10
  const espaceMot = 5.4;

  // La taille des lettres se déduit de la place restante, jamais de la hauteur :
  // les deux formats n'ont pas le même rapport, et un mot calibré sur la hauteur
  // sortait du cadre en 1280 × 640.
  const texteX = hauteur * 0.9;
  const largeurDispo = largeur - texteX - hauteur * 0.12;
  const unite = largeurDispo / largeurDuMot(ecart, espaceMot);

  const hauteurLettre = unite * 10;
  const trait = unite * 1.05;
  const texteLargeur = largeurDispo;

  const souligneEpaisseur = Math.max(2, unite * 0.9);
  // Le bloc « mot + soulignement » est centré en entier, sinon il paraît haut.
  const blocHauteur = hauteurLettre + unite * 3 + souligneEpaisseur;
  const texteY = (hauteur - blocHauteur) / 2;
  const souligneY = texteY + hauteurLettre + unite * 3;

  const pas = 1 / SUR_ECHANTILLON;

  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      let r = 0, g = 0, b = 0, n = 0;

      for (let sy = 0; sy < SUR_ECHANTILLON; sy++) {
        for (let sx = 0; sx < SUR_ECHANTILLON; sx++) {
          const px = x + (sx + 0.5) * pas;
          const py = y + (sy + 0.5) * pas;
          let c = FOND;

          // 1. Le sceau, ramené dans son repère 0-100.
          const u = ((px - sceauX) / diametre) * 100 + 50;
          const v = ((py - sceauY) / diametre) * 100 + 50;
          const duSceau = couleurEn(u, v, false);
          if (duSceau[3] !== 0) c = duSceau;

          // 2. Le mot, lettre après lettre.
          if (px >= texteX - trait && px <= texteX + texteLargeur + trait) {
            let curseur = texteX;
            for (const lettre of MOT) {
              if (lettre === ' ') {
                curseur += espaceMot * unite;
                continue;
              }
              const boite = 6 * unite;
              if (px >= curseur - trait && px <= curseur + boite + trait) {
                for (const [ax, ay, bx, by] of POCHOIR[lettre]) {
                  const d = distanceSegment(
                    px, py,
                    curseur + ax * unite, texteY + ay * unite,
                    curseur + bx * unite, texteY + by * unite
                  );
                  if (d <= trait / 2) { c = CLAIR; break; }
                }
              }
              curseur += boite + ecart * unite;
            }
          }

          // 3. Le soulignement.
          if (
            py >= souligneY && py <= souligneY + souligneEpaisseur &&
            px >= texteX && px <= texteX + texteLargeur
          ) {
            c = ROUGE;
          }

          r += c[0]; g += c[1]; b += c[2]; n++;
        }
      }

      const i = (y * largeur + x) * 4;
      pixels[i] = Math.round(r / n);
      pixels[i + 1] = Math.round(g / n);
      pixels[i + 2] = Math.round(b / n);
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

const BANNIERES = [
  // Aperçu social GitHub : 1280 × 640 est la taille que la documentation
  // recommande pour un rendu net, et le fichier doit rester sous 1 Mo.
  ['public/icones/banniere-sociale.png', 1280, 640],
  // Fiche Play Store : la « bannière de mise en avant » y est imposée à
  // 1024 × 500, sans alpha.
  ['public/icones/play-banniere-1024x500.png', 1024, 500]
];

// --- Ce qu'on produit -------------------------------------------------------

const CIBLES = [
  // Manifeste web et écran d'accueil.
  ['public/icones/icone-192.png', 192, { fond: true, echelle: 0.9 }],
  ['public/icones/icone-512.png', 512, { fond: true, echelle: 0.9 }],
  // Masquable : Android rogne jusqu'à 20 % de chaque bord, d'où la marge.
  ['public/icones/icone-masquable-512.png', 512, { fond: true, echelle: 0.62 }],
  // Fiche Play Store.
  ['public/icones/play-512.png', 512, { fond: true, echelle: 0.9 }],
  // Lanceur Android, une image par densité.
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144, { fond: true, echelle: 0.9 }],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192, { fond: true, echelle: 0.9 }],
  // Calque avant de l'icône adaptative : transparent, et rétréci comme le veut
  // la spécification (le système anime et rogne ce calque).
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 108, { echelle: 0.55 }],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 162, { echelle: 0.55 }],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 216, { echelle: 0.55 }],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 324, { echelle: 0.55 }],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 432, { echelle: 0.55 }]
];

/**
 * Écrans de démarrage Android.
 *
 * Capacitor en pose de série un jeu complet, son logo bleu sur fond blanc : c'est
 * la toute première image que voit l'utilisateur, et un flash blanc avant une
 * application entièrement noire est autant désagréable que révélateur du gabarit.
 * Les dimensions reprennent exactement celles des fichiers remplacés.
 */
const DEMARRAGES = [
  ['drawable', 480, 320],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280]
];

for (const [relatif, taille, options] of CIBLES) {
  const pixels = dessiner(taille, taille, options);
  const octets = ecrirePng(resolve(RACINE, relatif), taille, taille, pixels);
  console.log(`${relatif.padEnd(62)} ${String(taille).padStart(4)} px  ${(octets / 1024).toFixed(1)} Ko`);
}

for (const [dossier, largeur, hauteur] of DEMARRAGES) {
  const relatif = `android/app/src/main/res/${dossier}/splash.png`;
  // Le sceau occupe un tiers du plus petit côté : un écran de démarrage n'est pas
  // une icône, il doit respirer.
  const pixels = dessiner(largeur, hauteur, { fond: true, echelle: 0.33 });
  const octets = ecrirePng(resolve(RACINE, relatif), largeur, hauteur, pixels);
  console.log(`${relatif.padEnd(62)} ${largeur}×${hauteur}  ${(octets / 1024).toFixed(1)} Ko`);
}

for (const [relatif, largeur, hauteur] of BANNIERES) {
  const pixels = dessinerBanniere(largeur, hauteur);
  const octets = ecrirePng(resolve(RACINE, relatif), largeur, hauteur, pixels);
  console.log(`${relatif.padEnd(62)} ${largeur}×${hauteur}  ${(octets / 1024).toFixed(1)} Ko`);
}

console.log('\nIcônes, écrans de démarrage et bannières régénérés depuis le sceau de public/favicon.svg.');
