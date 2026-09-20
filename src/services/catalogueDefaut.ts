import { ScpItemSummary } from '../types/scp';

/**
 * Le catalogue affiché au démarrage, dans la langue de la branche.
 *
 * Il existait, mais bâti sur une seule branche et servi à tout le monde : un
 * lecteur anglophone voyait « SCP-101-FR » et « La Statue - L'original », le
 * titre français de SCP-173. L'interface avait beau être traduite, le catalogue
 * qu'elle encadrait venait d'ailleurs.
 *
 * Un fichier par branche désormais (`src/data/catalogue.<lang>.json`, généré par
 * `node scripts/build-entities.mjs --iconiques --lang <code>`), chargé à la
 * demande — le patron de `entityIndex.<lang>.json` et de `entityResumes`.
 *
 * Le chargement est asynchrone, la lecture synchrone : le rendu ne doit pas
 * déclencher de téléchargement, et `catalogueDe()` se contente de ce qui est
 * déjà en mémoire.
 */

const charges = new Map<string, ScpItemSummary[]>();
const enCours = new Map<string, Promise<ScpItemSummary[]>>();

/**
 * Charge le catalogue d'une branche, une seule fois.
 *
 * Une branche sans fichier renvoie une liste vide plutôt qu'une erreur : toutes
 * n'ont pas été générées, et l'application doit rester utilisable — la recherche
 * et les séries, elles, interrogent Crom en direct.
 */
export async function chargerCatalogue(langue: string): Promise<ScpItemSummary[]> {
  const deja = charges.get(langue);
  if (deja) return deja;

  const enVol = enCours.get(langue);
  if (enVol) return enVol;

  const promesse = (async () => {
    try {
      const module = await import(`../data/catalogue.${langue}.json`);
      const items = (module.default ?? module) as ScpItemSummary[];
      charges.set(langue, items);
      return items;
    } catch {
      charges.set(langue, []);
      return [];
    } finally {
      enCours.delete(langue);
    }
  })();

  enCours.set(langue, promesse);
  return promesse;
}

/** Le catalogue déjà en mémoire, ou une liste vide. Synchrone : pour le rendu. */
export function catalogueDe(langue: string): ScpItemSummary[] {
  return charges.get(langue) ?? [];
}

const index = new Map<string, Map<string, ScpItemSummary>>();

/**
 * Index slug → dossier, pour compléter ce que Crom ne renvoie pas.
 *
 * Une page de série ne donne qu'un lien et un titre : ni note, ni vignette, ni
 * classe. Le catalogue de la branche les a déjà, alors on les recolle. La clé
 * est le slug et le numéro, parce que les pages de série citent les deux.
 *
 * Par branche, évidemment : c'est la même faute qu'ailleurs que d'aller chercher
 * la vignette française d'un dossier anglais.
 */
export function enrichissementDe(langue: string): Map<string, ScpItemSummary> {
  const deja = index.get(langue);
  if (deja) return deja;

  const carte = new Map<string, ScpItemSummary>();
  for (const item of catalogueDe(langue)) {
    carte.set(item.slug.toLowerCase(), item);
    carte.set(item.scpNumber.toLowerCase(), item);
  }
  // Mémorisé seulement si le catalogue est arrivé : sinon on garderait une carte
  // vide pour toute la session.
  if (carte.size > 0) index.set(langue, carte);
  return carte;
}
