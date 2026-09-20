/**
 * Le pont entre le répertoire tiré du wiki et l'affichage.
 *
 * L'UI (`ScipnetExplorerModal`, `EntityDetailModal`) est écrite autour de `ScpEntity`,
 * la forme saisie à la main : code, niveau d'accréditation, devise, palette. Le
 * répertoire, lui, ne connaît que ce que le wiki écrit. Plutôt que de réécrire les
 * 830 lignes de la fenêtre SCiPNET, on adapte : chaque entité du wiki reçoit la forme
 * que l'affichage attend, et les 57 entités déjà rédigées à la main gardent leur
 * texte, qui reste meilleur que tout ce qu'on pourrait tirer d'un annuaire.
 *
 * Ce qui change vraiment : `iconicScps` n'est plus une liste tapée mais le résultat de
 * `dossiersDeLEntite()`.
 */

import { CategorieEntite, Entite } from '../types/entities';
import {
  dossiersDeLEntite,
  entiteParId,
  nomEntite,
  pageSourceEntite,
  resumeEntite
} from '../services/entityService';
import { ALL_ENTITIES, EntityCategory, ScpEntity } from './departmentsData';

/** Le calque éditorial, indexé par l'entité du wiki à laquelle il se rapporte. */
const CALQUE = new Map<string, ScpEntity>();
for (const entite of ALL_ENTITIES) {
  if (entite.entiteId) CALQUE.set(entite.entiteId, entite);
}

/**
 * La palette par catégorie, reprise des classes déjà utilisées par les entités
 * écrites à la main pour que rien ne détonne à l'écran.
 */
const PALETTES: Record<CategorieEntite, Pick<ScpEntity, 'color' | 'badgeBg' | 'badgeBorder' | 'badgeText'>> = {
  departement: {
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-600/70',
    badgeText: 'text-purple-300'
  },
  chercheur: {
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-600/70',
    badgeText: 'text-cyan-300'
  },
  faction: {
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-600/70',
    badgeText: 'text-amber-300'
  },
  site: {
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-600/70',
    badgeText: 'text-emerald-300'
  },
  zone: {
    color: 'text-lime-400',
    badgeBg: 'bg-lime-950/80',
    badgeBorder: 'border-lime-600/70',
    badgeText: 'text-lime-300'
  },
  fim: {
    color: 'text-red-400',
    badgeBg: 'bg-red-950/80',
    badgeBorder: 'border-red-600/70',
    badgeText: 'text-red-300'
  },
  commandement: {
    color: 'text-slate-200',
    badgeBg: 'bg-slate-800/80',
    badgeBorder: 'border-slate-500/70',
    badgeText: 'text-slate-200'
  }
};

/** L'ancienne taxonomie, pour les composants qui n'en connaissent que quatre valeurs. */
const VERS_ANCIENNE: Record<CategorieEntite, EntityCategory> = {
  departement: 'department',
  chercheur: 'researcher',
  faction: 'goi',
  site: 'site',
  zone: 'site',
  fim: 'goi',
  commandement: 'department'
};

/** Le niveau d'accréditation affiché, à défaut d'information dans le wiki. */
const ACCREDITATION: Record<CategorieEntite, number | 'O5'> = {
  commandement: 'O5',
  departement: 4,
  chercheur: 3,
  faction: 4,
  site: 3,
  zone: 4,
  fim: 3
};

/** Le code de dossier fictif affiché dans l'explorateur : `GDI-SERPENTS-HAND`. */
function codeDe(entite: Entite): string {
  if (entite.designation) return entite.designation.toUpperCase();
  const prefixe: Record<CategorieEntite, string> = {
    departement: 'DEP',
    chercheur: 'PER',
    faction: 'GDI',
    site: 'SITE',
    zone: 'ZONE',
    fim: 'FIM',
    commandement: 'O5'
  };
  const suffixe = entite.id.split('-').slice(1).join('-').toUpperCase().slice(0, 22);
  return `${prefixe[entite.categorie]}-${suffixe || 'X'}`;
}

/**
 * Adapte une entité du wiki à la forme attendue par l'affichage.
 *
 * `dossiers` est injecté par l'appelant plutôt que lu ici : ce module ne doit pas
 * dépendre de l'état de chargement de l'index, sans quoi une entité rendue avant la
 * fin du chargement se figerait avec une liste vide.
 */
