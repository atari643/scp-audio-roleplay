import type { CSSProperties } from 'react';
import { ObjectClass } from '../types/scp';

/**
 * Habillage d'une classe d'objet — partagé par le desktop et le mobile.
 *
 * Règle du projet : **une couleur de classe ne décore rien**. Elle ne paraît que
 * sur le badge de classe et sur le liseré de classification d'une fiche. Partout
 * ailleurs, l'accent rouge unique s'applique. L'ancienne version peignait fond,
 * bordure, texte, ombre et halo de chaque carte dans la teinte de sa classe :
 * onze teintes concurrentes, et plus aucune hiérarchie lisible.
 *
 * Les valeurs viennent des jetons `--classe-*` (`_variables.scss`), toutes
 * mesurées à 4,8:1 minimum sur le fond des cartes.
 */
export interface HabillageClasse {
  /** Couleur du jeton, en variable CSS : à poser en `style`, pas en classe. */
  couleur: string;
  /** Libellé court pour les gabarits très étroits. */
  abrege: string;
  /** Vrai pour les classes qui justifient un liseré de danger rayé. */
  dangereuse: boolean;
}

const HABILLAGES: Record<ObjectClass, HabillageClasse> = {
  Safe: { couleur: 'var(--classe-safe)', abrege: 'SAFE', dangereuse: false },
  Euclid: { couleur: 'var(--classe-euclid)', abrege: 'EUCL', dangereuse: false },
  Keter: { couleur: 'var(--classe-keter)', abrege: 'KETR', dangereuse: true },
  Thaumiel: { couleur: 'var(--classe-thaumiel)', abrege: 'THAU', dangereuse: false },
  Apollyon: { couleur: 'var(--classe-apollyon)', abrege: 'APOL', dangereuse: true },
  Archon: { couleur: 'var(--classe-archon)', abrege: 'ARCH', dangereuse: false },
  Neutralized: { couleur: 'var(--classe-neutralisee)', abrege: 'NEUT', dangereuse: false },
  Decommissioned: { couleur: 'var(--classe-neutralisee)', abrege: 'DÉCL', dangereuse: false },
  'Non assigné': { couleur: 'var(--bordure-forte)', abrege: '—', dangereuse: false }
};

export function habillageClasse(classe: ObjectClass): HabillageClasse {
  return HABILLAGES[classe] ?? HABILLAGES['Non assigné'];
}

/**
 * Style du badge de classe : texte et bordure dans la teinte, fond teinté.
 * `color-mix` donne le fond sans avoir à décliner sept variables de plus.
 *
 * Le fond est passé de 12 % à 18 % et la bordure de 55 % à 65 % : à 12 %, sur une
 * grille de soixante dossiers, la classe ne se distinguait plus qu'en lisant le
 * mot. Or c'est précisément l'information qu'on balaye.
 */
export function styleBadgeClasse(classe: ObjectClass): CSSProperties {
  const { couleur } = habillageClasse(classe);
  return {
    color: couleur,
    borderColor: `color-mix(in srgb, ${couleur} 65%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${couleur} 18%, transparent)`
  };
}

/** Liseré de classification posé sur le bord gauche d'une fiche. */
export function styleLisereClasse(classe: ObjectClass): CSSProperties {
  return { borderLeftColor: habillageClasse(classe).couleur };
}

/**
 * Règle de métadonnées du haut de fiche, teintée par la classe.
 *
 * C'est elle qui colore la carte sans la peindre : à 30 % la teinte se perçoit du
 * coin de l'œil sur une grille, mais le fond de la fiche reste neutre et la prose
 * garde son contraste.
 */
export function styleRegleClasse(classe: ObjectClass): CSSProperties {
  const { couleur } = habillageClasse(classe);
  return { borderBottomColor: `color-mix(in srgb, ${couleur} 30%, transparent)` };
}

/**
 * Teinte très légère à poser sous un en-tête de dossier ouvert.
 * `surface-1` reste le fond : la classe se signale, elle n'envahit pas.
 */
export function styleFondClasse(classe: ObjectClass, pourcent = 7): CSSProperties {
  const { couleur } = habillageClasse(classe);
  return {
    backgroundColor: `color-mix(in srgb, ${couleur} ${pourcent}%, var(--surface-1))`
  };
}
