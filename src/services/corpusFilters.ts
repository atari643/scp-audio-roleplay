/**
 * Application des filtres d'écoute sur l'index de corpus.
 *
 * Sépare volontairement DEUX familles de critères, parce qu'elles ne s'exécutent pas au
 * même endroit :
 *
 *   CÔTÉ SERVEUR   ce que Crom sait filtrer lui-même — les tags (donc l'ambiance et la
 *                  classe) et la note. On le laisse faire : c'est lui qui a le corpus.
 *   CÔTÉ INDEX     ce que Crom ignore — la durée, la part de dialogue, la présence d'une
 *                  vignette, la notoriété par cohorte. Aucun de ces quatre n'est
 *                  exprimable dans un `QueryPagesFilter`.
 *
 * Le filtre « illustré » mérite un mot : le tag `_image` ne couvre que 15 % des dossiers
 * qui ont réellement une vignette (mesuré sur 400 SCP-FR : 215 ont une `thumbnailUrl`,
 * 59 seulement portent le tag). Passer par le tag raterait les trois quarts du catalogue
 * illustré — d'où le champ `i` de l'index, et non une requête serveur.
 */

import {
  AMBIANCES,
  CLASSES_INDEX,
  PALIERS_DUREE,
  ambiancesDe,
  notoriete,
  palierDuree,
  typeEcoute,
  type EntreeIndex,
  type IdAmbiance,
  type IndexCorpus,
  type Notoriete,
  type PalierDuree,
  type TypeEcoute
} from './corpusIndex';
import type { ObjectClass, ScpItemSummary } from '../types/scp';

export interface FiltresEcoute {
  duree?: PalierDuree | null;
  ecoute?: TypeEcoute | null;
  ambiance?: IdAmbiance | null;
  notoriete?: Notoriete;
  /** Ne garder que les dossiers ayant une vignette. */
  illustre?: boolean;
  /** Ne garder que les créations originales de la branche (pas les traductions). */
  originalUniquement?: boolean;
}

export const FILTRES_VIDES: FiltresEcoute = {};

export function filtresActifs(f: FiltresEcoute): number {
  return [
    f.duree,
    f.ecoute,
    f.ambiance,
    f.notoriete,
    f.illustre || undefined,
    f.originalUniquement || undefined
  ].filter(Boolean).length;
}

// ------------------------------------------------------- chargement de l'index

/**
 * Les index sont chargés à la demande, jamais au démarrage.
 *
 * L'index français pèse 391 Ko de JSON : l'importer statiquement l'ajouterait au bundle
 * principal et le ferait analyser au premier rendu, pour une fonctionnalité que
 * l'utilisateur n'a peut-être pas ouverte. `import()` le sort dans son propre morceau.
 */
const indexCharges = new Map<string, IndexCorpus | null>();
const chargements = new Map<string, Promise<IndexCorpus | null>>();

