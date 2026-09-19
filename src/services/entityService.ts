/**
 * Lecture du répertoire d'entités et de ses arêtes.
 *
 * Décalque `corpusFilters.ts` : mêmes `import()` dynamiques, même cache, même repli
 * silencieux quand une branche n'a pas d'index. Les deux fichiers sont volumineux
 * (347 Ko pour le répertoire) et ne concernent qu'une partie des écrans — les charger
 * au démarrage ferait payer à tout le monde une fonctionnalité que beaucoup n'ouvrent
 * jamais.
 *
 * Service PARTAGÉ desktop et mobile : la règle du projet veut qu'une correction ici
 * profite aux deux plutôt que d'être dupliquée dans `desktop/` puis `mobile/`.
 */

import {
  CategorieEntite,
  Certitude,
  Entite,
  EntreeEntites,
  IndexEntites,
  RepertoireEntites
} from '../types/entities';

// ------------------------------------------------------------------ chargement

let repertoire: RepertoireEntites | null = null;
let chargementRepertoire: Promise<RepertoireEntites | null> | null = null;
const parId = new Map<string, Entite>();

const indexCharges = new Map<string, IndexEntites | null>();
const chargements = new Map<string, Promise<IndexEntites | null>>();

/**
 * Les résumés d'annuaire, par branche puis par entité.
 *
 * Ils vivent hors de `entities.json` parce qu'ils pèsent dix fois le reste : les
 * y laisser faisait télécharger les dix langues à qui n'en lit qu'une. Chargés
 * avec l'index de la branche, donc sans aller-retour supplémentaire.
 */
const resumesCharges = new Map<string, Record<string, string>>();

async function chargerResumes(langue: string): Promise<void> {
  if (resumesCharges.has(langue)) return;
  try {
    const module = await import(`../data/entityResumes.${langue}.json`);
    resumesCharges.set(langue, (module.default ?? module) as Record<string, string>);
  } catch {
    // Toutes les branches n'ont pas d'annuaire rédigé : cas normal. On mémorise
    // l'absence pour ne pas retenter à chaque rendu.
    resumesCharges.set(langue, {});
  }
}

/** Le répertoire, chargé une seule fois pour toute la session. */
export async function chargerRepertoire(): Promise<RepertoireEntites | null> {
  if (repertoire) return repertoire;
  if (chargementRepertoire) return chargementRepertoire;

  chargementRepertoire = (async () => {
    try {
      const module = await import('../data/entities.json');
      const charge = (module.default ?? module) as RepertoireEntites;
      repertoire = charge;
      for (const entite of charge.entites) parId.set(entite.id, entite);
      return charge;
    } catch {
      // Le répertoire n'est pas encore construit : les écrans d'entités seront
      // simplement vides, l'application continue de lire les dossiers.
      return null;
    } finally {
      chargementRepertoire = null;
    }
  })();

  return chargementRepertoire;
}

/**
 * Les arêtes d'une branche.
 *
 * Le chemin est explicite (pas une variable seule) pour que Vite sache quels fichiers
 * préparer — même contrainte que `chargerIndex` dans `corpusFilters.ts`.
 */
export async function chargerEntites(langue: string): Promise<IndexEntites | null> {
  if (indexCharges.has(langue)) return indexCharges.get(langue) ?? null;

  const enCours = chargements.get(langue);
  if (enCours) return enCours;

  const promesse = (async () => {
    // Les résumés de la branche arrivent avec son index : même granularité, même
    // moment d'usage, et `resumeEntite()` reste synchrone pour le rendu.
    await Promise.all([chargerRepertoire(), chargerResumes(langue)]);
    try {
      const module = await import(`../data/entityIndex.${langue}.json`);
      const index = (module.default ?? module) as IndexEntites;
      indexCharges.set(langue, index);
      return index;
    } catch {
      // Toutes les branches n'ont pas d'index : cas normal, pas une panne.
      indexCharges.set(langue, null);
      return null;
    } finally {
      chargements.delete(langue);
    }
  })();

  chargements.set(langue, promesse);
  return promesse;
}

