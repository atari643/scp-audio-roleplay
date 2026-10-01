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

/**
 * Slugs techniques : thèmes, composants de mise en page et pages système du wiki
 * (`system:page-tags`, `fragment:…`), jamais du contenu.
 */
function isTechnical(target: string): boolean {
  return /^(?:theme|component|info|include|module|css|system|fragment|admin|nav|forum|search):/i.test(target);
}

/**
 * Le nom de page que Wikidot donne à une cible de lien.
 *
 * La source écrit la cible comme on l'a tapée — « qntm's Proposal », « Dr. Gears's
 * Proposal », « Rapports d'expérience 005-FR-1 et 2 + Incident 005-FR-1 » — et le wiki la
 * ramène à son nom de page avant de la suivre. Sans ce calcul, l'app demandait à Crom
 * `qntm's-proposal`, une page qui n'existe pas : le lien de SCP-001 n'ouvrait rien.
 *
 * Vérifié sur Crom le 01/10/2026 : apostrophe, point, « + » et souligné deviennent un
 * tiret (`qntm-s-proposal`, `dr-gears-s-proposal`, `b-bone-s-proposal`), les accents sont
 * translittérés (`rapports-d-experience-…`), les tirets se replient. Le deux-points de
 * catégorie reste.
 */
function nomDePage(cible: string): string {
  return cible
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, '-')
    .replace(/-*:-*/g, ':')
    .replace(/^[-:]+|[-:]+$/g, '');
}

/**
 * La page que vise une cible interne. Un `/` initial est de la syntaxe ; `#ancre` et
 * `/offset/2` désignent un endroit DANS la page, et l'app ouvre toujours la page entière.
 */
function pageVisee(cible: string): string {
  return nomDePage(cible.replace(/^\/+/, '').split(/[#/]/)[0]);
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

  const push = (target: string, label: string) => {
    // `*` en tête : « ouvrir dans un nouvel onglet ». C'est de la syntaxe, pas la cible —
    // `[[[*https://commons…]]]` passait pour un conte que l'app tentait de charger.
    const brute = target.trim().replace(/^\*/, '');
    const externe = /^https?:\/\//i.test(brute);
    const cleanTarget = externe ? brute : pageVisee(brute);
    const cleanLabel = label.trim();
    if (!cleanTarget || !cleanLabel) return;
    if (isTechnical(cleanTarget)) return;
    if (cleanLabel.length < 4) return;
    // Sans lettre ni chiffre (« ██████ », « ( ) »), le motif du libellé n'ancre rien de sûr.
    if (!/[\p{L}\p{N}]/u.test(cleanLabel)) return;
    if (GENERIC_LABELS.has(cleanLabel.toLowerCase())) return;

    const key = cleanTarget.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    links.push({
      target: cleanTarget,
      label: cleanLabel,
      kind: classify(cleanTarget),
      ...(externe ? { url: brute } : {})
    });
  };

  // Liens internes : [[[cible|libellé]]] ou [[[cible]]]. Le `(?!\[)` ancre la capture sur
  // les trois DERNIERS crochets : SCP-106 encadre un lien de crochets, « [[[[until-death|DATA
  // EXPUNGED]]]] », et la cible devenait « [until-death ».
  for (const m of body.matchAll(/\[\[\[(?!\[)([^\]|]+?)(?:\|([^\]]*))?\]\]\]/g)) {
    const target = m[1];
    push(target, m[2] || target);
  }

  // Liens externes : [https://… libellé]. On exclut [[*user …]], géré par le markup.
  for (const m of body.matchAll(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g)) {
    push(m[1], m[2]);
  }

  return links;
}

/** Une image cliquable de la source, et l'endroit où elle finit. */
export interface ImageLiee {
  fin: number;
  lien: WikiLink;
}

/**
 * Les images qui mènent à une autre page du wiki : `[[image LesEnfants.png link="…"]]`.
 *
 * C'est toute la page de certains hubs. Ouroboros (proposition 001 de djkaktus) n'est que
 * quatre images, une par partie : Crom n'en rend aucun texte, et l'app déclarait la page
 * introuvable. Le libellé est l'`alt` de l'image (« Part One - The Children ») ; la
 * traduction française n'en a pas, d'où `titres`, le titre de la page visée que l'appelant
 * a demandé à Crom (`cromApi.titresDesImagesLiees`). Sans l'un ni l'autre, l'image est
 * ignorée : un nom de fichier n'est pas un libellé.
 *
 * Écartés : `link=#` (une image qu'on agrandit), les fichiers (`local--files`, `.png`…)
 * et les pages techniques.
 */
export function extraireImagesLiees(
  source: string | undefined,
  titres: Record<string, string> = {}
): ImageLiee[] {
  return imagesCliquables(source).flatMap(({ fin, page, alt }) => {
    const label = alt ?? titres[page];
    return label ? [{ fin, lien: { target: page, label, kind: classify(page) } }] : [];
  });
}

/** Les pages visées par des images cliquables sans `alt` : celles dont il faut le titre. */
export function imagesLieesSansLibelle(source: string | undefined): string[] {
  return imagesCliquables(source).filter(i => !i.alt).map(i => i.page);
}

function imagesCliquables(source: string | undefined): Array<{ fin: number; page: string; alt?: string }> {
  if (!source) return [];
  const images: Array<{ fin: number; page: string; alt?: string }> = [];
  const vues = new Set<string>();
  for (const m of source.matchAll(/\[\[[<>=f]*image\s([^\]]*)\]\]/gi)) {
    const brut = m[1].match(/\blink\s*=\s*"([^"]*)"|\blink\s*=\s*([^\s\]]+)/i);
    const cible = (brut?.[1] ?? brut?.[2] ?? '').trim().replace(/^\*/, '');
    if (!cible || /^https?:\/\//i.test(cible) || /local--files|\.(?:png|jpe?g|gif|webp|svg)$/i.test(cible)) continue;
    const page = pageVisee(cible);
    if (!page || isTechnical(page) || vues.has(page)) continue;
    vues.add(page);
    const alt = m[1].match(/\balt\s*=\s*"([^"]*)"/i)?.[1]?.trim();
    images.push({ fin: (m.index ?? 0) + m[0].length, page, ...(alt && /[\p{L}\p{N}]/u.test(alt) ? { alt } : {}) });
  }
  return images;
}

/**
 * Le motif qui retrouve un libellé dans le texte d'une réplique.
 *
 * Les parenthèses y sont facultatives : le libellé vient de la source, mais le parseur
 * déballe une parenthèse de contenu — « The Great Hippo (feat. PeppersGhost) » devient
 * « The Great Hippo feat. PeppersGhost », et c'était le seul lien de SCP-001 à ne pas
 * s'afficher. Partagé par l'ancrage et par l'affichage (`SpokenLine`) : un lien ancré
 * doit être un lien qu'on voit.
 */
export function motifLibelle(label: string): RegExp {
  const echappe = label
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\([()])/g, '\\$1?')
    .replace(/\s+/g, '\\s*');
  return new RegExp(echappe, 'gi');
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

  const pending = links.map(link => ({ link, motif: motifLibelle(link.label) }));

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text) continue;

    for (let j = pending.length - 1; j >= 0; j--) {
      const { link, motif } = pending[j];
      motif.lastIndex = 0;
      if (motif.test(text)) {
        (result[i] ||= []).push(link);
        pending.splice(j, 1);
      }
    }
  }

  return result;
}
