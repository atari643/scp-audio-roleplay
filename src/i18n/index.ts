import { useSyncExternalStore } from 'react';
import { CleTraduction, Dictionnaire, FR } from './fr';
import { EN } from './en';

/**
 * Les textes de l'interface, dans la langue choisie.
 *
 * Choisir l'anglais changeait le catalogue SCP mais pas un mot de l'interface :
 * on lisait un dossier anglais entouré de boutons français, et le badge du
 * locuteur annonçait « Archiviste » à chaque réplique. C'est ce que ce module
 * corrige.
 *
 * **Écrit à la main, sans bibliothèque.** Le projet refuse les frameworks
 * ajoutés, et il n'a besoin ni de pluriels complexes, ni d'interpolation riche,
 * ni de contextes — cent lignes suffisent là où `i18next` en pèse quarante
 * mille.
 *
 * **Singleton hors React**, comme `speechEngine` et `sfx` : la langue est un
 * état global, et la faire passer en prop à travers quarante-deux composants
 * reviendrait à réécrire l'arbre pour un réglage. Les composants s'y abonnent
 * par `useT()`.
 *
 * Le français est embarqué ; les neuf autres branches arrivent en `import()`,
 * exactement comme `entityIndex.<lang>.json` — dix dictionnaires dans le paquet
 * d'entrée pèseraient autant que l'application. Elles vivent dans `langues/` et
 * non ici : Vite refuse un import dynamique qui viserait son propre répertoire.
 */

// L'anglais démarre chargé : c'est la langue par défaut, et l'attendre en
// `import()` ferait afficher le français le temps d'un rendu.
let langueCourante = 'en';
let dictionnaire: Dictionnaire = EN;

const abonnes = new Set<() => void>();
const charges = new Map<string, Dictionnaire>([
  ['fr', FR],
  ['en', EN]
]);

/**
 * L'instantané que lit `useSyncExternalStore`.
 *
 * Un **compteur**, et surtout pas la langue.
 *
 * `definirLangue()` notifie deux fois : une fois en posant la langue, une
 * seconde fois quand le dictionnaire est arrivé — et c'est la seconde qui
 * compte, puisque c'est elle qui apporte les traductions. Avec la langue pour
 * instantané, la seconde notification lisait la même valeur que la première,
 * React en concluait que rien n'avait changé, et ne re-rendait pas : le
 * dictionnaire anglais était bien téléchargé, mais jamais affiché.
 *
 * Le compteur change à chaque notification, donc aucune ne peut être avalée. Il
 * doit rester stable entre deux appels sans notification, sinon React boucle —
 * d'où l'incrément dans `prevenir()` et nulle part ailleurs.
 */
let version = 0;

function instantane(): number {
  return version;
}

function prevenir(): void {
  version++;
  for (const abonne of abonnes) abonne();
}

function sabonner(callback: () => void): () => void {
  abonnes.add(callback);
  return () => {
    abonnes.delete(callback);
  };
}

/**
 * Charge une branche et l'applique.
 *
 * Idempotent et sûr en concurrence : deux changements rapprochés ne peuvent pas
 * laisser l'interface dans la langue intermédiaire, puisque seul le dernier
 * appel encore d'actualité écrit `dictionnaire`.
 */
export async function definirLangue(code: string): Promise<void> {
  if (code === langueCourante) return;

  const deja = charges.get(code);
  if (deja) {
    langueCourante = code;
    dictionnaire = deja;
    prevenir();
    return;
  }

  // La langue est posée tout de suite : les clés déjà traduites côté français
  // restent lisibles, et l'interface ne clignote pas en attendant le fichier.
  langueCourante = code;
  prevenir();

  try {
    const module = await import(`./langues/${code}.json`);
    const charge = (module.default ?? module) as Dictionnaire;
    charges.set(code, charge);
    // Une autre bascule a pu passer entre-temps : on n'applique que si c'est
    // toujours cette langue qui est demandée.
    if (langueCourante === code) {
      dictionnaire = charge;
      prevenir();
    }
  } catch {
    // Branche sans traduction : on retombe sur l'anglais plutôt que d'afficher
    // des clés nues. Mémorisé pour ne pas retenter à chaque bascule.
    charges.set(code, EN);
    if (langueCourante === code) {
      dictionnaire = EN;
      prevenir();
    }
  }
}

/**
 * Le texte d'une clé.
 *
 * `params` remplace les marques `{nom}`. Une clé absente de la traduction
 * retombe sur le français : un texte dans la mauvaise langue reste préférable à
 * `erreur.relancer` affiché tel quel à l'écran.
 */
export function t(cle: CleTraduction, params?: Record<string, string>): string {
  // Repli en cascade : la branche affichée, puis l'anglais qui est le défaut,
  // puis le français qui définit les clés. Un texte dans la mauvaise langue
  // reste préférable à `erreur.relancer` affiché tel quel.
  let texte: string = dictionnaire[cle] ?? EN[cle] ?? FR[cle] ?? cle;
  if (params) {
    for (const [nom, valeur] of Object.entries(params)) {
      texte = texte.split(`{${nom}}`).join(valeur);
    }
  }
  return texte;
}

/**
 * Le libellé d'une catégorie d'entité, au singulier ou au pluriel.
 *
 * `CATEGORIES` (`src/types/entities.ts`) porte encore les libellés français : ils
 * servent aux scripts de construction, qui tournent hors navigateur. L'affichage
 * passe par ici.
 */
export function libelleCategorie(id: string, pluriel = false): string {
  return t(`categorie.${id}${pluriel ? '.pluriel' : ''}` as CleTraduction);
}

/** La langue affichée. Utile pour poser `lang` sur un élément. */
export function langueInterface(): string {
  return langueCourante;
}

/**
 * La fonction de traduction, réévaluée quand la langue change.
 *
 * `useSyncExternalStore` plutôt qu'un contexte : le singleton existe déjà hors
 * React, et un contexte imposerait un fournisseur à la racine pour un état qui
 * n'en a pas besoin.
 */
export function useT(): typeof t {
  useSyncExternalStore(sabonner, instantane, instantane);
  return t;
}

export type { CleTraduction };

