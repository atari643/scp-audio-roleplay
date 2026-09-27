// Extension `.js` explicite : ce module est aussi chargé par le middleware Vercel
// (`middleware.ts` → `server/apercuPartage.ts`), où un import relatif sans extension
// n'existe pas en ESM. Voir `api/tts.ts` pour le même piège, déjà payé.
import { LANGUE_PAR_DEFAUT } from '../types/scp.js';

/**
 * L'adresse publique de l'application, et les adresses qui en dérivent.
 *
 * **Une seule adresse fait foi**, celle de Vercel : c'est l'hébergement principal,
 * le seul qui porte `/api/tts` et le middleware des aperçus. Le miroir GitHub Pages
 * sert la même application sous un autre domaine ; sans adresse canonique commune,
 * un moteur de recherche verrait deux sites identiques et en déclasserait un — pas
 * forcément le bon.
 *
 * Lue par quatre consommateurs, d'où ce module sans dépendance :
 *  · l'application (lien canonique, bouton « Partager ») ;
 *  · `vite.config.ts` (balises d'aperçu de `index.html`, `robots.txt`, `sitemap.xml`) ;
 *  · le middleware Vercel et `npm run serve` (aperçu d'un lien de dossier).
 *
 * Changer de domaine, c'est changer cette ligne et rebâtir.
 */
export const URL_SITE = 'https://scp-audio-roleplay.vercel.app';

/** Le nom affiché en suffixe des titres d'onglet et des aperçus. Une marque : jamais traduit. */
export const NOM_SITE = 'SCP Audio Roleplay';

/**
 * L'adresse qui fait foi pour un dossier (ou pour l'accueil, `slug` nul).
 *
 * Forme **normalisée** — `scp` puis `lang`, la langue omise quand c'est celle par
 * défaut — parce que le lien canonique, le plan du site et l'aperçu du middleware
 * doivent produire octet pour octet la même adresse : deux écritures du même
 * dossier seraient deux pages pour un moteur de recherche.
 */
export function adresseCanonique(slug: string | null, codeLangue: string): string {
  return construire(slug, codeLangue, false);
}

/**
 * L'adresse que copie le bouton « Partager » : la langue y est TOUJOURS écrite.
 *
 * Sans elle, le lien d'un dossier anglais ouvrirait, chez quelqu'un qui a déjà
 * choisi le français, la traduction française — la langue mémorisée l'emporte
 * quand l'adresse ne dit rien. Un lien partagé doit ouvrir ce que la personne qui
 * le partage avait sous les yeux. Pour un moteur de recherche, les deux formes
 * n'en font qu'une : la page déclare l'adresse canonique.
 */
export function adresseDePartage(slug: string, codeLangue: string): string {
  return construire(slug, codeLangue, true);
}

function construire(slug: string | null, codeLangue: string, langueExplicite: boolean): string {
  const params = new URLSearchParams();
  if (slug) params.set('scp', slug);
  if (langueExplicite || codeLangue !== LANGUE_PAR_DEFAUT.code) params.set('lang', codeLangue);
  const requete = params.toString();
  return `${URL_SITE}/${requete ? `?${requete}` : ''}`;
}

/**
 * « SCP-3008 — Un IKEA tout à fait normal », ou le seul numéro quand le dossier n'a
 * pas d'autre nom.
 *
 * Le titre alternatif est préféré : c'est le nom sous lequel le wiki liste le
 * dossier. Le numéro n'est jamais répété — sans cette garde, SCP-3008 sans titre
 * alternatif s'afficherait « SCP-3008 — SCP-3008 », et la branche russe, dont les
 * titres alternatifs recopient le numéro, « SCP-173 — SCP-173 - Скульптура ».
 */
export function titreDossier(numero: string, titre?: string, titreAlternatif?: string): string {
  const prefixe = numero.toLowerCase();
  const nom = [titreAlternatif, titre]
    .map(n => {
      const brut = n?.trim() ?? '';
      // Le numéro seulement s'il est entier : « SCP-1730 » ne commence pas par « SCP-173 ».
      const repete = brut.toLowerCase().startsWith(prefixe) && !/[\p{L}\p{N}]/u.test(brut.charAt(numero.length));
      return repete ? brut.slice(numero.length).replace(/^[\s:–—-]+/, '') : brut;
    })
    .find(n => n.length > 0);
  return nom ? `${numero} — ${nom}` : numero;
}