/** L'index déjà chargé, ou `null`. Synchrone : pour le rendu. */
export function entitesDisponibles(langue: string): IndexEntites | null {
  return indexCharges.get(langue) ?? null;
}

/** Le répertoire déjà chargé, ou `null`. Synchrone : pour le rendu. */
export function repertoireDisponible(): RepertoireEntites | null {
  return repertoire;
}

// --------------------------------------------------------------------- lecture

/**
 * Le libellé d'une entité dans une langue.
 *
 * Repli sur l'anglais puis sur la désignation : la plupart des entités ne sont
 * nommées que dans les branches dont l'annuaire les décrit, et l'anglais est la seule
 * présente partout. Une installation sans nom garde sa désignation (« Site-19 »),
 * qui reste juste dans toutes les langues.
 */
export function nomEntite(entite: Entite, langue: string): string {
  return (
    entite.noms[langue] ??
    entite.noms.en ??
    entite.designation ??
    Object.values(entite.noms)[0] ??
    entite.id
  );
}

/**
 * La page du wiki à citer pour une entité.
 *
 * Le résumé d'une entité est repris mot pour mot de l'annuaire : CC BY-SA 3.0 en
 * exige la source, et c'est ce que renvoie cette fonction. Même repli que
 * `nomEntite()` — la langue affichée, puis l'anglais qui est la seule branche
 * présente partout, puis n'importe quelle branche connue. `undefined` quand le
 * répertoire n'a aucune page : il n'y a alors rien d'honnête à afficher.
 */
export function pageSourceEntite(entite: Entite, langue: string): string | undefined {
  return entite.pages[langue] ?? entite.pages.en ?? Object.values(entite.pages)[0];
}

/**
 * Le résumé d'une entité, dans la langue affichée **et dans aucune autre**.
 *
 * Contrairement à `nomEntite()`, pas de repli sur l'anglais : afficher un
 * paragraphe anglais à un lecteur qui a choisi le français est précisément le
 * mélange qu'on cherche à supprimer. Sans résumé dans la branche, la fiche s'en
 * passe — elle garde son nom, sa désignation et ses dossiers.
 *
 * Synchrone : lit ce que `chargerEntites()` a déjà mis en mémoire. Une branche
 * non chargée renvoie `undefined` plutôt que de déclencher un téléchargement
 * pendant le rendu.
 */
export function resumeEntite(entite: Entite, langue: string): string | undefined {
  return resumesCharges.get(langue)?.[entite.id];
}

export function entiteParId(id: string): Entite | undefined {
  return parId.get(id);
}

/** Un rattachement lu : l'entité, et par quel chemin on l'a établie. */
export interface Rattachement {
  entite: Entite;
  certitude: Certitude;
}

const ORDRE_CERTITUDE: Array<[keyof EntreeEntites, Certitude]> = [
  ['t', 'tag'],
  ['a', 'annuaire'],
  ['o', 'origine'],
  ['m', 'mention']
];

/**
 * Les entités auxquelles un dossier est rattaché, les plus sûres d'abord.
 *
 * L'ordre compte : l'UI doit pouvoir couper après les certitudes confirmées sans
 * trier elle-même, et ne jamais présenter une mention comme un fait établi.
 */
export function entitesDuDossier(slug: string, langue: string): Rattachement[] {
  const index = entitesDisponibles(langue);
  const entree = index?.entrees[slug.toLowerCase()];
  if (!entree) return [];

  const rattachements: Rattachement[] = [];
  for (const [cle, certitude] of ORDRE_CERTITUDE) {
    for (const id of entree[cle] ?? []) {
      const entite = parId.get(id);
      if (entite) rattachements.push({ entite, certitude });
    }
  }
  return rattachements;
}

