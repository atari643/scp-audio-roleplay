import { CharacterRole, SpeechSegment } from '../types/audioRoleplay';
import { characterVoiceService, CharacterGender, AssignedVoiceSignature, resolveInitialSignatories } from './characterVoiceService';
import { extractWikiLinks, anchorLinksToTexts } from './linkExtractor';

/**
 * Motifs de rôle, essayés dans l'ordre : le premier qui correspond l'emporte.
 *
 * L'ancienne version enchaînait des `lower.includes(...)` sans frontière de mot, ce qui
 * classait de travers tout un pan des personnages :
 *
 *   « Julia », « Sofia », « Amelia »   contiennent « ia »  → voix d'intercom au lieu d'une
 *                                                            voix de personnage
 *   « Alexandre », « Hydre »           contiennent « dr »  → chercheur
 *   « Dir. Vemhoff »                   ne contenait rien   → chercheur, alors que c'est le
 *                                                            commandement
 *
 * Le rôle ne décide pas seulement du timbre : il fixe aussi la hauteur et le débit
 * (`resolveVoiceParams`), et il détermine si le personnage reçoit une voix qui lui est
 * propre — seuls `researcher`, `commander` et `agent` y ont droit. Un classement erroné
 * s'entend donc pendant tout le dossier, pas seulement sur une réplique.
 *
 * Les frontières sont écrites en classes Unicode : `\b` est ASCII en JavaScript et ne voit
 * aucune limite après un caractère accentué.
 */
const ROLE_PATTERNS: ReadonlyArray<readonly [CharacterRole, RegExp]> = [
  // Libellés que le parseur produit lui-même, donc comparaison exacte.
  ['narrator', /^(?:narrateur|narrator|archiviste|fondation|système|system|pa)$/iu],

  // Matricules du personnel jetable : « D-3481 », « Classe-D », « D-Class ». Avant les
  // autres, pour qu'un matricule ne soit jamais pris pour un nom.
  ['classD', /(?<![\p{L}\p{N}])(?:d[-‑–]\d|classe?[-\s]?d(?![\p{L}])|d[-\s]?class)/iu],

  ['anomaly', /(?<![\p{L}])(?:scp[-\s]?[\d█]|sujets?|entités?|entity|anomalie|créature|specimen)(?![\p{L}])/iu],

  ['agent', /(?<![\p{L}])(?:agents?|gardes?|guards?|fim|mtf|ftm|capt|cpt|capitaine|sergents?|sgt|lieutenants?|lt|soldats?|sécurité|security)(?![\p{L}])/iu],

  ['commander', /(?<![\p{L}])(?:o5|conseil|council|directeur|directrice|director|dir|commandement|commandant|command|superviseur|administrateur)(?![\p{L}])/iu],

  ['researcher', /(?<![\p{L}])(?:dr|dre|docteure?|doctor|chercheu(?:r|rs|se|ses)|prof|professeure?|researcher|scientist|interviewer|interrogat(?:eur|rice)|analyste|technicien(?:ne)?)(?![\p{L}])/iu],

  // Pas de « ai » ici : c'est le sigle anglais d'intelligence artificielle, mais aussi une
  // forme du verbe avoir omniprésente en français (« j'ai », « ai-je »). Mesuré sur le
  // corpus : il faisait passer des répliques entières pour des annonces d'intercom.
  ['intercom', /(?<![\p{L}])(?:intercom|haut-parleur|annonce|enregistrement|journal|ia|ordinateur|terminal)(?![\p{L}])/iu]
];

// Detect the role from speaker name
export function detectRole(speakerName: string): CharacterRole {
  const lower = speakerName.toLowerCase().trim();

  for (const [role, motif] of ROLE_PATTERNS) {
    if (motif.test(lower)) return role;
  }

  // Un nom sans indice reste un intervenant ordinaire : c'est le rôle qui reçoit une voix
  // propre à chaque personnage, donc le repli le moins dommageable.
  return 'researcher';
}

/**
 * Mots retirés de la clé de canonisation d'un locuteur.
 *
 * « L'Œil qui Voit », « L'Œil Voit » et « Œil Voit » sont le même personnage répété sous des
 * variantes de titre ; sans ce retrait, chaque variante recevait sa propre voix. Les
 * articles et les mots vides ne portent pas d'identité.
 */
const MOTS_VIDES_LOCUTEUR = new Set(['le', 'la', 'les', 'qui', 'de', 'du', 'des']);

/**
 * Clé de comparaison d'un locuteur : minuscules, accents retirés, élision en tête (« l' »,
 * « d' ») et mots vides enlevés, puis tokens (lettres OU chiffres) joints.
 *
 * Les chiffres restent des tokens à part entière : c'est ce qui distingue « SCP-5145-1 » de
 * « SCP-5145-2 », deux entités qui ne doivent JAMAIS partager une voix. La comparaison est
 * une égalité stricte de séquences — jamais une inclusion — pour ne pas rapprocher deux
 * noms dont l'un ne serait qu'un préfixe de l'autre par hasard.
 */