export function versScpEntity(entite: Entite, langue: string, dossiers: string[] = []): ScpEntity {
  const editorial = CALQUE.get(entite.id);
  const palette = PALETTES[entite.categorie];
  const nom = nomEntite(entite, langue);
  const resume = resumeEntite(entite, langue);

  /**
   * Le calque éditorial est écrit en français, et rien que.
   *
   * Nom, titre, devise, directeur, description, lore : six champs de prose
   * rédigés ici, jamais traduits. Les servir à toutes les branches faisait lire
   * « Département de Pataphysique » et « Division Métanarrative & Quatrième Mur »
   * à qui avait choisi l'anglais, alors que le répertoire du wiki connaît
   * « Pataphysics Department ». Hors du français, on s'en remet donc au wiki —
   * qui n'a parfois qu'un nom, et c'est encore mieux qu'un paragraphe français.
   *
   * Ce qui n'est pas de la prose — code de dossier, accréditation, palette —
   * reste pris au calque : ces valeurs valent dans toutes les langues.
   */
  const prose = langue === 'fr' ? editorial : undefined;

  return {
    id: entite.id,
    entiteId: entite.id,
    slug: entite.id,
    name: prose?.name ?? nom,
    code: editorial?.code ?? codeDe(entite),
    category: VERS_ANCIENNE[entite.categorie],
    title: prose?.title ?? entite.designation ?? nom,
    director: prose?.director,
    clearanceLevel: editorial?.clearanceLevel ?? ACCREDITATION[entite.categorie],
    motto: prose?.motto,
    // Le résumé du wiki est plus fiable qu'une description rédigée : il vient de la
    // page que la communauté maintient. On garde le texte éditorial en repli.
    description: resume ?? prose?.description ?? nom,
    lore: prose?.lore ?? resume ?? '',
    // Le résumé étant repris mot pour mot de l'annuaire, la licence CC BY-SA 3.0
    // impose d'en citer la source. Le résumé vient toujours de la branche
    // affichée — il n'y a pas de repli de langue — donc c'est sa page qu'on cite.
    // Sans résumé, rien à créditer : le texte vient alors du calque éditorial,
    // écrit ici.
    sourceWiki: resume ? pageSourceEntite(entite, langue) : undefined,
    queryKeywords: Object.values(entite.tags).flat(),
    // C'est LE changement : la liste vient de l'index, plus de la saisie manuelle.
    iconicScps: dossiers,
    color: editorial?.color ?? palette.color,
    badgeBg: editorial?.badgeBg ?? palette.badgeBg,
    badgeBorder: editorial?.badgeBorder ?? palette.badgeBorder,
    badgeText: editorial?.badgeText ?? palette.badgeText
  };
}

/** Le calque éditorial d'une entité, s'il y en a un. */
export function calqueEditorial(id: string): ScpEntity | undefined {
  return CALQUE.get(id);
}

/**
 * Une des quatre listes d'accès rapide, rendue dans la langue affichée.
 *
 * `SCP_DEPARTMENTS`, `SCP_RESEARCHERS`, `SCP_GOI` et `SCP_SITES` sont du texte
 * français : le tiroir de l'accueil affichait « Département de Pataphysique » et
 * « Division Métanarrative & Quatrième Mur » à qui avait choisi l'anglais.
 * Chaque entrée repasse donc par le répertoire du wiki, qui connaît son nom dans
 * la branche — et, à défaut, son nom anglais.
 *
 * Une entrée que le wiki ne connaît pas sort de la liste hors du français : il
 * n'existe alors aucune version non française de son nom, et une ligne française
 * au milieu d'une liste anglaise est exactement ce qu'on retire. Onze des
 * soixante-huit sont dans ce cas.
 *
 * Renvoie une liste vide tant que le répertoire n'est pas chargé — l'appelant
 * doit donc déclencher `chargerRepertoire()` et redemander ensuite.
 */
export function calqueDansLaLangue(liste: ScpEntity[], langue: string): ScpEntity[] {
  if (langue === 'fr') return liste;

  const sortie: ScpEntity[] = [];
  for (const entree of liste) {
    const entite = entree.entiteId ? entiteParId(entree.entiteId) : undefined;
    if (!entite) continue;
    // `nomEntite()` finit par rendre n'importe quel nom connu plutôt qu'un
    // identifiant — bon repli dans l'explorateur, mauvais ici : la seule entité
    // dont le wiki ne connaisse que le nom français y reviendrait par la bande.
    if (!(entite.noms[langue] ?? entite.noms.en ?? entite.designation)) continue;
    sortie.push(versScpEntity(entite, langue, dossiersDeLEntite(entite.id, langue)));
  }
  return sortie;
}