/** Les slugs des dossiers d'une entité, les mieux notés d'abord. */
export function dossiersDeLEntite(id: string, langue: string): string[] {
  return entitesDisponibles(langue)?.parEntite[id] ?? [];
}

/**
 * Combien de dossiers une entité rassemble, en séparant le confirmé du probable.
 *
 * C'est ce décompte qui remplace `entity.iconicScps.length`, qui comptait une liste
 * tapée à la main. Mélanger les deux reproduirait le défaut qu'on retire : présenter
 * une inférence avec l'aplomb d'un fait.
 */
export function compterDossiers(id: string, langue: string): { confirmes: number; mentions: number } {
  const index = entitesDisponibles(langue);
  if (!index) return { confirmes: 0, mentions: 0 };

  let confirmes = 0;
  let mentions = 0;
  for (const slug of index.parEntite[id] ?? []) {
    const entree = index.entrees[slug];
    if (!entree) continue;
    if (entree.t?.includes(id) || entree.a?.includes(id) || entree.o?.includes(id)) confirmes++;
    else if (entree.m?.includes(id)) mentions++;
  }
  return { confirmes, mentions };
}

/**
 * Les entités d'une catégorie, celles qui ont des dossiers d'abord.
 *
 * Le répertoire contient 406 installations, dont la plupart ne servent que de
 * vocabulaire pour filtrer les mentions : le wiki les nomme quelque part sans leur
 * consacrer de page. Les afficher au même rang que le Site-19 n'aurait aucun sens ;
 * les cacher effacerait des lieux réels. On les classe donc, sans les jeter.
 */
export function entitesParCategorie(categorie: CategorieEntite, langue: string): Entite[] {
  const entites = repertoire?.entites.filter(e => e.categorie === categorie) ?? [];
  const index = entitesDisponibles(langue);

  return entites
    .map(entite => ({
      entite,
      dossiers: index?.parEntite[entite.id]?.length ?? 0,
      nomme: Object.keys(entite.noms).length > 0
    }))
    .sort((a, b) => {
      if (a.nomme !== b.nomme) return a.nomme ? -1 : 1;
      if (a.dossiers !== b.dossiers) return b.dossiers - a.dossiers;
      return nomEntite(a.entite, langue).localeCompare(nomEntite(b.entite, langue));
    })
    .map(x => x.entite);
}

/** Combien d'entités par catégorie, pour les compteurs de navigation. */
export function compterParCategorie(langue: string): Record<CategorieEntite, number> {
  const compte = {} as Record<CategorieEntite, number>;
  for (const entite of repertoire?.entites ?? []) {
    if (!Object.keys(entite.noms).length && !(entitesDisponibles(langue)?.parEntite[entite.id]?.length)) continue;
    compte[entite.categorie] = (compte[entite.categorie] ?? 0) + 1;
  }
  return compte;
}

/** Recherche libre dans le répertoire : nom, désignation, identifiant, tags. */
export function chercherEntites(requete: string, langue: string, limite = 40): Entite[] {
  const q = requete.trim().toLowerCase();
  if (!q) return [];

  const resultats: Array<{ entite: Entite; score: number }> = [];
  for (const entite of repertoire?.entites ?? []) {
    const nom = nomEntite(entite, langue).toLowerCase();
    let score = 0;
    if (nom === q) score = 100;
    else if (nom.startsWith(q)) score = 60;
    else if (nom.includes(q)) score = 40;
    else if (entite.designation?.toLowerCase().includes(q)) score = 35;
    else if (entite.id.includes(q)) score = 20;
    else if (Object.values(entite.tags).flat().some(t => t.includes(q))) score = 15;
    if (score > 0) resultats.push({ entite, score });
  }

  return resultats
    .sort((a, b) => b.score - a.score || nomEntite(a.entite, langue).localeCompare(nomEntite(b.entite, langue)))
    .slice(0, limite)
    .map(r => r.entite);
}
