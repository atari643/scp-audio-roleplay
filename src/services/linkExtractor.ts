/**
 * Extraction des liens d'un dossier à partir de sa source Wikidot.
 *
 * Pourquoi passer par `source` et pas par le texte affiché : le `textContent` que renvoie
 * Crom ne contient **aucune cible de lien** — vérifié sur SCP-6172, 0 occurrence de `[[[`
 * ou de `http` pour 29 liens présents dans la source. L'app est donc aveugle aux liens si
 * elle ne lit que le texte rendu.
 *
 * La classification se fait sur la forme du slug, sans aucun appel réseau : le rendu ne
 * doit jamais attendre une requête pour afficher un lien.
 */

export type WikiLinkKind = 'scp' | 'tale' | 'hub' | 'goi' | 'external';

export interface WikiLink {
  /** Slug wikidot pour un lien interne, URL complète pour un lien externe. */
  target: string;
  /** Texte affiché dans l'article — sert aussi à retrouver la position du lien. */
  label: string;
  kind: WikiLinkKind;
  /** Renseigné uniquement pour les liens externes. */
  url?: string;
}

/**
 * Libellés trop génériques pour être ancrés : les rattacher produirait des faux positifs
 * partout dans le texte. SCP-6172 utilise deux fois « link » comme libellé.
 */
const GENERIC_LABELS = new Set([
  'link', 'links', 'lien', 'liens', 'here', 'ici', 'this', 'ce', 'cette', 'voir', 'see',
  'more', 'plus', 'page', 'article', 'source', 'note'
]);

/** Slugs techniques : thèmes et composants de mise en page, jamais du contenu. */
function isTechnical(target: string): boolean {
  return /^(?:theme|component|info|include|module|css):/i.test(target);
}

function classify(target: string): WikiLinkKind {
  const t = target.toLowerCase();
  if (/^https?:\/\//.test(t)) return 'external';
  if (/-hub$/.test(t) || /\bhub\b/.test(t) || /homescreen$/.test(t)) return 'hub';
  if (/^scp-\d/.test(t)) return 'scp';
  // Les formats GdI et pages encyclopédiques imitent un support extérieur à la Fondation.
  if (/wikipedia|-goi|goi-/.test(t)) return 'goi';
  return 'tale';
}

/**
 * Analyse la source Wikidot d'un dossier et renvoie ses liens, dédupliqués par cible.
 *
 * Tolérant par construction : une source absente ou malformée renvoie une liste vide
 * plutôt que de faire échouer le chargement du dossier.
 */
export function extractWikiLinks(source: string | undefined): WikiLink[] {
  if (!source) return [];

  // Le bandeau de navigation de bas de page (« ‹‹ SCP-6171 | SCP-6173 ›› ») n'est pas du
  // contenu : ses libellés n'apparaissent d'ailleurs pas dans le texte rendu.
  const body = source.replace(/\[\[div\s+class="footer-wikiwalk-nav"\]\][\s\S]*?\[\[\/div\]\]/gi, '');

  const seen = new Set<string>();
  const links: WikiLink[] = [];

  const push = (target: string, label: string, url?: string) => {
    const cleanTarget = target.trim();
    const cleanLabel = label.trim();
    if (!cleanTarget || !cleanLabel) return;
    if (isTechnical(cleanTarget)) return;
    if (cleanLabel.length < 4) return;
    if (GENERIC_LABELS.has(cleanLabel.toLowerCase())) return;

    const key = cleanTarget.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const kind = classify(cleanTarget);
    links.push({
      target: kind === 'external' ? cleanTarget : cleanTarget.toLowerCase().replace(/\s+/g, '-'),
      label: cleanLabel,
      kind,
      ...(url ? { url } : {})
    });
  };

  // Liens internes : [[[cible|libellé]]] ou [[[cible]]]
  for (const m of body.matchAll(/\[\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]\]/g)) {
    const target = m[1];
    push(target, m[2] || target);
  }

  // Liens externes : [https://… libellé]. On exclut [[*user …]], géré par le markup.
  for (const m of body.matchAll(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g)) {
    push(m[1], m[2], m[1]);
  }

  return links;
}

/**
 * Rattache des liens aux segments déjà construits, par correspondance de libellé.
 *
 * Balayage **séquentiel et unique** : chaque lien est ancré à sa première occurrence puis
 * retiré du jeu. Une correspondance globale rattacherait « Esterberg » à ses dix mentions
 * dans l'article — même raison que pour les marqueurs de notes de bas de page.
 */
export function anchorLinksToTexts(texts: string[], links: WikiLink[]): Array<WikiLink[] | undefined> {
  const result: Array<WikiLink[] | undefined> = new Array(texts.length).fill(undefined);
  if (links.length === 0) return result;

  const pending = [...links];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text) continue;
    const lower = text.toLowerCase();

    for (let j = pending.length - 1; j >= 0; j--) {
      if (lower.includes(pending[j].label.toLowerCase())) {
        (result[i] ||= []).push(pending[j]);
        pending.splice(j, 1);
      }
    }
  }

  return result;
}