function cleLocuteur(nom: string): string {
  const tokens = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^[ld]['’]/, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(t => t.length > 0 && !MOTS_VIDES_LOCUTEUR.has(t));
  return tokens.join(' ');
}

/**
 * Fusionner les variantes d'un même locuteur en un seul nom — et donc une seule voix.
 *
 * Un même personnage revient dans un dossier sous plusieurs graphies (« Dr Raymond Hamm »,
 * « Dr. Hamm », « Hamm » ; « L'Œil qui Voit » / « Œil Voit »). Sans fusion, le hash de
 * `getScientistVoiceSignature`, qui porte sur le nom tel quel, donnait à chaque variante sa
 * propre voix : le même personnage changeait de timbre d'une réplique à l'autre.
 *
 * Garde-fous :
 *  - toutes les variantes doivent partager le MÊME rôle `detectRole` — des rôles différents
 *    signalent deux personnages distincts que la clé aurait rapprochés par erreur ;
 *  - jamais pour les matricules classe-D : « D-1411 » et « D-1412 » ont des clés distinctes
 *    (les chiffres sont des tokens), mais la prudence l'impose de toute façon ;
 *  - nom affiché = variante la plus fréquente, départage à la première apparue — donc
 *    idempotent : un second passage retrouve les mêmes groupes et le même nom.
 *
 * Sur les groupes fusionnés, la signature vocale est RECALCULÉE sur le nom canonique avec
 * tout le dossier en contexte : `detectGender` y cherche les indices de genre (« la
 * directrice », « Dr » suivi d'un prénom…), plus de texte = meilleur verdict. Pour les
 * rôles sans voix propre, la signature est alignée sur `undefined`, comme au cas D.
 */
function canoniserLocuteurs(segments: SpeechSegment[], lang: string, contenuComplet: string): void {
  interface Groupe {
    variantes: Map<string, number>;
    indices: number[];
    roles: Set<CharacterRole>;
  }
  const groupes = new Map<string, Groupe>();

  segments.forEach((seg, i) => {
    // Les segments structurels portent des libellés, pas des personnages.
    if (seg.isHeader || seg.isLogMarker || seg.isFootnote) return;
    const cle = cleLocuteur(seg.speaker);
    if (!cle) return;
    let groupe = groupes.get(cle);
    if (!groupe) {
      groupe = { variantes: new Map(), indices: [], roles: new Set() };
      groupes.set(cle, groupe);
    }
    groupe.variantes.set(seg.speaker, (groupe.variantes.get(seg.speaker) ?? 0) + 1);
    groupe.indices.push(i);
    groupe.roles.add(seg.role);
  });

  for (const groupe of groupes.values()) {
    if (groupe.indices.length < 2 || groupe.roles.size !== 1) continue;
    const roleCommun = [...groupe.roles][0];
    if (roleCommun === 'classD') continue;

    // Variante la plus fréquente, départage à la première apparue (ordre d'insertion du Map).
    let nomCanonique = '';
    let maxOccurrences = 0;
    for (const [variante, n] of groupe.variantes) {
      if (n > maxOccurrences) {
        maxOccurrences = n;
        nomCanonique = variante;
      }
    }

    let gender: CharacterGender | undefined;
    let signature: AssignedVoiceSignature | undefined;
    if (roleCommun === 'researcher' || roleCommun === 'commander' || roleCommun === 'agent') {
      signature = characterVoiceService.getScientistVoiceSignature(nomCanonique, lang, contenuComplet);
      gender = signature.gender;
    }

    for (const i of groupe.indices) {
      segments[i].speaker = nomCanonique;
      segments[i].role = roleCommun;
      segments[i].gender = gender;
      segments[i].voiceSignature = signature
        ? { voiceId: signature.voiceId, pitch: signature.pitch, rate: signature.rate }
        : undefined;
    }
  }
}

/**
 * Le script qui initialise chaque `[[tabview]]` (`//<![CDATA[ OZONE.dom.onDomReady(… new
 * YAHOO.widget.TabView(…)) //]]>`). CROM le rend dans textContent, en fin de page : il était
 * lu à voix haute sur la plupart des dossiers à onglets (SCP-2317, SCP-150-FR…).
 */
const SCRIPT_ONGLETS = /\/\/<!\[CDATA\[[\s\S]*?\/\/\]\]>/g;

// Clean Wikidot markup from text and replace awkward censorship blocks
export function cleanWikidotMarkup(raw: string, lang: string = 'fr'): string {
  let text = raw;

  // Replace black bars ███ with clean spoken equivalents.
  // `█+` et non `█{2,}` : le corpus contient 301 caviardages d'un seul caractère
  // (« Site-█ », « O5-█ ») qui partaient bruts au moteur de synthèse.
  const censoredWord = lang === 'en' ? '[redacted]' : '[censuré]';
  // Les trames ▓▒░ collées à un bloc font partie du même caviardage (« SCP-██▓█ », SCP-3125) :
  // seules, elles lisaient un caractère que le moteur ne sait pas dire.
  text = text.replace(/[▓▒░]*█[█▓▒░]*/g, ` ${censoredWord} `);

  // Le script d'initialisation des onglets Wikidot, que CROM laisse dans textContent.
  text = text.replace(SCRIPT_ONGLETS, '');

  // Remove include blocks, collapsibles, css modules, html blocks
  text = text.replace(/\[\[include[\s\S]*?\]\]/gi, '');
  text = text.replace(/\[\[module[\s\S]*?\]\]/gi, '');
  text = text.replace(/\[\[collapsible[\s\S]*?\]\]/gi, '');
  text = text.replace(/\[\[\/collapsible\]\]/gi, '');
  text = text.replace(/\[\[html[\s\S]*?\]\]/gi, '');
  text = text.replace(/\[\[\/html\]\]/gi, '');

  // Strip blockquote markers: > or >> at start of line
  text = text.replace(/^>+\s?/gm, '');

  // Wikidot bold **text** -> text
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');

  // Wikidot italic //text// -> text
  text = text.replace(/\/\/(.*?)\/\//g, '$1');

  // Wikidot underline __text__ -> text
  text = text.replace(/__(.*?)__/g, '$1');

  // Wikidot superscript ^^o^^ -> o
  text = text.replace(/\^\^(.*?)\^\^/g, '$1');

  // Wikidot links [[*user username]] -> username
  text = text.replace(/\[\[\*user\s+(.*?)\]\]/gi, '$1');
  text = text.replace(/\[\[(?:.*\|)?(.*?)\]\]/g, '$1');

  // Unsubstituted Wikidot template variables. The ACS component declares slots like
  // {$item-number} / {$container-class}; when a page leaves one unset, Crom renders the raw
  // placeholder and the TTS reads "dollar sign item dash number" out loud (SCP-6172 leaks 8).
  text = text.replace(/\{\$[a-z0-9\-_]+\}/gi, '');

  // Replace multiple newlines & normalize spaces
  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Longueur au-delà de laquelle une réplique est coupée, et longueur visée pour chaque
 * morceau. Les deux seuils viennent du découpage des paragraphes narratifs, qui existait
 * déjà et qui fonctionne bien à l'oreille.
 */
const CHUNK_TRIGGER = 320;
const CHUNK_TARGET = 260;

/**
 * Coupe un texte trop long sur des frontières de phrase.
 *
 * Ce découpage n'existait que pour les paragraphes narratifs : les répliques de dialogue
 * partaient d'un bloc, quelle que soit leur longueur. Une tirade de 900 caractères devenait
 * donc un segment unique — sans respiration interne, sans pause de transition possible au
 * milieu, et impossible à parcourir puisque « segment suivant » sautait la scène entière.
 *
 * Renvoie un seul élément quand il n'y a rien à couper, ce qui est le cas courant.
 */
export function splitIntoBreathChunks(text: string): string[] {
  if (text.length <= CHUNK_TRIGGER) return [text];

  // Découpage par POSITIONS, pas par capture de motifs. La version d'origine découpait avec
  // /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/, qui perd du texte dès qu'une ponctuation de fin de
  // phrase n'est pas suivie d'une espace : dans « fin.« Suite » », le premier morceau et le
  // point ne correspondent à aucune des deux alternatives et disparaissent purement et
  // simplement. Le défaut passait inaperçu tant que seuls les longs paragraphes narratifs
  // étaient concernés ; l'audit l'a fait ressortir dès que les dialogues l'ont été aussi.
  // Ici, les morceaux sont des tranches consécutives : leur concaténation redonne l'original.
  const morceaux: string[] = [];
  let debut = 0;

  for (let i = 0; i < text.length; i++) {
    if (!'.!?…'.includes(text[i])) continue;

    // Avance sur la ponctuation groupée (« ?! », « … ») puis sur l'espace qui suit.
    let fin = i;
    // Le guillemet ou la parenthèse qui ferme la phrase la suit dans le même morceau, avec la
    // ponctuation qui les suit encore (« .). ») : sans ça, « …Roi Écarlate." » laissait un
    // segment réduit à `"` (SCP-2317), et « (…). Suite » un morceau commençant par « ). ».
    while (fin + 1 < text.length && '.!?…"”»)]'.includes(text[fin + 1])) fin++;
    let coupe = fin + 1;
    while (coupe < text.length && /\s/.test(text[coupe])) coupe++;

    // Pas d'espace après la ponctuation (« etc.), suite ») : ce n'est pas une fin de phrase.
    if (coupe > fin + 1 && coupe - debut >= CHUNK_TARGET && coupe < text.length) {
      morceaux.push(text.slice(debut, coupe).trim());
      debut = coupe;
    }
    i = fin;
  }

  if (debut < text.length) morceaux.push(text.slice(debut).trim());

  return morceaux.filter(Boolean);
}

// Extract stage directions like (laughing), (In French), (Rit), (Pause)
export function extractStageDirections(text: string): { cleanedText: string; directions: string[] } {
  const directions: string[] = [];
  
  const cleanedText = text.replace(/\(([^)]{2,60})\)/g, (_match, group) => {
    directions.push(group.trim());
    const lower = group.toLowerCase();
    if (
      lower.includes('rit') || 
      lower.includes('laugh') || 
      lower.includes('pause') || 
      lower.includes('silence') || 
      lower.includes('sigh') || 
      lower.includes('soupir') || 
      lower.includes('gémissement') || 
      lower.includes('tousse') || 
      lower.includes('cough') ||
      lower.includes('aparté') ||
      lower.includes('aside')
    ) {
      return ''; // remove sound instructions from TTS voice
    }
    return group; // keep actual spoken parenthetical notes
  }).replace(/\s{2,}/g, ' ').trim();

  return { cleanedText, directions };
}

/**
 * Split the trailing footnote block off the body.
 *
 * Crom's `textContent` renders Wikidot `[[footnote]]`s twice over: a bare number glued to
 * the text where the marker sits ("…leur diffusion.1|2", "…Niveau 0 :3") and the note bodies
 * collected under a "Notes de bas de page" / "Footnotes" heading at the very end. Read
 * literally that gives stray digits mid-sentence and a detached wall of text at the end.
 *
 * See SCP-5618, whose 14 footnotes are a running dialogue between two researchers — the
 * whole point of the article is lost if they aren't read where they were placed.
 */
export function extractFootnotes(text: string): { body: string; notes: Map<number, string> } {
  const notes = new Map<number, string>();
  const headingRegex = /\n\s*(?:notes?\s+de\s+bas\s+de\s+page|footnotes?)\s*\n/i;
  const match = text.match(headingRegex);
  if (!match || match.index === undefined) return { body: text, notes };

  const body = text.slice(0, match.index);
  const block = text.slice(match.index + match[0].length);

  // Notes are listed as "1. text", one per line, possibly wrapping onto following lines.
  let current: number | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (current !== null && buffer.length) {
      notes.set(current, buffer.join(' ').replace(/\s+/g, ' ').trim());
    }
  };
  for (const line of block.split('\n')) {
    const start = line.match(/^\s*(\d{1,3})\.\s+(.*)$/);
    if (start) {
      flush();
      current = parseInt(start[1], 10);
      buffer = [start[2]];
    } else if (current !== null && line.trim()) {
      buffer.push(line.trim());
    }
  }
  flush();

  return { body, notes };
}

/**
 * Replace each footnote marker in the body with a unique placeholder token.
 *
 * Markers are bare digits with no delimiter, so a global regex would also hit real numbers
 * ("Site-19", "1 000 dossiers"). Instead we walk the text once looking for note 1, then 2,
 * and so on: footnote markers always appear in ascending order, which makes a sequential
 * scan far safer than pattern matching. A marker we cannot place is simply left alone.
 */
export function markFootnotePositions(body: string, notes: Map<number, string>): string {
  if (notes.size === 0) return body;

  let out = body;

  // Start after the file header ("Objet n° : SCP-XXXX" / "Item #:"). Everything above it is
  // the credits block, which is full of bare numbers ("1 décembre 2020") that would swallow
  // the first markers — and which the parser discards anyway.
  const headerStart = out.search(/(?:item\s*#|objet\s*n)/i);
  let cursor = headerStart > 0 ? headerStart : 0;

  // Cherche la première occurrence de `needle` depuis `from` que `accept` valide.
  const chercherMarqueur = (
    text: string,
    needle: string,
    from: number,
    accept: (before: string, after: string) => boolean
  ): number => {
    let i = from;
    while (i < text.length) {
      const idx = text.indexOf(needle, i);
      if (idx === -1) break;
      const before = idx > 0 ? text[idx - 1] : '';
      const after = text[idx + needle.length] || '';
      if (accept(before, after)) return idx;
      i = idx + 1;
    }
    return -1;
  };

  for (let n = 1; n <= notes.size; n++) {
    const needle = String(n);
    // Premier passage, strict : un marqueur est COLLÉ au mot qu'il annote (Crom aplatit le
    // <sup> sur place : « Zenzizenzizenzic1 », "…diffusion.1|2", "…Niveau 0 :3"). Un chiffre
    // précédé d'un espace, d'un autre chiffre ou d'un tiret appartient à une désignation ou
    // à un compte (« SCP-5145-1 », « COTE : 31 ») — sur SCP-5145, le « 1 » final de
    // « SCP-5145-1 » passait la garde simple et volait la place de la note.
    let found = chercherMarqueur(out, needle, cursor, (before, after) =>
      before !== '' &&
      !/\s/.test(before) &&
      !/\d/.test(before) &&
      !/[-–—]/.test(before) &&
      !/\d/.test(after)
    );
    // Repli : garde historique (rejeter seulement les chiffres accolés), pour les rares
    // marqueurs séparés de leur mot par un espace.
    if (found === -1) {
      found = chercherMarqueur(out, needle, cursor, (before, after) =>
        !/\d/.test(before) && !/\d/.test(after)
      );
    }
    if (found === -1) continue;
    const token = `\n@@NOTE${n}@@\n`;
    out = out.slice(0, found) + token + out.slice(found + needle.length);
    cursor = found + token.length;
  }
  return out;
}

/**
 * Un span barré Wikidot (`--texte--`). Le contenu ne peut ni commencer ni finir par un
 * tiret, ce qui écarte les filets horizontaux (`----`), et doit porter au moins une
 * lettre ou un chiffre. La capture traverse les sauts de ligne : un passage barré peut
 * couvrir tout un paragraphe.
 */
const REGEX_SPAN_BARRE = /--([^-\n](?:[^]*?[^-\n])?)--/g;

interface SpanBarre {
  debut: number;
  fin: number;
  contenu: string;
}

/**
 * Retire les passages barrés du texte à lire — décision produit : un texte rayé ne se
 * lit pas, comme si l'encre le couvrait. Seule la page 0 est nettoyée : les fragments
 * paginés n'ont pas de source propre pour localiser leurs barrés.
 *
 * L'ancrage est séquentiel (curseur) et verbatim : un passage ne part que s'il se
 * retrouve tel quel dans le texte. Un passage d'un seul mot exige en plus d'être unique
 * dans la page — sinon on risque d'effacer la mauvaise occurrence. Plusieurs spans
 * consécutifs (« --peuvent-- --devraient-- ») forment un seul passage, reconstitué depuis
 * la source pour garder les séparateurs d'origine ; si cet assemblage ne s'ancre pas,
 * on retente les spans un à un, mais tous ou rien : un groupe dont un seul membre manque
 * est suspect, on n'en retire rien. Un ancrage qui échoue laisse le passage en place —
 * le repli est le comportement actuel, jamais un crash.
 *
 * Quand le passage couvrait tout ce qui suivait un label sur sa ligne, la ligne vidée ne
 * garde qu'un label orphelin qui se lirait comme un en-tête fantôme : elle part aussi.
 *
 * Renvoie aussi les mots retirés (en minuscules), pour que l'audit ne les compte ni
 * comme des pertes ni comme une couverture manquée.
 */
export function retirerTexteBarre(
  pages: string[],
  source?: string
): { pages: string[]; motsRetires: string[] } {
  const motsRetires: string[] = [];
  if (!source || pages.length === 0) return { pages, motsRetires };

  const spans: SpanBarre[] = [];
  for (const m of source.matchAll(REGEX_SPAN_BARRE)) {
    const contenu = m[1];
    if (!/[\p{L}\p{N}]/u.test(contenu)) continue; // tirets décoratifs, pas du texte
    spans.push({ debut: m.index, fin: m.index + m[0].length, contenu });
  }
  if (spans.length === 0) return { pages, motsRetires };

  const pagesSortie = [...pages];
  let page = pagesSortie[0];
  let curseur = 0;

  const retirerPassage = (debut: number, longueur: number): void => {
    const gauche = page.slice(0, debut);
    const apres = debut + longueur;
    const droite = page.slice(apres);

    // Bornes de la ligne hôte (calculées avant retrait, le saut final reste en place).
    const ligneDebut = page.lastIndexOf('\n', Math.max(debut - 1, 0)) + 1;
    let ligneFin = page.indexOf('\n', apres);
    if (ligneFin === -1) ligneFin = page.length;
    const restante = (page.slice(ligneDebut, debut) + page.slice(apres, ligneFin)).trim();

    if (/^[^:]{2,80}:$/.test(restante)) {
      // Le passage couvrait tout ce qui suivait le label : rien d'autre à annoncer.
      page = page.slice(0, ligneDebut) + page.slice(ligneFin);
      const mots = restante.match(/[\p{L}\p{N}]+/gu) || [];
      for (const mot of mots) motsRetires.push(mot.toLowerCase());
      return;
    }

    // Un seul blanc au point de raccord ; au bord d'une ligne, le saut suffit — les
    // paragraphes devenus vides sont simplement ignorés au parsing.
    page =
      /\n$/.test(gauche) || /^\n/.test(droite)
        ? gauche + droite
        : gauche.replace(/[ \t]+$/, '') + ' ' + droite.replace(/^[ \t]+/, '');
  };

  const src = source;

  // Plusieurs mots : l'occurrence de même RANG que dans la source. Un dossier à itérations
  // recopie le dossier d'un onglet à l'autre ; SCP-2317 barre dans l'itération 4 un
  // paragraphe que les itérations 2 et 3 donnent en clair. La première occurrence après le
  // curseur était celle de l'itération 2 : on effaçait le texte lisible et on lisait le
  // barré. Si la page n'a pas autant d'occurrences que la source (passage répété dans un
  // commentaire ou un bloc non rendu), repli sur la première après le curseur.
  // Un seul mot : unicité dans toute la page — le curseur ne suffit pas, le mot peut
  // réapparaître plus tôt, et on refuse d'effacer la mauvaise occurrence.
  const ancre = (passage: string, depuis: number, positionSource: number): number => {
    if (/\s/.test(passage)) {
      let rang = 0;
      for (let i = src.indexOf(passage); i !== -1 && i < positionSource; i = src.indexOf(passage, i + 1)) {
        // Une occurrence elle-même barrée plus haut a déjà quitté la page : elle ne compte pas.
        if (!spans.some(s => s.debut < i && i < s.fin)) rang++;
      }
      let pos = -1;
      for (let r = 0; r <= rang; r++) {
        pos = page.indexOf(passage, pos + 1);
        if (pos === -1) break;
      }
      if (pos !== -1 && pos >= depuis) return pos;
      return page.indexOf(passage, depuis);
    }
    const premier = page.indexOf(passage);
    if (premier === -1 || premier < depuis) return -1;
    if (page.indexOf(passage, premier + passage.length) !== -1) return -1;
    return premier;
  };

  for (let i = 0; i < spans.length; i++) {
    // Regroupe les spans séparés uniquement par des blancs.
    let fin = spans[i].fin;
    let j = i + 1;
    while (j < spans.length && !/\S/.test(source.slice(fin, spans[j].debut))) {
      fin = spans[j].fin;
      j++;
    }
    const passage =
      j === i + 1 ? spans[i].contenu : source.slice(spans[i].debut, fin).replace(/--/g, '');

    let debut = ancre(passage, curseur, spans[i].debut);
    if (debut === -1 && j > i + 1) {
      // L'assemblage multi-spans ne s'ancre pas (markup résiduel entre les spans ?) :
      // retente chaque span seul, dans l'ordre du curseur, mais tous ou rien.
      const ancres: number[] = [];
      let pos = curseur;
      let complet = true;
      for (let k = i; k < j; k++) {
        const p = ancre(spans[k].contenu, pos, spans[k].debut);
        if (p === -1) {
          complet = false;
          break;
        }
        ancres.push(p);
        pos = p + spans[k].contenu.length;
      }
      if (complet) {
        // Retire du dernier au premier : les positions déjà calculées restent valides.
        for (let k = ancres.length - 1; k >= 0; k--) {
          retirerPassage(ancres[k], spans[i + k].contenu.length);
        }
        curseur = ancres[0];
      }
      i = j - 1; // le for avancera au span suivant le groupe
      continue;
    }
    if (debut === -1) continue;

    retirerPassage(debut, passage.length);
    curseur = debut;
    const mots = passage.match(/[\p{L}\p{N}]+/gu) || [];
    for (const mot of mots) motsRetires.push(mot.toLowerCase());
    i = j - 1;
  }

  pagesSortie[0] = page;
  return { pages: pagesSortie, motsRetires };
}

/** Un tableau extrait de la source : rangées de cellules nettoyées, rangée 0 = en-têtes. */
interface TableauExtrait {
  rangees: string[][];
}

/**
 * Une cellule source remise dans la même forme que le rendu CROM de textContent : les
 * blocs de note disparaissent (textContent n'en garde que le marqueur), les spans barrés
 * non plus (décision produit — mêmes règles que retirerTexteBarre, dont la page a déjà
 * perdu les siens), puis le nettoyage standard du balisage inline. Ce nettoyage sert aux
 * DEUX côtés de l'appariement : toute divergence entre source et rendu fait échouer la
 * consommation et replie sur les cellules brutes, jamais sur une perte.
 */
function nettoyerCellule(brute: string, lang: string): string {
  // Le bloc de note devient une ESPACE, pas une chaîne vide : dans la source il est souvent
  // collé entre deux mots (« …Trail[[footnote]]…[[/footnote]]au moment… », fr_scp-6030) ;
  // côté rendu, le marqueur reste un mot séparé — coller referait « Trailau » et ferait
  // échouer l'appariement.
  const sansNotes = brute.replace(/\[\[footnote\]\][\s\S]*?\[\[\/footnote\]\]/gi, ' ');
  const sansBarre = sansNotes.replace(REGEX_SPAN_BARRE, ' ');
  // Balises de mise en forme que CROM rend SANS trace dans textContent : une balise
  // [[size 90%]] laissée à la règle générique des [[…]] y survivrait sous la forme
  // littérale « size 90% » et ferait échouer l'appariement. Les [[br]] deviennent des
  // espaces — un contenu multi-lignes est une seule cellule à l'oral. Les liens en
  // triples crochets d'abord : la règle générique des doubles y laisserait des crochets.
  // Le centrage wikidot « = texte » et les couleurs « ##hex|texte## » disparaissent eux
  // aussi du rendu CROM (fr_scp-4003, fr_scp-805-fr) — aligner la cellule source dessus.
  const sansStructure = sansBarre
    .replace(/\[\[\[([^\]|]*\|)?([\s\S]*?)\]\]\]/g, '$2')
    .replace(/##[^|\n]+\|([\s\S]*?)##/g, '$1')
    // Les gabarits {{…}} sont rendus par CROM avec leurs seuls contenus (fr_scp-003-int).
    .replace(/\{\{([^{}]*)\}\}/g, '$1')
    .replace(/\[\[(?:size|span|div|font|style)[^\]]*\]\]/gi, '')
    .replace(/\[\[\/(?:size|span|div|font|style)\]\]/gi, '')
    .replace(/\[\[br\]\]/gi, ' ')
    .replace(/^=\s?/gm, '');
  return cleanWikidotMarkup(sansStructure, lang).replace(/\s+/g, ' ').trim();
}

/**
 * Les rangées d'un bloc [[table]] : cellules de [[cell …]]…[[/cell]], bornées par
 * [[row]]…[[/row]] quand ils existent, sinon toutes dans une rangée implicite.
 */
function rangeesSyntaxeA(bloc: string): string[][] {
  const evenements: Array<{ pos: number; genre: 'rowOpen' | 'rowClose' | 'cell'; cellule: string }> = [];
  for (const m of bloc.matchAll(/\[\[\/?row[^\]]*\]\]|\[\[cell[^\]]*\]\]([\s\S]*?)\[\[\/cell\]\]/gi)) {
    if (/^\[\[\/row/i.test(m[0])) evenements.push({ pos: m.index, genre: 'rowClose', cellule: '' });
    else if (/^\[\[row/i.test(m[0])) evenements.push({ pos: m.index, genre: 'rowOpen', cellule: '' });
    else evenements.push({ pos: m.index, genre: 'cell', cellule: m[1] ?? '' });
  }
  evenements.sort((a, b) => a.pos - b.pos);
  const rangees: string[][] = [];
  let courante: string[] = [];
  for (const ev of evenements) {
    if (ev.genre === 'rowOpen') continue;
    if (ev.genre === 'rowClose') {
      if (courante.length) rangees.push(courante);
      courante = [];
      continue;
    }
    courante.push(ev.cellule);
  }
  if (courante.length) rangees.push(courante);
  return rangees;
}

/**
 * Une cellule-porteuse du bloc d'identification (« Objet no : SCP-4003 », « Classe : Sûr »,
 * « Item #: SCP-001 ») : l'étiquette ET la valeur dans la même cellule. Ces tables-là sont
 * l'entête du dossier — tryBuildHeaderIntro les lit déjà en intro solennelle ; les voler
 * donnerait « Objet no : SCP-4003 : Classe : Sûr » et perdrait le caractère d'entête.
 */
const CELLULE_ACS = /^(?:item\s*#|objet\s*n[o°\^]*|object\s*class|classe)\s*[:\s]/i;

/**
 * Les tableaux d'en-tête de la source wikidot — la seule place où leur structure survit :
 * textContent n'a que des cellules aplaties une par ligne. Deux syntaxes en corpus : les
 * blocs [[table]]/[[row]]/[[cell]] et les rangées-pipes `||~ … ||` (une rangée par ligne,
 * `~` marque les en-têtes). Le critère est volontairement conservateur — au moins deux
 * colonnes, au moins deux rangées, TOUTES les cellules de la première rangée sont des
 * en-têtes et chaque rangée de données a exactement la même largeur — pour ne jamais
 * toucher aux tableaux de mise en page (79 en corpus) ni aux boîtes à une colonne.
 */
function extraireTableaux(source: string, lang: string): TableauExtrait[] {
  const tableaux: TableauExtrait[] = [];
  if (!source) return tableaux;

  const ajouterCandidat = (brutes: string[][], premiereEnTete: boolean) => {
    if (brutes.length < 2 || brutes[0].length < 2 || !premiereEnTete) return;
    const largeur = brutes[0].length;
    const enTetes = brutes[0].map(c => nettoyerCellule(c, lang));
    if (!enTetes.every(c => c.length > 0 && c.length <= 80)) return;
    const rangees: string[][] = [enTetes];
    for (const brute of brutes.slice(1)) {
      if (brute.length !== largeur) return; // colspan ou extraction décalée : on renonce
      rangees.push(brute.map(c => nettoyerCellule(c, lang)));
    }
    if (rangees.flat().some(c => CELLULE_ACS.test(c))) return;
    tableaux.push({ rangees });
  };

  // Syntaxe A — blocs [[table]]…[[/table]], en-têtes reconnus au gras de leurs cellules.
  for (const bloc of source.matchAll(/\[\[table[\s\S]*?\[\[\/table\]\]/gi)) {
    const brutes = rangeesSyntaxeA(bloc[0]);
    const premiereEnTete = brutes.length > 0 && brutes[0].every(c => /\*\*[\s\S]+?\*\*/.test(c));
    ajouterCandidat(brutes, premiereEnTete);
  }

  // Syntaxe B — rangées-pipes, une rangée par ligne source ; le `~` qui marque une
  // cellule d'en-tête wikidot est retiré (il ne veut rien dire à l'oral).
  let run: string[] = [];
  const pousser = () => {
    if (!run.length) return;
    const brutes = run.map(l =>
      l
        .trim()
        .replace(/^\|\|/, '')
        .replace(/\|\|$/, '')
        .split('||')
        .map(c => c.trim())
    );
    const premiereEnTete = brutes[0].every(c => c.startsWith('~'));
    ajouterCandidat(
      brutes.map(rangee => rangee.map(c => c.replace(/^~\s*/, ''))),
      premiereEnTete
    );
    run = [];
  };
  for (const l of source.split('\n')) {
    if (/^\s*\|\|.+\|\|\s*$/.test(l)) run.push(l);
    else pousser();
  }
  pousser();
  return tableaux;
}

/** Une ligne exactement @@NOTE12@@ — un marqueur de note, jamais une cellule. */
const EST_NOTE_AUTONOME = /^@@NOTE\d{1,3}@@$/;

/**
 * Forme de comparaison d'une cellule : apostrophes canoniques (source et rendu CROM n'en
 * emploient pas toujours la même), espaces réduits, ponctuation recollée — un marqueur de
 * note scinde « avril3, suite » en « …avril » / @@NOTE3@@ / « , suite… », et la recolle
 * des deux côtés à l'identique.
 */
function normaliserCellule(s: string): string {
  return s
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?»])/g, '$1')
    .trim();
}

/**
 * Une cellule dont la lecture est entrecoupée de marqueurs de notes : `jetons[k]` sépare
 * `morceaux[k]` de `morceaux[k+1]` — un marqueur en début de cellule laisse `morceaux[0]`
 * vide, un marqueur collé à la fin de la cellule PRÉCÉDENTE aussi (la cellule en cours
 * d'accumulation démarre sur le jeton).
 */
interface CelluleNotes {
  /** indice dans `attentes` de la cellule portant ces marqueurs */
  index: number;
  morceaux: string[];
  jetons: string[];
}

/**
 * Une consommation réussie : le span couvert et les cellules portant des marqueurs, avec la
 * position exacte de chaque marqueur DANS le texte de la cellule — pour que la note sorte à
 * l'instant de son indice, pas regroupée après le tableau ni entre deux rangées.
 */
interface ConsommationReussie {
  debut: number;
  fin: number;
  cellules: CelluleNotes[];
}

/**
 * Tente de reconstituer, à partir de `depart`, la séquence aplatie des cellules attendues :
 * chaque cellule s'accumule depuis les lignes suivantes, et les marqueurs de notes tombés
 * au milieu d'une cellule la coupent en morceaux. Toute divergence — dérapement, fin de
 * lignes — abandonne : null, rien n'a été consommé.
 */
function tenterConsommer(
  lignes: string[],
  depart: number,
  attentes: string[]
): ConsommationReussie | null {
  let j = depart;
  const cellules: CelluleNotes[] = [];
  for (let ci = 0; ci < attentes.length; ci++) {
    const cible = attentes[ci];
    let buf = '';       // morceau en cours, depuis le dernier jeton
    let bufTotal = '';  // texte accumulé depuis le début de la cellule (appariement)
    const morceaux: string[] = [];
    const jetons: string[] = [];
    let avance = j;
    let trouve = false;
    while (avance < lignes.length) {
      const l = lignes[avance];
      if (EST_NOTE_AUTONOME.test(l)) {
        morceaux.push(buf);
        jetons.push(l);
        buf = '';
        avance++;
        continue;
      }
      buf += (buf ? ' ' : '') + l;
      bufTotal = bufTotal ? bufTotal + ' ' + l : l;
      avance++;
      const normalise = normaliserCellule(bufTotal);
      if (normalise === cible) {
        trouve = true;
        break;
      }
      if (normalise.length > cible.length) break; // dérapé : ce n'était pas cette cellule
    }
    if (!trouve) return null;
    if (jetons.length) {
      cellules.push({ index: ci, morceaux: [...morceaux, buf], jetons });
    }
    j = avance;
  }
  return { debut: depart, fin: j, cellules };
}

/**
 * Un item du payload @@TABLEAU@@ : une paire en-tête→valeur, un morceau de valeur repris
 * après un marqueur (sans son en-tête), ou un marqueur de note à dire à cet endroit.
 */
type ItemTableau =
  | { t: 'paire'; h: string; v: string }
  | { t: 'suite'; v: string }
  | { t: 'note'; n: number };

/** Le numéro d'une note depuis son jeton autonome « @@NOTE12@@ ». */
const numeroDeJeton = (jeton: string): number => parseInt(jeton.replace(/\D/g, ''), 10);

/**
 * Remplace, dans les lignes aplaties de la page, chaque tableau retrouvé par une ligne
 * marqueur @@TABLEAU@@{json} portant les rangées appariées en-tête→valeur. Les marqueurs de
 * notes tombés au milieu des cellules coupent la cellule en morceaux, et le payload
 * alterne paire/note/morceau : la note se dira À L'INSTANT de son indice, au sein même de
 * la valeur (« … le 12 avril » ★note « suite à une brèche… »), jamais regroupée après le
 * tableau. Un tableau introuvable est laissé tel quel : le repli est la lecture actuelle
 * des cellules brutes, jamais une perte — et dans ce repli les jetons restent en lignes
 * propres, donc lus à leur place.
 *
 * La recherche d'un tableau démarre au curseur du précédent (ordre du document) et essaie
 * au plus 20 positions candidates — le premier point d'ancrage peut tomber dans la prose,
 * seuls la séquence complète des cellules et son ordre valident.
 */
function consommerTableaux(lignes: string[], tableaux: TableauExtrait[] | undefined): string[] {
  if (!tableaux?.length) return lignes;
  const sortie: string[] = [];
  let curseur = 0;
  for (const tableau of tableaux) {
    const attentes: string[] = [];
    // L'indice dans `attentes` de chaque cellule (rangée source, colonne) — la rangée 0 est
    // celle des en-têtes — sert à retrouver, à l'émission, la cellule portant les marqueurs.
    const indiceParCellule = new Map<string, number>();
    tableau.rangees.forEach((rangee, r) => {
      rangee.forEach((c, i) => {
        const n = normaliserCellule(c);
        // Une cellule-raccourci (« - », « — ») est filtrée des lignes par la même règle qui
        // nettoie les lignes brutes : elle n'est jamais lue, il ne faut donc pas l'attendre
        // (fr_scp-4001). Sinon la consommation échoue sur elle dès la première rangée.
        if (n && !/^[|·•\-–—\s]+$/.test(n)) {
          indiceParCellule.set(`${r}:${i}`, attentes.length);
          attentes.push(n);
        }
      });
    });
    if (attentes.length < 4) continue;

    let tentatives = 0;
    for (let depart = curseur; depart < lignes.length && tentatives < 20; depart++) {
      if (EST_NOTE_AUTONOME.test(lignes[depart])) continue;
      const premiere = normaliserCellule(lignes[depart]);
      if (premiere !== attentes[0] && !attentes[0].startsWith(premiere)) continue;
      tentatives++;
      const essai = tenterConsommer(lignes, depart, attentes);
      if (!essai) continue;
      for (let k = curseur; k < essai.debut; k++) sortie.push(lignes[k]);

      const [enTetes, ...donnees] = tableau.rangees;
      const parCellule = new Map<number, CelluleNotes>();
      for (const cel of essai.cellules) parCellule.set(cel.index, cel);

      const payload: ItemTableau[][] = [];
      donnees.forEach((rangee, dr) => {
        const items: ItemTableau[] = [];
        rangee.forEach((v, c) => {
          const h = enTetes[c];
          const hIdx = dr === 0 ? indiceParCellule.get(`0:${c}`) : undefined;
          const vIdx = indiceParCellule.get(`${dr + 1}:${c}`);
          const hInfo = hIdx !== undefined ? parCellule.get(hIdx) : undefined;
          const vInfo = vIdx !== undefined ? parCellule.get(vIdx) : undefined;

          if (!hInfo && !vInfo) {
            if (h && v) items.push({ t: 'paire', h, v });
            return;
          }
          // Au moins une des deux cellules de la paire porte des marqueurs : la paire
          // démarre sur les premiers morceaux, puis notes et morceaux alternent.
          const mh = hInfo ? hInfo.morceaux.map(m => normaliserCellule(m)) : [];
          const mv = vInfo ? vInfo.morceaux.map(m => normaliserCellule(m)) : [];
          const premierH = hInfo ? mh[0] : h;
          const premierV = vInfo ? mv[0] : v;
          if (premierH && premierV) items.push({ t: 'paire', h: premierH, v: premierV });
          const deverse = (info: CelluleNotes | undefined, morceaux: string[]) => {
            if (!info) return;
            info.jetons.forEach((jeton, k) => {
              items.push({ t: 'note', n: numeroDeJeton(jeton) });
              // La ponctuation d'attache du marqueur (virgule, point) ne veut plus rien
              // dire en tête d'un nouveau segment : on l'effure.
              const suite = (morceaux[k + 1] || '').replace(/^[\s.,;:!?»…·•]+/, '');
              if (suite) items.push({ t: 'suite', v: suite });
            });
          };
          // Marqueurs d'une en-tête : dits avec la première paire qui prononce la colonne
          // (approximation assumée — une en-tête annotée est rare).
          deverse(hInfo, mh);
          deverse(vInfo, mv);
        });
        if (items.length) payload.push(items);
      });

      sortie.push('@@TABLEAU@@' + JSON.stringify({ rangees: payload }));
      curseur = essai.fin;
      break;
    }
  }
  for (let k = curseur; k < lignes.length; k++) sortie.push(lignes[k]);
  return sortie;
}

/**
 * Les étiquettes d'un bloc d'e-mail aplati (« À : … », « De : … », « Sujet : … ») ont la
 * forme du dialogue : chaque ligne devenait un personnage avec sa propre voix (scp-7215
 * faisait lire l'expéditeur par un locuteur nommé « De »). Un run d'au moins deux lignes
 * dont l'étiquette appartient à cet ensemble fermé est fondu en une seule ligne de
 * narrateur ; une ligne isolée est couverte par la garde de la règle de dialogue. Ensemble
 * fermé volontairement : « Interrogateur », « Date » et compagnie ont leurs propres passes.
 */
const ETIQUETTES_EMAIL = new Set([
  'à', 'á', 'a', 'de', 'du', 'cc', 'copie', 'sujet', 'subject', 'from', 'to', 'bcc'
]);

function ligneEnTeteEmail(ligne: string): boolean {
  if (estMarqueur(ligne)) return false;
  const m = ligne.match(/^([^:]{1,20}?)\s*:\s*(.+)$/);
  if (!m) return false;
  return ETIQUETTES_EMAIL.has(m[1].trim().toLowerCase()) && m[2].length <= 120;
}

function fusionnerEnTetesEmail(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (ligneEnTeteEmail(lines[i])) {
      let fin = i + 1;
      while (fin < lines.length && fin - i < 8 && ligneEnTeteEmail(lines[fin])) fin++;
      if (fin - i >= 2) {
        const fusionnee = lines.slice(i, fin).join('. ');
        out.push(/[.?!…]$/.test(fusionnee) ? fusionnee : fusionnee + '.');
        i = fin;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  return out;
}

// ------------------------------------------------------------------ structure de la source

/**
 * Une ligne marqueur produite par le parseur lui-même : note (@@NOTE3@@), tableau
 * (@@TABLEAU@@{…}), titre d'onglet, sortie ou saisie de terminal. Elle représente du contenu
 * déjà structuré : aucune passe de fusion ou d'appariement ne doit la toucher.
 */
const estMarqueur = (ligne: string): boolean => /^@@[A-Z]+/.test(ligne);

/** Les mots d'un texte, en minuscules — la forme de comparaison entre source et rendu CROM. */
const motsDe = (texte: string): string[] => texte.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

/**
 * Le texte qu'affiche un morceau de source Wikidot, approché pour l'ancrage PAR LES MOTS :
 * balises de structure retirées, liens réduits à leur libellé, notes et barrés retirés (le
 * rendu lu ne les porte plus à cet endroit). Seuls les mots du résultat servent : la
 * ponctuation et les espaces peuvent diverger du rendu CROM sans conséquence.
 *
 * `garderBarres` : un passage barré n'est retiré de la page que s'il s'y ancre à l'identique
 * (retirerTexteBarre) ; quand il contient du balisage, il reste dans la page. L'appelant
 * essaie donc les deux formes.
 */
function texteVisibleSource(bloc: string, lang: string, garderBarres = false): string {
  const sansBalises = bloc
    .replace(/\[!--[\s\S]*?--\]/g, ' ')
    // Blocs que CROM ne rend pas en texte : HTML embarqué, feuilles de style, [[code]]
    // (absent de textContent, SCP-184-FR).
    .replace(/\[\[html[^\]]*\]\][\s\S]*?\[\[\/html\]\]/gi, ' ')
    .replace(/\[\[code[^\]]*\]\][\s\S]*?\[\[\/code\]\]/gi, ' ')
    .replace(/\[\[module\s+css[^\]]*\]\][\s\S]*?\[\[\/module\]\]/gi, ' ')
    .replace(/\[\[footnote\]\][\s\S]*?\[\[\/footnote\]\]/gi, ' ')
    .replace(REGEX_SPAN_BARRE, garderBarres ? ' $1 ' : ' ')
    .replace(/\[\[include[\s\S]*?\]\]/gi, ' ')
    .replace(/\[\[[<>=f]*image[^\]]*\]\]/gi, ' ')
    .replace(/\[\[\[([^\]|]*\|)?([\s\S]*?)\]\]\]/g, '$2')
    .replace(/\[\[\*?user\s+([^\]]*)\]\]/gi, '$1')
    .replace(/\[\[\/?[a-z=<>][^\]]*\]\]/gi, ' ')
    .replace(/\[(?:https?:|\/|#)\S*\s+([^\]]*)\]/g, '$1')
    .replace(/##[^|\n]+\|([\s\S]*?)##/g, '$1')
    .replace(/\{\{([\s\S]*?)\}\}/g, '$1');
  return cleanWikidotMarkup(sansBalises, lang);
}

/**
 * Cherche, à partir de la ligne `depuis`, des lignes consécutives dont les mots forment
 * EXACTEMENT `cible` : l'ancrage commence en tête de ligne et finit en fin de ligne. Les
 * marqueurs et les lignes sans mots intercalés sont enjambés. Renvoie [debut, fin[ ou null.
 */
function trouverSuiteDeMots(
  motsLignes: string[][],
  cible: string[],
  depuis: number
): { debut: number; fin: number } | null {
  if (!cible.length) return null;
  for (let debut = depuis; debut < motsLignes.length; debut++) {
    if (motsLignes[debut][0] !== cible[0]) continue;
    let k = 0;
    let j = debut;
    while (k < cible.length && j < motsLignes.length) {
      const mots = motsLignes[j];
      j++;
      if (!mots.length) continue;
      if (k + mots.length > cible.length || mots.some((m, x) => m !== cible[k + x])) break;
      k += mots.length;
    }
    if (k === cible.length) return { debut, fin: j };
  }
  return null;
}

/** Une vue d'onglets `[[tabview]]` et les titres de ses onglets directs, dans l'ordre. */
interface VueOnglets {
  titres: string[];
}

/** Un événement de la structure en onglets, dans l'ordre du document. */
type EvenementOnglet =
  | { genre: 'vue'; vue: VueOnglets }
  | {
      genre: 'onglet';
      vue: VueOnglets;
      titre: string;
      /**
       * Premiers mots du contenu de l'onglet — là où son titre doit être dit —, en plusieurs
       * formes essayées dans l'ordre : longues d'abord, puis plus courtes quand le rendu CROM
       * diverge de la source un peu plus loin (bloc [[code]], include, passage barré).
       */
      ancres: string[][];
      /** Nombre de mots de l'onglet entier, pour départager des débuts identiques. */
      mots: number;
    };

const TAILLES_ANCRE_ONGLET = [12, 6, 3];

/**
 * La structure des `[[tabview]]` de la source.
 *
 * CROM aplatit une vue d'onglets en listant TOUS ses titres d'un bloc, puis les contenus à la
 * suite, sans séparateur : SCP-2317 faisait entendre « Itération 1. Itération 2. … Itération 6. »
 * d'entrée, puis six dossiers enchaînés sans qu'on sache où commence chacun. Mesuré sur la
 * branche française : 97 dossiers ont des onglets.
 *
 * Les vues s'imbriquent (SCP-800-FR) : une pile rattache chaque onglet à sa vue la plus proche.
 */
function extraireOnglets(source: string | undefined, lang: string): EvenementOnglet[] {
  const evenements: EvenementOnglet[] = [];
  if (!source || !/\[\[tabview/i.test(source)) return evenements;

  const balises = [...source.matchAll(/\[\[(\/?)(tabview|tab)\b([^\]]*)\]\]/gi)];

  // Première passe : les titres de chaque vue (indice de sa balise ouvrante).
  const titresParVue = new Map<number, string[]>();
  const pile: number[] = [];
  balises.forEach((b, i) => {
    const genre = b[2].toLowerCase();
    if (genre === 'tabview') {
      if (b[1]) pile.pop();
      else {
        pile.push(i);
        titresParVue.set(i, []);
      }
    } else if (!b[1] && pile.length) {
      titresParVue.get(pile[pile.length - 1])!.push(b[3].trim());
    }
  });

  const vues = new Map<number, VueOnglets>();
  const pileVues: VueOnglets[] = [];
  balises.forEach((b, i) => {
    const genre = b[2].toLowerCase();
    if (genre === 'tabview') {
      if (b[1]) {
        pileVues.pop();
        return;
      }
      const vue: VueOnglets = { titres: titresParVue.get(i) ?? [] };
      vues.set(i, vue);
      pileVues.push(vue);
      evenements.push({ genre: 'vue', vue });
      return;
    }
    if (b[1] || !pileVues.length) return;

    const debut = (b.index ?? 0) + b[0].length;
    const suivante = balises[i + 1];
    // Contenu propre : jusqu'à la balise de structure suivante, quelle qu'elle soit.
    const propre = source.slice(debut, suivante?.index ?? source.length);
    let formes = [motsDe(texteVisibleSource(propre, lang)), motsDe(texteVisibleSource(propre, lang, true))];
    // Un onglet qui s'ouvre directement sur une vue imbriquée commence, dans le rendu, par le
    // bloc de titres de cette vue.
    if (!formes[0].length && suivante && !suivante[1] && suivante[2].toLowerCase() === 'tabview') {
      formes = [motsDe((titresParVue.get(i + 1) ?? []).join('\n'))];
    }
    const ancres: string[][] = [];
    const ajouter = (ancre: string[]) => {
      if (ancre.length && !ancres.some(a => a.join(' ') === ancre.join(' '))) ancres.push(ancre);
    };
    for (const taille of TAILLES_ANCRE_ONGLET) {
      for (const forme of formes) ajouter(forme.slice(0, taille));
    }
    // En dernier recours, la première ligne seule : un titre court suivi d'un include dont
    // la légende n'existe que dans le rendu (« Projet Carnarvon », SCP-5100).
    const premiereLigne = texteVisibleSource(propre, lang).split('\n').find(l => motsDe(l).length);
    if (premiereLigne) ajouter(motsDe(premiereLigne).slice(0, TAILLES_ANCRE_ONGLET[0]));

    // Fin de l'onglet : le [[/tab]] de même profondeur.
    let profondeur = 0;
    let fin = source.length;
    for (let j = i + 1; j < balises.length; j++) {
      if (balises[j][2].toLowerCase() !== 'tab') continue;
      if (!balises[j][1]) profondeur++;
      else if (profondeur === 0) {
        fin = balises[j].index ?? source.length;
        break;
      } else profondeur--;
    }

    evenements.push({
      genre: 'onglet',
      vue: pileVues[pileVues.length - 1],
      titre: b[3].trim(),
      ancres,
      mots: motsDe(texteVisibleSource(source.slice(debut, fin), lang)).length
    });
  });
  return evenements;
}

/**
 * Retire le bloc de titres de chaque vue et insère `@@ONGLET@@Titre` en tête du contenu de
 * chaque onglet. Tout ou rien par vue : si le bloc de titres ou l'un des débuts d'onglet ne
 * s'ancre pas, la vue reste telle que CROM l'a rendue — la lecture d'avant, jamais une perte.
 *
 * Les dossiers à itérations commencent chaque onglet par le même texte (« BIENVENUE SUR LE
 * TERMINAL… » dans SCP-2317) : parmi les débuts possibles, on prend le plus proche de la
 * position attendue, soit le début de l'onglet précédent plus sa longueur en mots.
 */
function placerOnglets(lignes: string[], evenements: EvenementOnglet[] | undefined): string[] {
  if (!evenements?.length) return lignes;

  const motsLignes = lignes.map(l => (estMarqueur(l) ? [] : motsDe(l)));
  // Indice, dans le flux de mots de la page, du premier mot de chaque ligne.
  const rangMot: number[] = [];
  let total = 0;
  for (const mots of motsLignes) {
    rangMot.push(total);
    total += mots.length;
  }

  interface Etat {
    ok: boolean;
    retraits: number[];
    insertions: Array<{ ligne: number; marqueur: string }>;
    motAttendu: number;
    derniereLigne: number;
  }
  const etats = new Map<VueOnglets, Etat>();
  const egal = (ligne: string, titre: string): boolean => {
    const a = motsDe(ligne);
    const b = motsDe(titre);
    return a.length || b.length ? a.join(' ') === b.join(' ') : normaliserCellule(ligne) === normaliserCellule(titre);
  };

  let curseur = 0;
  for (const ev of evenements) {
    if (ev.genre === 'vue') {
      const n = ev.vue.titres.length;
      const etat: Etat = { ok: false, retraits: [], insertions: [], motAttendu: 0, derniereLigne: -1 };
      etats.set(ev.vue, etat);
      if (!n) continue;
      for (let i = curseur; i + n <= lignes.length; i++) {
        if (ev.vue.titres.every((t, k) => !estMarqueur(lignes[i + k]) && egal(lignes[i + k], t))) {
          etat.ok = true;
          for (let k = 0; k < n; k++) etat.retraits.push(i + k);
          curseur = i + n;
          etat.motAttendu = rangMot[Math.min(curseur, lignes.length - 1)] ?? total;
          etat.derniereLigne = curseur - 1;
          break;
        }
      }
      continue;
    }

    const etat = etats.get(ev.vue);
    if (!etat?.ok) continue;
    // Un onglet sans texte n'a rien devant quoi annoncer son titre : on le passe.
    if (!ev.ancres.length) continue;

    let meilleure = -1;
    for (const ancre of ev.ancres) {
      for (let l = Math.max(curseur, etat.derniereLigne + 1); l < lignes.length; l++) {
        if (motsLignes[l][0] !== ancre[0]) continue;
        // L'ancre peut s'arrêter au milieu d'une ligne : comparaison mot à mot sur le flux.
        let k = 0;
        for (let j = l; j < lignes.length && k < ancre.length; j++) {
          const mots = motsLignes[j];
          let x = 0;
          while (x < mots.length && k < ancre.length && mots[x] === ancre[k]) {
            x++;
            k++;
          }
          if (x < mots.length && k < ancre.length) break;
        }
        if (k < ancre.length) continue;
        if (meilleure === -1 || Math.abs(rangMot[l] - etat.motAttendu) < Math.abs(rangMot[meilleure] - etat.motAttendu)) {
          meilleure = l;
        } else if (rangMot[l] > etat.motAttendu) {
          break; // les candidats suivants ne peuvent que s'éloigner
        }
      }
      if (meilleure !== -1) break;
    }
    if (meilleure === -1) {
      etat.ok = false;
      continue;
    }
    etat.insertions.push({ ligne: meilleure, marqueur: `@@ONGLET@@${ev.titre}` });
    etat.motAttendu = rangMot[meilleure] + ev.mots;
    etat.derniereLigne = meilleure;
    curseur = meilleure;
  }

  const retraits = new Set<number>();
  const insertions = new Map<number, string[]>();
  for (const etat of etats.values()) {
    if (!etat.ok) continue;
    etat.retraits.forEach(i => retraits.add(i));
    for (const { ligne, marqueur } of etat.insertions) {
      insertions.set(ligne, [...(insertions.get(ligne) ?? []), marqueur]);
    }
  }
  if (!retraits.size) return lignes;

  const sortie: string[] = [];
  lignes.forEach((l, i) => {
    sortie.push(...(insertions.get(i) ?? []));
    if (!retraits.has(i)) sortie.push(l);
  });
  return sortie;
}

/** Un élément d'une session de terminal, dans l'ordre du document. */
interface ElementTerminal {
  genre: 'sortie' | 'saisie';
  mots: string[];
  /**
   * Mots de la source entre l'élément précédent et celui-ci (le dossier affiché, par
   * exemple) : borne l'écart toléré à l'ancrage. -1 pour le premier élément.
   */
  motsAvant: number;
}

interface SessionTerminal {
  /** « NOM D'UTILISATEUR : … » de la session, s'il est écrit. */
  utilisateur: string | null;
  elements: ElementTerminal[];
}

/**
 * Les sessions de terminal de la source : réponses du système en citation (`> …`), saisies de
 * l'utilisateur en police machine sur leur propre ligne (`{{connexion}}`). C'est la forme des
 * connexions SCiPNET (SCP-2317, SCP-O5-J, SCP-0000-EX).
 *
 * Aplatie par CROM, une session se lit d'une seule voix, et les réponses du système prennent la
 * forme du dialogue : « ACCÉDER : Montre un synopsis… », « TITRE : Assistant Chercheur »
 * devenaient des personnages dont le nom n'était jamais prononcé.
 *
 * Critères, par unité (un onglet, ou la page hors onglets) : au moins 3 saisies précédées d'une
 * citation, et aucune saisie entre crochets. SCP-482-FR met des `{{[DÉTAILS SUPPRIMÉS…]}}`
 * derrière les répliques d'un entretien : ce n'est pas un terminal.
 *
 * Dans une session, un paragraphe cité qui porte une barre ACS ou un titre `+` est le DOSSIER
 * affiché : il reste lu normalement (en-tête, sections, dialogues).
 */
function extraireSessionsTerminal(source: string | undefined, lang: string): SessionTerminal[] {
  const sessions: SessionTerminal[] = [];
  if (!source || !/^[ \t]*\{\{[^{}\n]+\}\}[ \t]*$/m.test(source)) return sessions;

  const coupes = [0];
  for (const m of source.matchAll(/\[\[\/?(?:tabview|tab)\b[^\]]*\]\]/gi)) {
    coupes.push(m.index ?? 0, (m.index ?? 0) + m[0].length);
  }
  coupes.push(source.length);

  for (let u = 0; u + 1 < coupes.length; u += 2) {
    const unite = source.slice(coupes[u], coupes[u + 1]);

    type Bloc = { genre: 'citation' | 'saisie' | 'autre'; lignes: string[] };
    const blocs: Bloc[] = [];
    for (const ligne of unite.split('\n')) {
      if (!ligne.trim()) {
        blocs.push({ genre: 'autre', lignes: [] }); // séparateur, sans contenu
        continue;
      }
      const saisie = ligne.match(/^\s*\{\{([^{}]+)\}\}\s*$/);
      if (saisie) blocs.push({ genre: 'saisie', lignes: [saisie[1]] });
      else if (/^\s*>/.test(ligne)) {
        const dernier = blocs[blocs.length - 1];
        if (dernier?.genre === 'citation') dernier.lignes.push(ligne);
        else blocs.push({ genre: 'citation', lignes: [ligne] });
      } else blocs.push({ genre: 'autre', lignes: [ligne] });
    }
    // Les lignes vides ne font que séparer : on les retire pour juger des voisinages.
    const pleins = blocs.filter(b => b.genre !== 'autre' || b.lignes.length);

    const saisiesQualifiees = pleins.filter((b, i) => b.genre === 'saisie' && pleins[i - 1]?.genre === 'citation');
    if (saisiesQualifiees.length < 3) continue;
    if (pleins.some(b => b.genre === 'saisie' && /^\s*\[/.test(b.lignes[0]))) continue;

    const nom = texteVisibleSource(unite, lang).match(
      /^[ \t]*(?:nom\s+d['’]\s*utilisateur|utilisateur|user\s*name|username)\s*:\s*(.+?)\s*$/im
    );
    const utilisateur = nom ? nom[1].replace(/[.;,]+$/, '').trim() || null : null;

    const estDossier = (b: Bloc): boolean =>
      b.lignes.some(l => {
        const t = l.replace(/^\s*>+\s?/, '').replace(/\*\*/g, '').trim();
        return /^\+{1,6}\s/.test(t) || ITEM_LINE.test(t);
      });

    // Runs sans ligne « autre » : une session par run qui contient une saisie.
    let debutRun = 0;
    for (let i = 0; i <= pleins.length; i++) {
      if (i < pleins.length && pleins[i].genre !== 'autre') continue;
      const run = pleins.slice(debutRun, i);
      debutRun = i + 1;
      const premiere = run.findIndex(b => b.genre === 'saisie');
      if (premiere === -1) continue;

      const elements: ElementTerminal[] = [];
      let motsEnAttente = -1;
      // Avant la première saisie, seule l'invite qui la précède appartient au terminal.
      run.forEach((b, k) => {
        const mots = motsDe(texteVisibleSource(b.lignes.join('\n'), lang));
        const dansSession = k >= premiere - 1 && (b.genre === 'saisie' || !estDossier(b));
        if (!dansSession || !mots.length) {
          if (motsEnAttente >= 0) motsEnAttente += mots.length;
          return;
        }
        elements.push({ genre: b.genre === 'saisie' ? 'saisie' : 'sortie', mots, motsAvant: motsEnAttente });
        motsEnAttente = 0;
      });
      if (elements.some(e => e.genre === 'saisie')) sessions.push({ utilisateur, elements });
    }
  }
  return sessions;
}

/**
 * Remplace chaque paragraphe de sortie par une ligne `@@TERMINAL@@{json}` et chaque saisie par
 * `@@SAISIE@@{json}`, ancrés dans l'ordre. Tout ou rien par session : un élément introuvable,
 * ou trop loin du précédent, laisse la session telle quelle.
 */
function marquerSessionsTerminal(
  lignes: string[],
  sessions: SessionTerminal[] | undefined,
  lang: string
): string[] {
  if (!sessions?.length) return lignes;
  const motsLignes = lignes.map(l => (estMarqueur(l) ? [] : motsDe(l)));
  const motsJusqua: number[] = [0];
  for (const mots of motsLignes) motsJusqua.push(motsJusqua[motsJusqua.length - 1] + mots.length);

  const remplacements: Array<{ debut: number; fin: number; marqueur: string }> = [];
  let curseur = 0;
  for (const session of sessions) {
    const locaux: typeof remplacements = [];
    let c = curseur;
    let ok = true;
    for (const el of session.elements) {
      const trouve = trouverSuiteDeMots(motsLignes, el.mots, c);
      // L'écart toléré : le texte que la source place entre les deux éléments, avec du jeu.
      if (!trouve || (el.motsAvant >= 0 && motsJusqua[trouve.debut] - motsJusqua[c] > el.motsAvant * 1.5 + 20)) {
        ok = false;
        break;
      }
      const texte = lignes.slice(trouve.debut, trouve.fin).filter(l => !estMarqueur(l) && l.trim());
      const marqueur =
        el.genre === 'sortie'
          ? `@@TERMINAL@@${JSON.stringify({ lignes: texte })}`
          : `@@SAISIE@@${JSON.stringify({
              texte: texte.join(' '),
              utilisateur: session.utilisateur ?? (lang === 'en' ? 'User' : 'Utilisateur')
            })}`;
      locaux.push({ debut: trouve.debut, fin: trouve.fin, marqueur });
      c = trouve.fin;
    }
    if (!ok) continue;
    remplacements.push(...locaux);
    curseur = c;
  }
  if (!remplacements.length) return lignes;

  const sortie: string[] = [];
  let r = 0;
  for (let i = 0; i < lignes.length; ) {
    const rep = remplacements[r];
    if (rep && rep.debut === i) {
      sortie.push(rep.marqueur);
      // Les marqueurs intercalés (une note posée dans la réponse) restent, juste après.
      for (let k = rep.debut; k < rep.fin; k++) if (estMarqueur(lignes[k])) sortie.push(lignes[k]);
      i = rep.fin;
      r++;
      continue;
    }
    sortie.push(lignes[i]);
    i++;
  }
  return sortie;
}

/**
 * Une ligne réduite à un guillemet ou une parenthèse fermante (le `"` isolé de SCP-3032)
 * devenait un segment à elle seule, affiché mais muet. Elle rejoint la ligne précédente —
 * sauf un marqueur, qui doit rester intact. Le même `"` né d'une coupe de respiration est,
 * lui, traité dans splitIntoBreathChunks.
 */
function recollerPonctuationOrpheline(lignes: string[]): string[] {
  const sortie: string[] = [];
  for (const l of lignes) {
    const precedente = sortie[sortie.length - 1];
    if (/^["”»)\]]+$/.test(l) && precedente !== undefined && !estMarqueur(precedente)) {
      sortie[sortie.length - 1] = precedente + l;
    } else {
      sortie.push(l);
    }
  }
  return sortie;
}

// ------------------------------------------------------------------ blocs [[html]]

/** Entités nommées courantes ; les entités numériques sont décodées à part. */
const ENTITES_HTML: Record<string, string> = {
  nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', zwj: '', zwnj: '',
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', laquo: '«', raquo: '»',
  hellip: '…', mdash: '—', ndash: '–', middot: '·', deg: '°', times: '×',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â',
  ccedil: 'ç', icirc: 'î', iuml: 'ï', ocirc: 'ô', ucirc: 'û', ugrave: 'ù',
  Eacute: 'É', Egrave: 'È', Agrave: 'À', Ccedil: 'Ç', oelig: 'œ', OElig: 'Œ'
};

function decoderEntites(texte: string): string {
  return texte.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entite, nom: string) => {
    if (nom[0] === '#') {
      const code = /^#x/i.test(nom) ? parseInt(nom.slice(2), 16) : parseInt(nom.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entite;
    }
    return ENTITES_HTML[nom] ?? ENTITES_HTML[nom.toLowerCase()] ?? entite;
  });
}

/**
 * L'interface « digicode » (reaper600, SCP-3125) : le dossier classifié est livré CHIFFRÉ
 * dans le HTML, et un script le déchiffre quand le lecteur compose le bon code. Rien de
 * propre à SCP-3125 ici : on relit dans le script du bloc la clé, la classe de l'élément
 * chiffré et le message d'accès, tels que le composant les déclare.
 */
interface Digicode {
  classe: string;
  cle: string;
  messageAccepte: string | null;
}

function detecterDigicode(bloc: string): Digicode | null {
  const cle = bloc.match(/["']abcdefghijklmnopqrstuvwxyz["']\s*,\s*[\w$]+\s*=\s*["']([a-z]+)["']/);
  const classe = bloc.match(/querySelector\(\s*["']\.([\w-]+)["']\s*\)[^}]{0,200}?decrypt/);
  if (!cle || !classe) return null;
  const accepte = bloc.match(/grantedMessage\s*:\s*["']([^"']+)["']/);
  return { classe: classe[1], cle: cle[1], messageAccepte: accepte ? accepte[1] : null };
}

/**
 * Le déchiffrement du composant, réécrit à l'identique : Vigenère sur les lettres (casse
 * conservée), clé reprise au début de chaque nœud texte, puis décodage d'URI. Renvoie null
 * si le résultat n'est pas un URI valide — ce n'était pas un texte chiffré.
 */
function dechiffrerDigicode(texte: string, cle: string): string | null {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const decaler = (lettre: string, k: string): string =>
    alphabet.charAt((alphabet.indexOf(lettre) + alphabet.length - alphabet.indexOf(k)) % alphabet.length);
  const clair = [...texte]
    .map((ch, i) => {
      const k = cle.charAt(i % cle.length);
      if (ch.length === 1 && alphabet.includes(ch)) return decaler(ch, k);
      const min = ch.toLowerCase();
      if (min.length === 1 && alphabet.includes(min)) return decaler(min, k).toUpperCase();
      return ch;
    })
    .join('');
  try {
    return decodeURIComponent(clair);
  } catch {
    return null;
  }
}

const BALISES_BLOC = /^(?:p|div|li|ul|ol|blockquote|h[1-6]|tr|table|pre|section|article|header|footer|hr|br|dd|dt|dl|figcaption|center|details|summary)$/i;
const BALISES_VIDES = /^(?:br|hr|img|input|meta|link|col|area|base|embed|source|track|wbr)$/i;
/** Éléments d'interface sans texte à lire : boutons, champs, dessins, cadres. */
const BALISES_INTERFACE = /^(?:button|input|select|option|textarea|svg|canvas|noscript|template|iframe|object|audio|video)$/i;

/**
 * Les lignes lisibles d'un bloc `[[html]]`, dans l'ordre du document.
 *
 * Retirés : scripts, styles, commentaires, éléments en `display:none` écrit sur l'élément,
 * éléments d'interface (boutons, clavier du digicode). GARDÉS, en revanche, les contenus que
 * la page cache par une CLASSE pour les révéler sur action du lecteur — c'est tout le texte
 * de ces dossiers :
 *  - bascules `toggle()` : une classe présente seule (« + Addendum », le lien fermé) et avec
 *    `collapsed` (le contenu). On lit le contenu, pas le lien fermé ;
 *  - dossier chiffré du digicode : déchiffré, annoncé par le message d'accès du composant.
 */
function lignesDuHtml(bloc: string): string[] {
  const digicode = detecterDigicode(bloc);
  const listesClasses = [...bloc.matchAll(/class\s*=\s*["']([^"']*)["']/gi)].map(m => m[1].trim().split(/\s+/));
  const basculees = new Set(
    listesClasses.filter(c => c.includes('collapsed')).map(c => c.filter(x => x !== 'collapsed').join(' '))
  );
  // Identifiants qu'un clic révèle : « onClick="showHide('firstText')" » (SCP-011-DE). Un
  // élément en display:none dont l'id est ainsi visé est du contenu à dérouler, pas un décor.
  const revelables = new Set(
    [...bloc.matchAll(/onclick\s*=\s*(["'])([\s\S]*?)\1/gi)].flatMap(m =>
      [...m[2].matchAll(/['"]([\w-]+)['"]/g)].map(x => x[1])
    )
  );

  interface Cadre {
    balise: string;
    masque: boolean;
    chiffre: boolean;
    /** Lien de bascule (« - Addendum 2 ») : son signe d'état ne se lit pas. */
    bascule: boolean;
  }
  const pile: Cadre[] = [];
  const lignes: string[] = [];
  let courante = '';
  const couper = () => {
    const ligne = courante.replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
    if (ligne) lignes.push(ligne);
    courante = '';
  };

  const jetons = bloc.match(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<\/?[a-zA-Z][^>]*>|[^<]+|</g) ?? [];
  for (const jeton of jetons) {
    if (/^<(?:!--|script\b|style\b)/i.test(jeton)) continue;
    const balise = jeton.match(/^<(\/?)([a-zA-Z][\w-]*)([^>]*)>$/);
    if (!balise) {
      const cadre = pile[pile.length - 1];
      if (cadre?.masque) continue;
      let texte = jeton;
      if (cadre?.chiffre && digicode) texte = dechiffrerDigicode(texte, digicode.cle) ?? texte;
      texte = decoderEntites(texte);
      // « - Addendum : » : le signe d'état en tête de ligne empêchait de reconnaître le titre.
      if (cadre?.bascule && !courante.trim()) texte = texte.replace(/^\s*[+\-−–]\s*/, '');
      courante += texte;
      continue;
    }
    const [, fermante, nomBrut, attributs] = balise;
    const nom = nomBrut.toLowerCase();
    if (BALISES_BLOC.test(nom)) couper();
    if (fermante) {
      const index = pile.map(c => c.balise).lastIndexOf(nom);
      if (index !== -1) pile.length = index;
      continue;
    }
    if (BALISES_VIDES.test(nom) || /\/\s*$/.test(attributs)) continue;

    const parent = pile[pile.length - 1];
    const classes = (attributs.match(/class\s*=\s*["']([^"']*)["']/i)?.[1] ?? '').trim().split(/\s+/).filter(Boolean);
    const style = attributs.match(/style\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    const id = attributs.match(/\bid\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    const masque =
      (parent?.masque ?? false) ||
      (/display\s*:\s*none/i.test(style) && !revelables.has(id)) ||
      BALISES_INTERFACE.test(nom) ||
      classes.some(c => /^(?:keypad|button|btn)$|^keypad-|-button$/i.test(c)) ||
      (classes.length > 0 && !classes.includes('collapsed') && basculees.has(classes.join(' ')));
    const chiffre = (parent?.chiffre ?? false) || (!!digicode && classes.includes(digicode.classe));
    if (chiffre && !parent?.chiffre && !masque && digicode?.messageAccepte) {
      couper();
      lignes.push(`@@TERMINAL@@${JSON.stringify({ lignes: [digicode.messageAccepte] })}`);
    }
    const bascule = (parent?.bascule ?? false) || /onclick\s*=\s*["'][^"']*toggle/i.test(attributs);
    pile.push({ balise: nom, masque, chiffre, bascule });
  }
  couper();
  return lignes;
}

/** Un bloc `[[html]]` porteur de texte, et sa place dans la source. */
interface BlocHtml {
  fin: number;
  lignes: string[];
}

/** En dessous, un bloc HTML est un décor (animation, bouton, feuille de style). */
const SEUIL_MOTS_HTML = 12;

/**
 * Les blocs `[[html]]` qui portent du texte.
 *
 * Wikidot sert ces blocs dans un iframe, que CROM ne rend pas : textContent n'en contient
 * pas un mot. SCP-3125 écrit TOUT son dossier dans un bloc HTML — l'application ne lisait
 * que l'aperçu caché de la page. Un bloc dont le texte figure déjà dans textContent (≥ 80 %
 * de ses mots) n'est pas repris : ce serait le lire deux fois.
 */
function extraireBlocsHtml(source: string | undefined, rendu: string): BlocHtml[] {
  const blocs: BlocHtml[] = [];
  if (!source || !/\[\[html/i.test(source)) return blocs;
  const sac = new Map<string, number>();
  for (const mot of motsDe(rendu)) sac.set(mot, (sac.get(mot) ?? 0) + 1);

  for (const m of source.matchAll(/\[\[html[^\]]*\]\]([\s\S]*?)\[\[\/html\]\]/gi)) {
    const lignes = lignesDuHtml(m[1]);
    const mots = lignes.filter(l => !estMarqueur(l)).flatMap(l => motsDe(l));
    if (mots.length < SEUIL_MOTS_HTML) continue;
    const reste = new Map(sac);
    let deja = 0;
    for (const mot of mots) {
      const n = reste.get(mot) ?? 0;
      if (n > 0) {
        reste.set(mot, n - 1);
        deja++;
      }
    }
    if (deja / mots.length >= 0.8) continue;
    blocs.push({ fin: (m.index ?? 0) + m[0].length, lignes });
  }
  return blocs;
}

const echapperRegex = (texte: string): string => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Insère le texte des blocs HTML dans la page, à leur place : devant le premier texte visible
 * qui les suit dans la source, retrouvé par ses mots. Sans suite retrouvable, en fin de corps,
 * avant le pavé des notes de bas de page.
 */
function insererBlocsHtml(page: string, source: string, blocs: BlocHtml[], lang: string): string {
  let sortie = page;
  let curseur = 0;
  for (const bloc of blocs) {
    const texte = `\n${bloc.lignes.join('\n')}\n`;
    const suite = motsDe(texteVisibleSource(source.slice(bloc.fin, bloc.fin + 3000), lang)).slice(0, 6);
    let position = -1;
    if (suite.length >= 3) {
      const trouve = new RegExp(suite.map(echapperRegex).join('[^\\p{L}\\p{N}]+'), 'iu').exec(sortie.slice(curseur));
      if (trouve) position = sortie.lastIndexOf('\n', curseur + trouve.index) + 1;
    }
    if (position === -1) {
      const notes = sortie.slice(curseur).search(/\n\s*(?:notes?\s+de\s+bas\s+de\s+page|footnotes?)\s*\n/i);
      position = notes === -1 ? sortie.length : curseur + notes;
    }
    position = Math.max(position, curseur);
    sortie = sortie.slice(0, position) + texte + sortie.slice(position);
    curseur = position + texte.length;
  }
  return sortie;
}

/**
 * L'aperçu `[[include component:preview text=…]]` est un résumé pour les listes du wiki,
 * rendu en `display: none` sur la page — mais présent dans textContent. Lu, il devançait le
 * dossier d'un résumé que le lecteur ne voit pas (et que la Description répète). On retire
 * la ligne qui le reproduit mot pour mot, et elle seule.
 */
export function retirerApercuCache(page: string, source?: string): string {
  const apercu = source?.match(/\[\[include\s+[^\]|]*component:preview\s*\|?\s*text\s*=\s*([\s\S]*?)\]\]/i);
  if (!apercu) return page;
  const cible = motsDe(apercu[1]);
  if (!cible.length) return page;
  const lignes = page.split('\n');
  // L'aperçu peut couvrir plusieurs lignes (SCP-3032 le termine par un `"` seul à la ligne).
  for (let debut = 0; debut < lignes.length; debut++) {
    const premiers = motsDe(lignes[debut]);
    if (!premiers.length || premiers[0] !== cible[0]) continue;
    const mots: string[] = [];
    let fin = debut;
    while (fin < lignes.length && mots.length < cible.length) mots.push(...motsDe(lignes[fin++]));
    if (mots.join(' ') !== cible.join(' ')) continue;
    while (fin < lignes.length && /^[\s"”»’')\].…]+$/.test(lignes[fin])) fin++;
    lignes.splice(debut, fin - debut);
    return lignes.join('\n');
  }
  return page;
}

/**
 * Le texte que les blocs HTML ajoutent à la page 0 — pour l'audit, qui doit compter ces mots
 * comme du contenu à lire.
 */
export function texteDesBlocsHtml(source: string | undefined, rendu: string): string {
  return extraireBlocsHtml(source, rendu)
    .flatMap(b => b.lignes.filter(l => !estMarqueur(l)))
    .join('\n');
}

/** La structure que seule la source Wikidot porte, extraite une fois pour la page 0. */
interface StructureSource {
  tableaux?: TableauExtrait[];
  onglets?: EvenementOnglet[];
  sessions?: SessionTerminal[];
}

/**
 * Parse a whole dossier, including the extra pages of a paginated article.
 *
 * Each page MUST be parsed on its own: a page carries its own trailing footnote block
 * numbered from 1, so concatenating the raw texts would bury page 2 inside page 1's
 * footnote section and renumber nothing correctly. Segment ids are renumbered across the
 * combined result, and every segment records which page it came from.
 */
export function parseScpDossier(
  pages: string[],
  scpTitle: string = 'Dossier SCP',
  lang: string = 'fr',
  /** Source Wikidot du dossier — seule à porter les cibles des liens. */
  source?: string
): SpeechSegment[] {
  const all: SpeechSegment[] = [];
  // Resolve note signatories against the WHOLE dossier: a later page can sign "[SZ]" while
  // the only mention of that person ("le chercheur Zorić") sits on page 1.
  const signatories = resolveInitialSignatories(pages.join('\n'));
  // Les passages barrés ne sont pas lus (décision produit) — uniquement la page 0, les
  // fragments paginés n'ayant pas de source distincte pour localiser leurs barrés.
  const pagesLues = [...retirerTexteBarre(pages, source).pages];
  // Page 0 seulement, comme le reste de la structure : l'aperçu caché part, le texte des
  // blocs [[html]] (absent de textContent) entre à sa place.
  if (source && pagesLues[0]) {
    const sansApercu = retirerApercuCache(pagesLues[0], source);
    pagesLues[0] = insererBlocsHtml(sansApercu, source, extraireBlocsHtml(source, sansApercu), lang);
  }
  // Les tableaux, les onglets et les sessions de terminal ne vivent que dans la source
  // wikidot — CROM a aplati textContent. Extraits une fois, consommés par la page 0 (les
  // fragments n'ont pas leur source).
  const structure: StructureSource = source
    ? {
        tableaux: extraireTableaux(source, lang),
        onglets: extraireOnglets(source, lang),
        sessions: extraireSessionsTerminal(source, lang)
      }
    : {};
  pagesLues.forEach((page, fragmentIndex) => {
    if (!page || !page.trim()) return;
    for (const seg of parseScpScript(page, scpTitle, lang, signatories, fragmentIndex === 0 ? structure : undefined)) {
      all.push({ ...seg, id: all.length + 1, fragmentIndex });
    }
  });

  // Canonisation des locuteurs sur le dossier ENTIER : un personnage nommé différemment d'une
  // page à l'autre (« Dr Hamm » puis « Hamm ») doit recevoir une seule voix. Les fragments
  // sont déjà fusionnés dans `all`, donc la passe voit les variantes quel que soit leur page.
  canoniserLocuteurs(all, lang, pages.join('\n'));

  // Ancrage des liens une fois les segments construits : purement additif, `text` intact.
  const links = extractWikiLinks(source);
  if (links.length > 0) {
    const anchored = anchorLinksToTexts(all.map(s => s.text), links);
    anchored.forEach((found, i) => {
      if (found) all[i].links = found;
    });
  }

  return all;
}

const ITEM_LINE = /^(?:item\s*#|objet\s*(?:n[°o\^]+|\#)?\s*:)/i;
const CLASS_LINE = /^(?:object\s*class\s*:|classe\s*:)/i;
/** An object class written on its own line, with no "Classe :" label in front of it. */
const BARE_OBJECT_CLASS =
  /^(?:safe|s[ûu]r|euclid[e]?|keter|thaumiel|apollyon|archon|neutralis[ée]d?|d[ée]class[ée]|explained|expliqu[ée]|esoteric|[ée]sot[ée]rique)(?:\s*\/\s*\S+)?$/i;

/**
 * Header-bar labels that must NEVER be taken for a speaker name.
 *
 * The dialogue rule matches "Name : text", which is exactly the shape of every ACS header
 * field. Whenever a header is not recognised as such — an unusual layout, a missing
 * counterpart line — the label leaks through and gets announced as if it were a person.
 * This is the catch-all behind the structural fixes.
 */
const HEADER_LABEL_NOT_SPEAKER =
  /^(?:objet\s*n[o°\^]*|item\s*#?|classe(?:\s+(?:de\s+)?(?:confinement|secondaire|perturbation|risque))?|(?:object|containment|secondary|disruption|risk)\s*class|niveau(?:\s+de\s+(?:menace|confinement|conscience))?|threat\s*level|clearance(?:\s*level)?|accr[ée]ditation|classification|niveau\s*d.autorisation)$/i;

/**
 * Build the solemn "Objet : X. Classe : Y." intro from an ACS header bar starting at `index`.
 *
 * Two reasons this is a reusable helper rather than a one-off at the top of the document:
 *
 *  - Crom flattens the header bar column by column, so the class line is not always the very
 *    next one — clearance and secrecy cells get interleaved (SCP-6747).
 *  - A dossier can carry SEVERAL header bars: a second file, a reclassified version, an
 *    addendum with its own header. Handling only the first one left every later
 *    "Objet no : …" to fall through to the dialogue rule and be announced as if "Objet no"
 *    were a person (SCP-6005 did this 8 times, SCP-7000 4 times).
 */
function tryBuildHeaderIntro(
  lines: string[],
  index: number,
  lang: string
): { text: string; rawText: string; nextCursor: number; marqueurs: string[] } | null {
  if (!ITEM_LINE.test(lines[index] || '')) return null;

  let classIdx = -1;
  for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
    // Either a labelled line ("Classe : Keter") or the bare class value on its own — some
    // ACS bars render the value without its label (SCP-7015: "Objet no : SCP-7015" / "Keter").
    if (CLASS_LINE.test(lines[i]) || BARE_OBJECT_CLASS.test(lines[i])) {
      classIdx = i;
      break;
    }
  }
  if (classIdx < 0) return null;

  // Strip a leftover separator: "item#: SCP-6172" loses "item#" but keeps the colon,
  // which would render as "Item: : SCP-6172".
  const clean = (v: string) => v.replace(/\*\*/g, '').replace(/^[\s:—–-]+/, '').trim();
  const itemVal = clean(lines[index].replace(ITEM_LINE, ''));
  const classVal = clean(lines[classIdx].replace(CLASS_LINE, ''));
  // Cells sitting between the two (clearance level, secrecy caption) belong to the same
  // header bar — read them with it instead of leaving them as loose fragments.
  // Un marqueur de note posé dans la barre (« Niveau de Menace : Vert @@NOTE1@@ ») n'est pas une
  // cellule : il était lu tel quel dans l'intro (SCP-672-FR, 796-FR, 833-FR). On le rend à
  // l'appelant, qui le replace juste après l'en-tête pour que la note y soit dite.
  const fenetre = lines.slice(index + 1, classIdx);
  const extras = fenetre.filter(l => l.length <= 60 && !estMarqueur(l));
  const marqueurs = fenetre.filter(l => estMarqueur(l));

  const text =
    lang === 'en'
      ? `Item: ${itemVal}. Object Class: ${classVal}.${extras.length ? ` ${extras.join('. ')}.` : ''}`
      : `Objet : ${itemVal}. Classe : ${classVal}.${extras.length ? ` ${extras.join('. ')}.` : ''}`;

  return {
    text,
    rawText: lines.slice(index, classIdx + 1).filter(l => !estMarqueur(l)).join(' | '),
    nextCursor: classIdx + 1,
    marqueurs
  };
}

/**
 * Lines above the ACS header that are page furniture rather than story.
 *
 * The list is deliberately closed: anything not positively recognised as chrome is kept and
 * read. Getting this wrong in the permissive direction only adds a line of narration;
 * getting it wrong in the strict direction silently deletes the opening of the dossier,
 * which is the bug this replaces.
 */
function isPreambleChrome(line: string): boolean {
  const l = line.trim();
  if (!l) return true;
  // Les marqueurs du parseur (titre d'onglet, terminal…) sont du contenu, jamais du décor.
  if (estMarqueur(l)) return false;

  // Credits block written by the translation teams.
  // Trailing words before the colon are common ("Date de publication originale :").
  if (/^(titre original|auteur|traducteur|traductrice|images?|date de publication|written by|author|translator|source)[^:]{0,24}:/i.test(l)) return true;
  if (/^(cr[ée]dits?|credit|written by .{1,60})$/i.test(l)) return true;

  // Hub breadcrumb: "Canon Hub » From 120's Archives Hub » … » SCP-6172".
  if (/»/.test(l) && /\bhub\b/i.test(l)) return true;

  // Theme and layout artefacts.
  if (/^[+-]\s*CODE$/i.test(l)) return true;
  if (/^caption\.?$/i.test(l)) return true;
  if (/^\(\d+\/\d+\)$/.test(l)) return true;

  // Navigation arrows and episode pickers.
  if (/^[«»<>\s|]+$/.test(l)) return true;
  if (/^[«»]\s*(voir|retour|acc[ée]der|mode|view|back|access)/i.test(l)) return true;
  // Lien de navigation seul, sans préfixe : le « Retour » que chaque page du wiki porte en
  // bas et qui se faisait lire comme une phrase mystérieuse.
  if (/^(?:retour|back)$/i.test(l)) return true;
  if (/^ep\s*\d/i.test(l)) return true;

  // Bare image filenames.
  if (/^\S+\.(jpg|jpeg|png|gif|svg|mp4|webm)$/i.test(l)) return true;

  return false;
}

/**
 * En-têtes de section, aux deux branches (« Procédures de confinement spéciales : … »,
 * « Description : … », « Addendum 47-A : … »). Au niveau module : la passe de fusion des
 * blocs LABEL MAJUSCULES doit pouvoir les exclure de ses runs — fusionner deux en-têtes
 * consécutifs avalerait le titre de l'un.
 */
const sectionHeaderRegex = /^(?:procédures\s*de\s*confinement(?:\s*spéciales)?|special\s*containment\s*procedures|description|addendum\s*[\d\w\.\-_]*|appendice\s*[\d\w\.\-_]*|incident\s*[\d\w\.\-_]*|document\s*[\d\w\.\-_]*|note\s*[\d\w\.\-_]*)\s*:\s*(.*)/i;

/**
 * Field labels of structured blocks, in both branches. The wiki writes personnel sheets,
 * experiment logs and transcript metadata as "Label: value" — the exact shape of the
 * dialogue rule.
 */
const STRUCTURED_FIELD_LABEL =
  /^(?:name|nom|age|âge|position|poste|additional\s+notes?|notes?\s+additionnelles?|parties\s+present|personnel\s*présent|foreword|avant-propos|afterword|apr[èe]s-propos|fig\.?\s*[\d.]+|figure\s*[\d.]+|date|location|lieu|introduction|intention|r[ée]action|r[ée]sultat|result|conclusion|objectif|objective|m[ée]thode|method|r[ée]sum[ée]|summary|hypoth[èe]se|hypothesis|origine|origin|interrogateur|interrog[ée]|sujet|subject|interviewer|interviewed|historique|history|suivant|pr[ée]c[ée]dent|next|previous)$/i;

/**
 * Does this "Label: text" line look like a SECTION HEADING rather than someone speaking?
 *
 * The dialogue rule matches any "X: y", which is also how the wiki writes section titles
 * ("Discovery and Historical Context:", "THE MULTIVERSAL COMPASS:"). The title then lands
 * in `speaker` — and the engine only ever speaks `text`, so the heading is never heard.
 * Confirmed on SCP-6172, where 13 blocks vanished this way.
 *
 * Deliberately conservative: a real line of dialogue must never be reclassified, so we
 * only claim a heading on strong evidence — a known field label, an all-caps multi-word
 * title, or a long phrase no person is named after.
 */
function looksLikeSectionHeading(candidate: string): boolean {
  const s = candidate.trim();
  if (!s) return false;
  if (STRUCTURED_FIELD_LABEL.test(s)) return true;

  const words = s.split(/\s+/);
  const letters = s.replace(/[^\p{L}]/gu, '');
  const upper = s.replace(/[^\p{Lu}]/gu, '');

  // Le vocabulaire des champs de dossier n'entre dans aucun nom de personne : « Profil de
  // Confinement Projeté », « Désignation d'Accréditation », « Projected Containment Profile »,
  // « Special Access Designation » (SCP-2317, dans les deux branches).
  if (/(?<![\p{L}])(?:containment|confinement|proc[ée]dures?|protocoles?|protocols?|d[ée]signation|clearance|accr[ée]ditation)(?![\p{L}])/iu.test(s)) {
    return true;
  }

  // ALL CAPS over several words: a banner, not a person. Single-token acronyms (CLF, BRT,
  // KDK) are genuine speakers in annotated dossiers and must keep passing through.
  if (words.length > 1 && letters.length > 3 && upper.length / letters.length >= 0.9) return true;

  // A person is not called "Discovery and Historical Context" or "Note du chercheur
  // responsable". Four words or more, with no personal title in front, is a heading —
  // real speakers are short ("Dir. Vemhoff", "MacCarthy Jr.", "Micheals").
  // Frontière de mot après le titre : sans elle, « Profil de Confinement Projeté » passait
  // pour un « Prof » suivi d'un nom (SCP-2317), et son titre disparaissait dans `speaker`.
  if (words.length >= 4 && !/^(?:(?:dr|dre|docteur|doctor|agente?|chercheu\p{L}*|prof|professeure?|dir|director|directeur|directrice|o5|superviseur|capt|capitaine|lt|sgt|mme|mlle)(?![\p{L}])|m\.)/iu.test(s)) {
    return true;
  }

  return false;
}

/** Is this line an all-caps table label ("DÉPARTEMENTS ASSIGNÉS")? */
function isTableLabel(line: string): boolean {
  // Footnote placeholders are uppercase too — they must never be swallowed as table cells,
  // which would silently delete the note they stand for. Same for every parser marker.
  if (estMarqueur(line)) return false;
  if (line.length < 3 || line.length > 45) return false;
  const letters = line.replace(/[^\p{L}]/gu, '');
  if (letters.length < 3) return false;
  // Almost entirely uppercase, and not a sentence (no terminal punctuation).
  const upper = line.replace(/[^\p{Lu}]/gu, '');
  return upper.length / letters.length >= 0.9 && !/[.!?:]$/.test(line);
}

/**
 * « LABEL MAJUSCULES : valeur » — une ligne d'un bloc d'attributs ACS aplati.
 *
 * Crom aplatit ces blocs en lignes successives (« ALIGNEMENT RATIONNEL : A=A »,
 * « SUPERVISEUR : SALVADOR.IAA »…). Lues telles quelles, elles tombaient dans la règle de
 * dialogue : chaque libellé devenait un personnage avec sa propre voix (SCP-5145 en
 * produisait quatre par bloc), et les lignes sans valeur se faisaient apparier comme table
 * aplatie avec les lignes Objet/Classe qui suivaient. Le libellé doit être presque
 * entièrement en capitales (≥ 4 lettres) et la valeur courte — un vrai paragraphe
 * « NOTE : … » long de trois phrases ne rentre pas dans ce moule.
 */
function isCapsLabelLine(line: string): boolean {
  if (estMarqueur(line)) return false;
  const m = line.match(/^([^:]{2,40}?)\s*:\s*(.*)$/);
  if (!m) return false;
  const label = m[1];
  const letters = label.match(/\p{L}/gu) || [];
  if (letters.length < 4) return false;
  const upper = label.match(/\p{Lu}/gu) || [];
  if (upper.length / letters.length < 0.9) return false;
  return m[2].length <= 40;
}

/**
 * Ligne tout-majuscules sans deux-points, candide à l'absorption en fin de run
 * (« AJUSTEMENT DU DOSAGE… » — le dernier champ d'un bloc ACS, dont la valeur a disparu à
 * l'aplatissement). Exclut tout ce qui a un sens structurel propre : marqueur de note,
 * borne de journal, cellule d'en-tête ACS, en-tête de section, table aplatie.
 */
function capsSansDeuxPoints(line: string): boolean {
  if (line.length < 4 || line.length > 45) return false;
  if (estMarqueur(line)) return false;
  if (/^[\[<]/.test(line)) return false;
  if (ITEM_LINE.test(line) || CLASS_LINE.test(line) || BARE_OBJECT_CLASS.test(line)) return false;
  if (HEADER_LABEL_NOT_SPEAKER.test(line.trim())) return false;
  if (sectionHeaderRegex.test(line)) return false;
  if (line.includes(':')) return false;
  const letters = line.match(/\p{L}/gu) || [];
  if (letters.length < 4) return false;
  const upper = line.match(/\p{Lu}/gu) || [];
  return upper.length / letters.length >= 0.9;
}

/**
 * Fusionner chaque run de lignes « LABEL MAJUSCULES : valeur » en une seule ligne, qui sera
 * lue comme un seul paragraphe narratif (« ALIGNEMENT RATIONNEL : A=A. SUPERVISEUR :
 * SALVADOR.IAA. COTE : 8. … »).
 *
 * La fenêtre d'un en-tête ACS — de la ligne Objet/Item à la ligne Classe — est intouchable :
 * `tryBuildHeaderIntro` la consomme et lit les cellules intercalées avec lui. Les en-têtes
 * de section ne participent jamais à un run, sans quoi deux titres consécutifs se
 * fusionneraient. La ligne finale sans deux-points n'est absorbée que si elle n'ouvre pas
 * une table aplatie (contre-épreuve : scp-6005) — sinon c'est l'étiquette d'un tableau et
 * `pairFlattenedTable` doit la retrouver.
 */
function fusionnerLabelsValeurs(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const ligne = lines[i];

    // Fenêtre d'en-tête ACS : Objet/Item, puis jusqu'à 5 lignes, Class(e) incluse.
    if (ITEM_LINE.test(ligne)) {
      out.push(ligne);
      i++;
      for (let k = 0; k < 5 && i < lines.length; k++) {
        const suivante = lines[i];
        out.push(suivante);
        i++;
        if (CLASS_LINE.test(suivante) || BARE_OBJECT_CLASS.test(suivante)) break;
      }
      continue;
    }

    if (isCapsLabelLine(ligne)) {
      let fin = i + 1;
      while (fin < lines.length && isCapsLabelLine(lines[fin])) fin++;
      if (fin - i >= 2) {
        if (fin < lines.length && capsSansDeuxPoints(lines[fin]) && !pairFlattenedTable(lines, fin)) {
          out.push(lines.slice(i, fin + 1).join('. '));
          i = fin + 1;
        } else {
          out.push(lines.slice(i, fin).join('. '));
          i = fin;
        }
        continue;
      }
      // Run d'une seule ligne : rien à fusionner, la ligne passe telle quelle.
    }

    out.push(ligne);
    i++;
  }
  return out;
}

/**
 * Detect a two-column info table that Crom flattened into N label lines followed by N value
 * lines, and pair them back up.
 *
 * Deliberately conservative — it needs 2 to 4 all-caps labels followed by exactly as many
 * non-label lines — because a run of consecutive section headings would otherwise be
 * mistaken for a table. Returns null whenever the shape is not clearly a table.
 */
function pairFlattenedTable(
  lines: string[],
  start: number
): { pairs: Array<{ label: string; value: string }>; nextCursor: number } | null {
  let labelCount = 0;
  while (start + labelCount < lines.length && isTableLabel(lines[start + labelCount])) {
    labelCount++;
    if (labelCount > 4) return null;
  }
  if (labelCount < 2) return null;

  const valueStart = start + labelCount;
  for (let i = 0; i < labelCount; i++) {
    const value = lines[valueStart + i];
    if (!value || isTableLabel(value) || value.length > 160) return null;
    // A value slot must never be a footnote placeholder either — pairing one away would
    // drop the note entirely.
    if (estMarqueur(value)) return null;
  }

  const pairs = [];
  for (let i = 0; i < labelCount; i++) {
    pairs.push({ label: lines[start + i], value: lines[valueStart + i] });
  }
  return { pairs, nextCursor: valueStart + labelCount };
}

/**
 * Enhanced SCP parser that prevents repetitions, cleanly combines file headers,
 * detects dialogue turns accurately, and handles log markers.
 */
export function parseScpScript(
  rawContent: string,
  scpTitle: string = 'Dossier SCP',
  lang: string = 'fr',
  /** Pre-resolved note signatories, when parsing one page of a multi-page dossier. */
  knownSignatories?: Map<string, string>,
  /**
   * Structure extraite de la source wikidot (page 0 seulement) : tableaux qui vident les
   * cellules aplaties, onglets, sessions de terminal.
   */
  structure?: StructureSource
): SpeechSegment[] {
  // Le script des onglets part AVANT le repérage des notes : ses identifiants hexadécimaux
  // (« tabViewffded5f1ca63… ») offriraient des chiffres nus au balayage des marqueurs.
  const contenu = rawContent.replace(SCRIPT_ONGLETS, '');
  const { body: withoutNotes, notes: footnotes } = extractFootnotes(contenu);
  // Who signs the marginal notes? Resolved from the document's own wording.
  const signatories = knownSignatories ?? resolveInitialSignatories(rawContent);
  const cleaned = cleanWikidotMarkup(markFootnotePositions(withoutNotes, footnotes), lang);
  const lignesNettoyees = recollerPonctuationOrpheline(
    cleaned
      .split('\n')
      .map(l => l.trim())
      // Drop lines left empty by footnote extraction: Wikidot separates consecutive markers
      // with "|", which becomes a stray segment once the markers are pulled out.
      .filter(l => l.length > 0 && !/^[|·•\-–—\s]+$/.test(l))
  );
  // Onglets puis terminal : les titres d'onglets s'insèrent devant la première ligne de
  // chaque onglet, que la passe du terminal enjambe ensuite comme tout marqueur.
  const rawLines = marquerSessionsTerminal(
    placerOnglets(lignesNettoyees, structure?.onglets),
    structure?.sessions,
    lang
  );
  const segments: SpeechSegment[] = [];

  let segmentId = 1;

  // 1. DEDUPLICATION & PRE-HEADER CLEANUP:
  // Find where the official file begins (e.g. "Objet n° : SCP-XXX" or "Item #: SCP-XXX")
  // This removes image captions (e.g. "SCP-173 sous confinement") or intro credits that cause repeats
  const itemRegex = /^(?:item\s*#|objet\s*(?:n[°o\^]+|\#)?\s*:)/i;
  const classRegex = /^(?:object\s*class\s*:|classe\s*:)/i;

  let startIdx = 0;
  for (let i = 0; i < Math.min(25, rawLines.length); i++) {
    if (itemRegex.test(rawLines[i])) {
      startIdx = i;
      break;
    }
  }

  // Everything above the header used to be discarded wholesale. That removed the credits
  // block and image captions (the repetition complaints this rule exists for), but it also
  // silently deleted genuine opening narration whenever Crom flattened it above the ACS bar
  // — SCP-6172 lost its "EMERGENCY NOTICE FROM THE DEPARTMENT OF ONTOKINETICS", SCP-6747 its
  // terminal intro. Keep the prologue, drop only chrome we can positively identify.
  const preamble = rawLines.slice(0, startIdx).filter(l => !isPreambleChrome(l));
  // Les blocs « LABEL MAJUSCULES : valeur » sont fusionnés AVANT toute autre passe : la
  // règle de dialogue et l'appariement des tables plates ne doivent jamais les voir en
  // lignes séparées. Les tableaux aplatissent leurs cellules en lignes simples ; ils sont
  // consumés AVANT (sinon fusionnerLabelsValeurs voient « Site d'assignation » / « Site-115 »
  // comme un bloc ACS), et la fusion des en-têtes d'e-mail APRÈS (une cellule « Sujet : … »
  // ne doit pas fusionner avec la cellule suivante).
  const lignesAplaties = consommerTableaux([...preamble, ...rawLines.slice(startIdx)], structure?.tableaux);
  const lines = fusionnerEnTetesEmail(fusionnerLabelsValeurs(lignesAplaties));

  // 2. COMBINE ITEM # AND CLASS INTO A SINGLE SOLEMN DOSSIER INTRO
  // This completely solves the user complaint: "souvent il va répéter de fois scp numéro"
  let lineCursor = 0;
  const leadHeader = tryBuildHeaderIntro(lines, 0, lang);
  if (leadHeader) {
    segments.push({
      id: segmentId++,
      speaker: 'Archiviste',
      role: 'narrator',
      text: leadHeader.text,
      rawText: leadHeader.rawText,
      isHeader: true
    });
    lineCursor = leadHeader.nextCursor;
    lines.splice(lineCursor, 0, ...leadHeader.marqueurs);
  }

  // 3. REGEX PATTERNS FOR RECOGNIZING CONTENT TYPES
  // (sectionHeaderRegex vit désormais au niveau module — voir la passe de fusion.)

  // Log boundaries: [DÉBUT DU RAPPORT], <Début de l’enregistrement>, [BEGIN LOG], etc.
  const logBoundaryRegex = /^[\[<]\s*(?:début|fin|begin|end)\s*(?:de\s*l[\'’]|du\s*)?(?:enregistrement|rapport|log)\s*[\]>]/i;

  // Interview metadata: Interrogateur : Dr Hamm, Interrogé : SCP-049
  const interviewMetaRegex = /^(?:interrogateur|interrogé|sujet|date|lieu|personnel\s*présent)\s*:\s*(.*)/i;

  // Dialogue turns: "Dr Raymond Hamm : dialogue", "Capt. [censuré] : dialogue",
  // "L'Œil qui Voit : dialogue" (apostrophe typographique) or "[DONNÉES SUPPRIMÉES] : …"
  // (locuteur entre crochets). Les lettres sont prises dans \p{L} : Œ (U+0152) sortait de
  // l'ancienne plage À-ÿ et "L'Œil" ne matchait jamais.
  const dialogueRegex = /^([A-ZÀ-Ÿ0-9\[][\p{L}\p{N}\s\.\-_#'’\[\]]{1,40}?)\s*:\s*(.*)$/u;

  // Construit le segment parlé d'une note de bas de page — résolution du signataire, voix
  // dédiée — pour les deux sites d'émission : le jeton autonome (cas @) et les jetons
  // intercalés dans une rangée de tableau (cas T2).
  const notesDites = new Set<number>();
  const creerSegmentNote = (num: number): Omit<SpeechSegment, 'id'> | null => {
    const rawNote = footnotes.get(num);
    notesDites.add(num);
    if (!rawNote) return null;
    // Les notes sont extraites de `rawContent` AVANT le nettoyage du corps — seul le
    // corps passait par cleanWikidotMarkup. Le balisage Wikidot et les blocs caviardés
    // d'une note partaient donc bruts au moteur de synthèse : « SCP-███-IT » était lu
    // avec ses barres, et un //italique// avec ses barres obliques. `rawText` garde
    // bien l'original, c'est son rôle.
    const noteText = cleanWikidotMarkup(rawNote, lang);
    // Annotated dossiers sign each note with the annotator's initials ("… [AF]").
    // Resolve them to a real person so the note is spoken in that character's own voice
    // instead of a single flat "footnote" voice — and strip the initials, which would
    // otherwise be read aloud letter by letter.
    const sigMatch = noteText.match(/\s*\[([A-ZÀ-Þ]{2,3})\]\s*$/);
    const signatory = sigMatch ? signatories.get(sigMatch[1]) : undefined;
    const spokenText = sigMatch ? noteText.slice(0, sigMatch.index).trim() : noteText;

    let noteRole: CharacterRole = 'intercom';
    let noteGender: CharacterGender | undefined;
    let noteVoice: AssignedVoiceSignature | undefined;

    if (signatory) {
      noteRole = detectRole(signatory);
      if (noteRole === 'researcher' || noteRole === 'commander' || noteRole === 'agent') {
        noteVoice = characterVoiceService.getScientistVoiceSignature(signatory, lang, rawContent);
        noteGender = noteVoice.gender;
      }
    }

    return {
      speaker: signatory || (lang === 'en' ? 'Footnote' : 'Note de bas de page'),
      role: noteRole,
      gender: noteGender,
      voiceSignature: noteVoice
        ? { voiceId: noteVoice.voiceId, pitch: noteVoice.pitch, rate: noteVoice.rate }
        : undefined,
      text: spokenText,
      rawText: rawNote,
      isFootnote: true,
      footnoteNumber: num
    };
  };

  while (lineCursor < lines.length) {
    const line = lines[lineCursor];

    // Case O: le titre d'un onglet, dit là où l'onglet commence (placerOnglets). Un titre sans
    // lettre ni chiffre (« _ », SCP-700-FR) ne s'annonce pas.
    if (line.startsWith('@@ONGLET@@')) {
      const titre = line.slice('@@ONGLET@@'.length).trim();
      if (/[\p{L}\p{N}]/u.test(titre)) {
        segments.push({
          id: segmentId++,
          speaker: 'Archiviste',
          role: 'narrator',
          text: /[.!?…:]$/.test(titre) ? titre : `${titre}.`,
          rawText: titre,
          isHeader: true
        });
      }
      lineCursor++;
      continue;
    }

    // Case S: une session de terminal (marquerSessionsTerminal). Les réponses du système sont
    // dites d'un bloc par le terminal, SANS la règle de dialogue : « ACCÉDER : Montre… » est
    // une ligne d'aide, pas un personnage. Les saisies reviennent à l'utilisateur connecté.
    if (line.startsWith('@@TERMINAL@@') || line.startsWith('@@SAISIE@@')) {
      try {
        if (line.startsWith('@@TERMINAL@@')) {
          const { lignes = [] } = JSON.parse(line.slice('@@TERMINAL@@'.length)) as { lignes?: string[] };
          const texte = lignes.reduce(
            (acc, l) => (!acc ? l : /[.!?…:;,]$/.test(acc) ? `${acc} ${l}` : `${acc}. ${l}`),
            ''
          );
          splitIntoBreathChunks(texte).forEach(morceau => {
            segments.push({
              id: segmentId++,
              speaker: 'Terminal',
              role: 'intercom',
              text: morceau,
              rawText: morceau
            });
          });
        } else {
          const { texte = '', utilisateur = '' } = JSON.parse(line.slice('@@SAISIE@@'.length)) as {
            texte?: string;
            utilisateur?: string;
          };
          const role = detectRole(utilisateur);
          const signature =
            role === 'researcher' || role === 'commander' || role === 'agent'
              ? characterVoiceService.getScientistVoiceSignature(utilisateur, lang, rawContent)
              : undefined;
          segments.push({
            id: segmentId++,
            speaker: utilisateur,
            role,
            gender: signature?.gender,
            voiceSignature: signature
              ? { voiceId: signature.voiceId, pitch: signature.pitch, rate: signature.rate }
              : undefined,
            text: texte,
            rawText: texte
          });
        }
      } catch {
        // Payload corrompu : on saute la ligne marqueur — lire le JSON brut serait pire.
      }
      lineCursor++;
      continue;
    }

    // Case R: un titre qui répète la désignation de l'en-tête ACS juste en dessous (« SCP-2317 »
    // puis « Objet no : SCP-2317 ») — le numéro serait dit deux fois d'affilée.
    const ligneSuivante = lines[lineCursor + 1];
    if (
      ligneSuivante &&
      !estMarqueur(line) &&
      ITEM_LINE.test(ligneSuivante) &&
      normaliserCellule(line).toLowerCase() ===
        normaliserCellule(ligneSuivante.replace(ITEM_LINE, '').replace(/\*\*/g, '').replace(/^[\s:—–-]+/, '')).toLowerCase()
    ) {
      lineCursor++;
      continue;
    }

    // Case H: another ACS header bar further down the dossier (a second file, a reclassified
    // version, an addendum with its own header). Without this they fall through to the
    // dialogue rule and "Objet no" gets announced as a speaker.
    const laterHeader = tryBuildHeaderIntro(lines, lineCursor, lang);
    if (laterHeader) {
      segments.push({
        id: segmentId++,
        speaker: 'Archiviste',
        role: 'narrator',
        text: laterHeader.text,
        rawText: laterHeader.rawText,
        isHeader: true
      });
      lineCursor = laterHeader.nextCursor;
      lines.splice(lineCursor, 0, ...laterHeader.marqueurs);
      continue;
    }

    // Case T2: a real table rebuilt from the wikidot source (consommerTableaux). One segment
    // per data row, spoken as "En-tête : valeur. En-tête : valeur." — the reading order is
    // row by row, never cell by cell. A footnote marker cuts the row where it sits: the
    // note is spoken the instant its index is reached, then the rest of the value resumes
    // without its header. An unparseable payload is skipped, never spoken: the marker
    // itself has nothing readable in it.
    if (line.startsWith('@@TABLEAU@@')) {
      try {
        const data = JSON.parse(line.slice('@@TABLEAU@@'.length)) as { rangees?: ItemTableau[][] };
        for (const items of data.rangees ?? []) {
          let phrases: string[] = [];
          let brutes: string[] = [];
          const vider = () => {
            if (!phrases.length) return;
            segments.push({
              id: segmentId++,
              speaker: 'Archiviste',
              role: 'narrator',
              isHeader: false,
              rawText: brutes.join(' | '),
              text: phrases.join('. ')
            });
            phrases = [];
            brutes = [];
          };
          for (const item of items) {
            if (item.t === 'note') {
              vider();
              const seg = creerSegmentNote(item.n);
              if (seg) segments.push({ ...seg, id: segmentId++ });
              continue;
            }
            if (item.t === 'paire') {
              phrases.push(`${item.h} : ${item.v}`);
              brutes.push(`${item.h} | ${item.v}`);
            } else {
              // Morceau de valeur repris après un marqueur, sans son en-tête.
              phrases.push(item.v);
              brutes.push(item.v);
            }
          }
          vider();
        }
      } catch {
        // Payload corrompu : on saute la ligne marqueur — lire le JSON brut serait pire.
      }
      lineCursor++;
      continue;
    }

    // Case T: a two-column info table, flattened by Crom into all the LABELS followed by all
    // the VALUES. Read as-is you hear "DÉPARTEMENTS ASSIGNÉS / DIRECTEURS DU PROJET /
    // Archétypique… / CONSEILLER O5-8…" — every fact present, but every label attached to
    // the wrong value. Re-pair them so each is spoken as "LABEL : value".
    const pairing = pairFlattenedTable(lines, lineCursor);
    if (pairing) {
      for (const { label, value } of pairing.pairs) {
        segments.push({
          id: segmentId++,
          speaker: 'Archiviste',
          role: 'narrator',
          text: `${label} : ${value}`,
          rawText: `${label} | ${value}`,
          isHeader: true
        });
      }
      lineCursor = pairing.nextCursor;
      continue;
    }

    // Case @: a footnote placeholder — emit the note here, where its marker actually sat.
    const noteMatch = line.match(/^@@NOTE(\d{1,3})@@$/);
    if (noteMatch) {
      const seg = creerSegmentNote(parseInt(noteMatch[1], 10));
      if (seg) segments.push({ ...seg, id: segmentId++ });
      lineCursor++;
      continue;
    }

    // Case A: Log boundary (<Début de l'enregistrement> / [BEGIN LOG])
    if (logBoundaryRegex.test(line)) {
      segments.push({
        id: segmentId++,
        speaker: 'Intercom',
        role: 'intercom',
        text: line,
        rawText: line,
        isLogMarker: true
      });
      lineCursor++;
      continue;
    }

    // Case B: Section headers (Procédures de confinement spéciales, Description, Addendum)
    const sectionMatch = line.match(sectionHeaderRegex);
    if (sectionMatch) {
      const secName = line.split(':')[0].trim();
      const secBody = sectionMatch[1]?.trim() || '';
      // La page écrit « Description : … » — on la cite telle quelle. L'ancien « Description.
      // … » remplaçait le deux-points par un point. La respiration du titre est déjà assurée
      // par le débit ralenti (isHeader) et la pause qui suit.
      const fullText = secBody ? `${secName} : ${secBody}` : `${secName}.`;
      const { cleanedText, directions } = extractStageDirections(fullText);

      segments.push({
        id: segmentId++,
        speaker: 'Archiviste',
        role: 'narrator',
        text: cleanedText || fullText,
        rawText: line,
        stageDirections: directions,
        isHeader: true
      });
      lineCursor++;
      continue;
    }

    // Case C: Interview metadata (Interrogateur, Interrogé, Date...)
    if (interviewMetaRegex.test(line)) {
      const { cleanedText, directions } = extractStageDirections(line);
      segments.push({
        id: segmentId++,
        speaker: 'Archiviste',
        role: 'narrator',
        text: cleanedText || line,
        rawText: line,
        stageDirections: directions,
        isHeader: true
      });
      lineCursor++;
      continue;
    }

    // Case D: Dialogue turn: "Speaker: dialogue text"
    const diagMatch = line.match(dialogueRegex);
    if (diagMatch) {
      const candidateSpeaker = diagMatch[1].trim();
      const diagContent = diagMatch[2].trim();
      const lowerSpeaker = candidateSpeaker.toLowerCase();

      // The colon we split on may be inside a clock time: "At approximately 18:00, …" was
      // becoming a character called "At approximately 18". A time never introduces a line.
      const splitInsideTime = /\d$/.test(candidateSpeaker) && /^\d{2}\b/.test(diagContent);

      // Un locuteur entièrement entre crochets ("[DONNÉES SUPPRIMÉES]") est un vrai
      // interlocuteur des transcriptions, pas un titre : il passe avant le filtre des
      // titres tout-majuscules, qui le classerait en heading (deux mots, 100 % capitales).
      const locuteurEntreCrochets = /^\[[^\]]{2,40}\]$/.test(candidateSpeaker);

      // « Aujourd’hui : rien à signaler » — une élision suivie d'une minuscule est une
      // phrase, pas un personnage. L'ancienne classe de caractères, sans ’, protégeait ces
      // lignes par échec de match ; l'ajout de ’ au locuteur rouvre ce trou, cette garde le
      // rebouche. « L'Œil » passe : une majuscule suit l'élision, c'est un nom propre.
      const elisionDePhrase = /[’']\p{Ll}/u.test(candidateSpeaker);

      // Ensure it's not a generic non-dialogue title (like "Attention", "Avertissement", "Site-19")
      const isNotDialogue =
        /^(attention|avertissement|warning|note|mise\s*à\s*jour|update|temps|heure)$/i.test(lowerSpeaker) ||
        // Les étiquettes d'un bloc e-mail (« De : Stacy Steele… ») ont la forme du dialogue ;
        // une ligne restée isolée (run < 2, non fusionnée en amont) est du narrateur, pas un
        // personnage — sinon scp-7215 confiait l'expéditeur à un locuteur nommé « De ».
        ETIQUETTES_EMAIL.has(lowerSpeaker) ||
        // An ACS header field is never a person, whatever layout it arrived in.
        HEADER_LABEL_NOT_SPEAKER.test(candidateSpeaker.trim()) ||
        // A section heading or a structured-block field label: keep the title IN the spoken
        // text instead of hiding it in `speaker`, which is never read aloud.
        (!locuteurEntreCrochets && looksLikeSectionHeading(candidateSpeaker)) ||
        elisionDePhrase ||
        splitInsideTime ||
        // Un nombre seul ou entre crochets (« [4] : decipherkeydin », terminal de SCP-150-FR ;
        // « 1970 : … », « 3.1 : … ») est un indice, une année, un numéro de liste — le libellé
        // restait muet dans `speaker`. Les matricules à tiret (« 6005-09 ») restent des
        // interlocuteurs, et un nombre qui revient en tête de réplique aussi : « 0 : OUI »
        // est le Spécialiste 0 de SCP-3333, qui parle tout au long de l'enregistrement.
        (/^(?:\[[^\]\p{L}]*\]|[\d.]+)$/u.test(candidateSpeaker) &&
          (rawContent.match(new RegExp(`^${echapperRegex(candidateSpeaker)}\\s*:`, 'gm')) ?? []).length < 3);

      if (!isNotDialogue) {
        const role = detectRole(candidateSpeaker);
        const { cleanedText, directions } = extractStageDirections(diagContent || candidateSpeaker);

        let gender: CharacterGender | undefined;
        let voiceSignature: AssignedVoiceSignature | undefined;

        if (role === 'researcher' || role === 'commander' || role === 'agent') {
          voiceSignature = characterVoiceService.getScientistVoiceSignature(candidateSpeaker, lang, rawContent);
          gender = voiceSignature.gender;
        }

        // Une longue tirade est découpée comme un paragraphe narratif : même respiration,
        // même possibilité de s'y déplacer. Les didascalies restent sur le premier morceau,
        // là où l'auteur les a écrites.
        const morceaux = splitIntoBreathChunks(cleanedText || diagContent);
        morceaux.forEach((morceau, i) => {
          segments.push({
            id: segmentId++,
            speaker: candidateSpeaker,
            role: role,
            gender: gender,
            voiceSignature: voiceSignature ? {
              voiceId: voiceSignature.voiceId,
              pitch: voiceSignature.pitch,
              rate: voiceSignature.rate
            } : undefined,
            text: morceau,
            rawText: i === 0 ? line : morceau,
            stageDirections: i === 0 ? directions : undefined
          });
        });
        lineCursor++;
        continue;
      }
    }

    // Case E: Sound or action lines inside logs e.g. [Bruit de chaises déplacées...]
    if (/^[\[(].{5,80}[\])]$/.test(line) && (line.toLowerCase().includes('bruit') || line.toLowerCase().includes('sound') || line.toLowerCase().includes('pause') || line.toLowerCase().includes('silence'))) {
      segments.push({
        id: segmentId++,
        speaker: 'Intercom',
        role: 'intercom',
        text: line,
        rawText: line,
        stageDirections: [line.replace(/^[\[(]|[\])]$/g, '')]
      });
      lineCursor++;
      continue;
    }

    // Case F: Standard narrative paragraph
    // Le découpage en morceaux respirables est partagé avec les répliques de dialogue.
    if (line.length > CHUNK_TRIGGER) {
      for (const morceau of splitIntoBreathChunks(line)) {
        const { cleanedText, directions } = extractStageDirections(morceau);
        segments.push({
          id: segmentId++,
          speaker: 'Archiviste',
          role: 'narrator',
          text: cleanedText || morceau,
          rawText: morceau,
          stageDirections: directions
        });
      }
    } else {
      const { cleanedText, directions } = extractStageDirections(line);
      segments.push({
        id: segmentId++,
        speaker: 'Archiviste',
        role: 'narrator',
        text: cleanedText || line,
        rawText: line,
        stageDirections: directions
      });
    }

    lineCursor++;
  }

  // Une note dont le marqueur ne s'est placé nulle part (chiffre nu indiscernable, collé à un
  // autre chiffre…) n'est pas perdue : elle est dite en fin de page, dans l'ordre, là où la
  // page la rangeait. Le script des onglets, avant d'être retiré, captait de tels marqueurs
  // dans ses identifiants hexadécimaux et faisait lire la note au milieu du code.
  for (const num of [...footnotes.keys()].sort((a, b) => a - b)) {
    if (notesDites.has(num)) continue;
    const seg = creerSegmentNote(num);
    if (seg) segments.push({ ...seg, id: segmentId++ });
  }

  // Fallback if empty
  if (segments.length === 0) {
    segments.push({
      id: 1,
      speaker: 'Archiviste',
      role: 'narrator',
      text: cleaned || scpTitle,
      rawText: cleaned || scpTitle
    });
  }

  return segments;
}