export async function chargerIndex(langue: string): Promise<IndexCorpus | null> {
  if (indexCharges.has(langue)) return indexCharges.get(langue) ?? null;

  const enCours = chargements.get(langue);
  if (enCours) return enCours;

  const promesse = (async () => {
    try {
      // Le chemin est explicite (pas de variable seule) pour que Vite sache quoi préparer.
      const module = await import(`../data/corpusIndex.${langue}.json`);
      const index = (module.default ?? module) as IndexCorpus;
      indexCharges.set(langue, index);
      return index;
    } catch {
      // Toutes les branches n'ont pas d'index : c'est un cas normal, pas une panne.
      // Les filtres qui en dépendent seront simplement inertes.
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
export function indexDisponible(langue: string): IndexCorpus | null {
  return indexCharges.get(langue) ?? null;
}

// ------------------------------------------------------------------ filtrage

function correspond(entree: EntreeIndex, filtres: FiltresEcoute, index: IndexCorpus): boolean {
  if (filtres.duree && palierDuree(entree) !== filtres.duree) return false;
  if (filtres.ecoute && typeEcoute(entree) !== filtres.ecoute) return false;
  if (filtres.ambiance && !ambiancesDe(entree).includes(filtres.ambiance)) return false;
  if (filtres.notoriete && notoriete(entree, index) !== filtres.notoriete) return false;
  if (filtres.illustre && !entree.i) return false;
  if (filtres.originalUniquement && !entree.o) return false;
  return true;
}

/**
 * Filtre une liste de dossiers.
 *
 * Un dossier ABSENT de l'index est conservé tant qu'aucun filtre d'index n'est actif, et
 * écarté dès qu'il y en a un : on ne peut pas affirmer qu'il dure moins de 5 minutes si on
 * ne connaît pas sa durée. C'est le comportement le moins trompeur — et il concerne
 * surtout les branches sans index et les pages hors du tag `scp`.
 */
export function appliquerFiltres(
  items: ScpItemSummary[],
  filtres: FiltresEcoute,
  index: IndexCorpus | null
): ScpItemSummary[] {
  if (filtresActifs(filtres) === 0) return items;
  if (!index) return items;

  return items.filter(item => {
    const entree = index.entrees[item.slug.toLowerCase()];
    if (!entree) return false;
    return correspond(entree, filtres, index);
  });
}

/** Combien de dossiers de la liste passeraient chaque valeur d'un filtre donné. */
export function compter(
  items: ScpItemSummary[],
  index: IndexCorpus | null
): {
  duree: Record<string, number>;
  ecoute: Record<string, number>;
  ambiance: Record<string, number>;
  illustre: number;
  original: number;
  patrimoine: number;
  pepite: number;
} {
  const vide = {
    duree: {} as Record<string, number>,
    ecoute: {} as Record<string, number>,
    ambiance: {} as Record<string, number>,
    illustre: 0,
    original: 0,
    patrimoine: 0,
    pepite: 0
  };
  if (!index) return vide;

  for (const item of items) {
    const e = index.entrees[item.slug.toLowerCase()];
    if (!e) continue;
    const d = palierDuree(e);
    vide.duree[d] = (vide.duree[d] ?? 0) + 1;
    const t = typeEcoute(e);
    vide.ecoute[t] = (vide.ecoute[t] ?? 0) + 1;
    for (const a of ambiancesDe(e)) vide.ambiance[a] = (vide.ambiance[a] ?? 0) + 1;
    if (e.i) vide.illustre++;
    if (e.o) vide.original++;
    const n = notoriete(e, index);
    if (n === 'patrimoine') vide.patrimoine++;
    else if (n === 'pepite') vide.pepite++;
  }
  return vide;
}

// ------------------------------------------------------- métadonnées d'affichage

export interface MetaDossier {
  duree: string;
  palier: PalierDuree;
  ecoute: TypeEcoute;
  /** Nombre de locuteurs distincts — le « nombre de voix » de la carte. */
  voix: number;
  partDialogue: number;
  ambiances: IdAmbiance[];
  notoriete: Notoriete;
  classe: ObjectClass;
  illustre: boolean;
  original: boolean;
  /** La durée n'est qu'un minorant : dossier paginé, seule la page 1 est comptée. */
  dureeApproximative: boolean;
}

/** Tout ce qu'une carte peut afficher pour un dossier, ou `null` s'il n'est pas indexé. */
export function metaDossier(slug: string, index: IndexCorpus | null): MetaDossier | null {
  if (!index) return null;
  const e = index.entrees[slug.toLowerCase()];
  if (!e) return null;

  return {
    duree: dureeCourte(e),
    palier: palierDuree(e),
    ecoute: typeEcoute(e),
    voix: e.v,
    partDialogue: 100 - e.n,
    ambiances: ambiancesDe(e),
    notoriete: notoriete(e, index),
    classe: CLASSES_INDEX[e.k] ?? 'Non assigné',
    illustre: Boolean(e.i),
    original: Boolean(e.o),
    dureeApproximative: Boolean(e.p)
  };
}

/** Format compact pour un badge de carte : « 3 min », « 1 h 04 », « ~26 min + ». */
function dureeCourte(e: EntreeIndex): string {
  const total = Math.max(1, Math.round(e.m / 150));
  const h = Math.floor(total / 60);
  const texte = h > 0 ? `${h} h ${String(total % 60).padStart(2, '0')}` : `${total} min`;
  return e.p ? `~${texte} +` : texte;
}

// ------------------------------------------------------- listes pour l'interface

export const OPTIONS_DUREE = PALIERS_DUREE.map(p => ({
  id: p.id,
  label: p.label,
  icone: p.icone
}));

export const OPTIONS_ECOUTE: Array<{ id: TypeEcoute; label: string; icone: string }> = [
  { id: 'solo', label: 'Rapport solo', icone: '🎙️' },
  { id: 'theatre', label: 'Théâtre audio', icone: '🎭' }
];

export const OPTIONS_AMBIANCE = AMBIANCES.map(a => ({
  id: a.id,
  label: a.label,
  icone: a.icone
}));

export const OPTIONS_NOTORIETE: Array<{ id: Exclude<Notoriete, null>; label: string; icone: string }> = [
  { id: 'patrimoine', label: 'Patrimoine culte', icone: '🏛️' },
  { id: 'pepite', label: 'Pépite méconnue', icone: '💎' }
];
