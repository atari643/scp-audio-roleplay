/**
 * Normalisation du texte AVANT envoi au moteur de synthèse.
 *
 * PORTÉE RÉELLE, mesurée et non supposée. Des tests comparatifs sur l'endpoint edge-tts
 * (taille de l'audio produit, à texte équivalent) montrent que le moteur neural normalise
 * DÉJÀ tout seul :
 *
 *   « Le(s) sujet(s) »            = « Le sujet »              → octets identiques
 *   « PROCÉDURES DE CONFINEMENT » = « Procédures... »         → octets identiques
 *   « [DÉBUT DE L ENREGISTREMENT] »= « Début de... »          → octets identiques
 *   « SCP 6172 »                  = « SCP six mille cent... » → octets identiques
 *
 * Cette normalisation ne sert donc PAS à corriger le moteur neural. Elle sert :
 *
 *  1. au repli `speechSynthesis` du navigateur, nettement moins tolérant, qui lui
 *     vocalise les crochets et les « (s) » ;
 *  2. aux suites de symboles décoratifs, seul cas où l'effet est mesurable même en
 *     neural (« ▪ ● ■ » ajoute ~1,4 s de silence) ;
 *  3. au tiret cadratin converti en virgule, qui produit une vraie pause là où le tiret
 *     n'en produit aucune.
 *
 * Ne pas y ajouter de règle « au cas où » sans la mesurer d'abord : la moitié de ce
 * fichier a failli être du code mort écrit sur des hypothèses fausses.
 *
 * Attention aux frontieres de mots : en JavaScript la classe \b est ASCII, donc
 * /\bcensure\b/ ne correspond a rien — apres un caractere accentue, le moteur
 * ne voit aucune limite de mot. Les regles ci-dessous utilisent des classes Unicode
 * explicites (\p{L}) pour cette raison.
 *
 * MISE À JOUR. Les règles ajoutées depuis sont toutes adossées à une mesure de
 * `scripts/probe-speech.mjs`, qui automatise exactement la comparaison décrite ci-dessus.
 * Les tables et le détail des écarts vivent dans `speechLexicon.ts`, y compris la liste de
 * ce que le moteur fait DÉJÀ correctement et qu'il ne faut donc pas réécrire.
 *
 * La mesure la plus lourde de conséquence : le moteur prononce le mot « tiret ».
 * « SCP-608-FR » et « SCP tiret 608 tiret FR » produisent un audio identique à l'octet
 * près. Le corpus contient 12 682 codes SCP, 761 désignations de site et un millier de
 * codes O5 : c'était, de loin, le premier défaut de fluidité de la lecture.
 */

import {
  ABBREVIATIONS_EN,
  ABBREVIATIONS_FR,
  CENSORED_SPOKEN,
  CYRILLIC_HOMOGLYPHS,
  GLOSSARY_EN,
  GLOSSARY_FR,
  GREEK_DESIGNATIONS,
  SPELL_OUT_ACRONYMS
} from './speechLexicon';

/** Réglages qui dépendent du dossier, pas du seul segment. */
export interface SpeechOptions {
  /**
   * Sigles à développer en toutes lettres dans CE segment, parce que c'est leur première
   * apparition dans le dossier. Calculé une fois par dossier (voir `glossaryFirstMentions`).
   */
  expandAcronyms?: ReadonlySet<string>;
}

/** Le glossaire de la langue, exposé pour que le moteur repère les premières occurrences. */
export function glossaryFor(lang: string): Record<string, string> {
  return lang === 'en' ? GLOSSARY_EN : GLOSSARY_FR;
}

/** Motif d'un sigle isolé, frontières Unicode comprises. */
export function acronymPattern(acronym: string): RegExp {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${acronym}(?![\\p{L}\\p{N}])`, 'u');
}

/**
 * Sigles à laisser en capitales.
 *
 * Attention, l'intention d'origine (« la synthèse les épelle ») ne se vérifie qu'à moitié :
 * la casse seule ne force RIEN, le moteur épelle un sigle quand il n'est pas prononçable
 * (SCP, PCS, CMO, MTF, ACS) et le lit comme un mot sinon (FIM → « fim »). Cette liste sert
 * donc surtout à protéger les sigles de la mise en casse de phrase ; ceux qu'il faut en
 * plus faire épeler sont dans `SPELL_OUT_ACRONYMS` (speechLexicon.ts).
 */
const KEEP_UPPERCASE = new Set([
  'SCP', 'RAISA', 'FIM', 'FIS', 'GDI', 'GOI', 'ACS', 'DAT', 'MTF', 'O5', 'DEA', 'CDI',
  'ADN', 'IA', 'IAA', 'AI', 'PDG', 'ONU', 'USA', 'URSS', 'UIU', 'GRU', 'CIA', 'FBI', 'ND', 'JO',
  // Sigles du lexique de la branche francophone qui manquaient à la liste. Sans eux, la
  // mise en casse de phrase les transformait en mots : « les PCS » sortait en « les Pcs »,
  // « la CMO » en « la Cmo » (29 occurrences dans le corpus). Le défaut était invisible aux
  // sondes, qui mesurent le moteur sur du texte brut alors que le dégât se produisait en
  // amont, dans cette normalisation.
  'PCS', 'CMO', 'BSIA', 'MCD', 'FCM', 'GOC', 'CDA'
]);

const LETTER = '\\p{L}\\p{M}';

/**
 * Passe une SUITE de mots en capitales en casse de phrase.
 *
 * Le traitement se fait sur la suite entière, pas mot par mot : « AVERTISSEMENT DU
 * DÉPARTEMENT » traité mot à mot laisse « DU » intact (trop court pour être détecté seul)
 * et donne « Avertissement DU Département », pire que l'original.
 */
function softenUppercaseRun(run: string): string {
  const words = run.split(/(\s+)/);
  let firstWordDone = false;

  return words
    .map(word => {
      if (/^\s+$/.test(word)) return word;
      const letters = word.replace(new RegExp(`[^${LETTER}]`, 'gu'), '');
      if (KEEP_UPPERCASE.has(letters.toUpperCase())) return word;

      const lowered = word.toLowerCase();
      if (!firstWordDone) {
        firstWordDone = true;
        return lowered.charAt(0).toUpperCase() + lowered.slice(1);
      }
      return lowered;
    })
    .join('');
}

/**
 * Reste-t-il quelque chose à prononcer ?
 *
 * Un texte réduit à de la ponctuation fait échouer edge-tts avec `NoAudioReceived` — vérifié :
 * « . », « , » et « … » déclenchent tous l'exception, alors qu'une chaîne vide produit
 * silencieusement un fichier de 0 octet. Les deux cas doivent être écartés avant l'appel.
 */
export function hasSpeakableContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text || '');
}

/**
 * Homoglyphes cyrilliques : lettres russes employées à la place de leurs sosies latins.
 *
 * Le cyrillique est traité au niveau du SEGMENT, pas du mot. Un « Dr А████████ » ne laisse
 * qu'un А isolé une fois le caviardage remplacé, donc la règle « mot contenant les deux
 * alphabets » le raterait. On regarde plutôt la proportion : un vrai passage en russe est
 * massivement cyrillique, une contamination d'homoglyphes est marginale.
 */
function fixCyrillicHomoglyphs(input: string): string {
  const latin = (input.match(/\p{Script=Latin}/gu) || []).length;
  const cyrillic = (input.match(/\p{Script=Cyrillic}/gu) || []).length;

  let t = input;
  if (cyrillic > 0 && cyrillic < latin * 0.2) {
    t = t.replace(/\p{Script=Cyrillic}/gu, c => CYRILLIC_HOMOGLYPHS[c] ?? c);
  }

  return t;
}

/**
 * Lettres grecques employées comme désignation d'unité : « FIM α-1 », « Ζ9-Cap ».
 *
 * Uniquement en tête de jeton. Le wiki contient aussi des passages de texte volontairement
 * corrompu truffés de grec au milieu des mots ; les traduire réparerait un effet de style.
 *
 * Appelée AVANT la règle des tirets de désignation, et produisant elle-même un trait
 * d'union devant le numéro (« Ζ9-Cap » → « Zêta-9-Cap », « α-1 » → « Alpha-1 »). Le jeton
 * redevient ainsi une désignation ordinaire, commençant par une majuscule latine et
 * contenant un chiffre, que la règle suivante nettoie d'un seul geste. Développer le grec
 * après elle laissait « Alpha-1 » avec son tiret, donc prononcé « Alpha tiret un ».
 */
function expandGreekDesignations(input: string): string {
  return input.replace(
    /(^|[^\p{L}\p{N}])([Α-Ωα-ω])(?=$|\p{N}|[^\p{L}])/gu,
    (match, prefix: string, letter: string, offset: number, whole: string) => {
      const name = GREEK_DESIGNATIONS[letter];
      if (!name) return match;
      // « Ζ9 » : le numéro est collé à la lettre. On rétablit le trait d'union de
      // désignation plutôt qu'un espace, pour que la règle des tirets le voie et le traite.
      const suivant = whole[offset + match.length];
      return `${prefix}${name}${suivant && /\p{N}/u.test(suivant) ? '-' : ''}`;
    }
  );
}

/**
 * Longueur au-delà de laquelle une phrase est jugée « sans air ».
 *
 * En dessous, la ponctuation de l'auteur est respectée telle quelle : une phrase courte a
 * déjà son rythme, la retoucher la hacherait pour rien.
 */
const PHRASE_LONGUE = 140;

/**
 * Donne de l'air aux phrases longues, en promouvant leurs articulations en fins de phrase.
 *
 * Mesuré sur le vrai moteur : le point achète 0,36 s de silence, la virgule quasiment rien,
 * et ni le point-virgule (8,8 % d'écart avec le point) ni le deux-points (11,6 %) ne
 * produisent la pause qu'ils suggèrent à l'œil. Or la prose SCP est administrative et
 * enchaîne des propositions sur trois lignes sans reprendre son souffle.
 *
 * Comme edge-tts n'accepte aucun SSML, la ponctuation est le SEUL levier de respiration à
 * l'intérieur d'un segment — les pauses de `speechEngine` ne jouent qu'entre segments.
 *
 * Restreint aux phrases longues, et à des articulations qui sont déjà des ruptures logiques :
 * on n'invente pas une pause, on rend audible celle que l'auteur a écrite.
 */
function aerateLongSentences(text: string): string {
  const phrases: string[] = [];
  let debut = 0;
  for (let i = 0; i < text.length; i++) {
    if (!'.!?…'.includes(text[i])) continue;
    let fin = i;
    while (fin + 1 < text.length && '.!?…'.includes(text[fin + 1])) fin++;
    let coupe = fin + 1;
    while (coupe < text.length && /\s/.test(text[coupe])) coupe++;
    phrases.push(text.slice(debut, coupe));
    debut = coupe;
    i = fin;
  }
  if (debut < text.length) phrases.push(text.slice(debut));

  return phrases
    .map(phrase => {
      if (phrase.length <= PHRASE_LONGUE) return phrase;
      return (
        phrase
          // Le point-virgule sépare deux propositions complètes : c'est un point qui n'ose
          // pas dire son nom.
          .replace(/\s*;\s*/g, '. ')
          // Le deux-points d'énoncé, jamais celui d'une heure (« 18:00 ») ni d'une échelle.
          .replace(/(?<=[\p{L}\p{N}\)\]])\s*:\s+(?!\d)/gu, '. ')
          // Une conjonction d'opposition marque un tournant du raisonnement.
          .replace(
            /,\s+(mais|cependant|toutefois|néanmoins|pourtant|however|nevertheless|although)(?=\s)/giu,
            '. $1'
          )
      );
    })
    .join('');
}

export function normalizeForSpeech(
  input: string,
  lang: string = 'fr',
  options: SpeechOptions = {}
): string {
  let t = input;

  // 0. Homoglyphes cyrilliques, avant tout le reste : les règles suivantes raisonnent sur
  //    des lettres latines et un А cyrillique leur est invisible.
  t = fixCyrillicHomoglyphs(t);

  // 1. Marqueurs de pluriel/genre : « le(s) sujet(s) », « doi(ven)t », « chercheur(euse) ».
  //    Lus tels quels, on entend « parenthèse s ». Condition : parenthèse courte COLLÉE à un
  //    mot — une vraie incise entre parenthèses doit rester.
  t = t.replace(new RegExp(`([${LETTER}])\\([${LETTER}]{1,5}\\)`, 'gu'), '$1');

  // 2. Blocs censurés, avant le traitement des crochets pour attraper « [CENSURÉ] ».
  const redacted = CENSORED_SPOKEN[lang] ?? CENSORED_SPOKEN.fr;
  t = t.replace(
    new RegExp(`\\[?\\s*(?:censur[ée]e?|redacted|données?\\s*supprimées?|expurgée?|data\\s*expunged)\\s*\\]?`, 'giu'),
    redacted
  );

  // 3. Crochets d'annotation : « [DÉBUT DE L'ENREGISTREMENT] » doit devenir une phrase,
  //    sinon les crochets eux-mêmes sont vocalisés.
  t = t.replace(/\[([^\]]{2,90})\]/g, (_m, inner: string) => `${String(inner).trim()}.`);

  // 4. Suites de mots en capitales → casse de phrase (voir softenUppercaseRun).
  t = t.replace(
    new RegExp(`\\p{Lu}[\\p{Lu}\\p{M}'’-]+(?:\\s+\\p{Lu}[\\p{Lu}\\p{M}'’-]+)*`, 'gu'),
    run => (run.replace(new RegExp(`[^${LETTER}]`, 'gu'), '').length >= 3 ? softenUppercaseRun(run) : run)
  );

  // 5. Abréviations et titres.
  //
  //    APRÈS la mise en casse de phrase, et c'est important : appliquée avant, l'expansion
  //    coupait le bloc de capitales en fragments que l'étape 4 recapitalisait chacun de son
  //    côté — « LE DIR. VEMHOFF A ORDONNÉ » donnait « LE Directeur Vemhoff A Ordonné ».
  //    Les motifs sont donc insensibles à la casse, puisqu'ils rencontrent « dir. » ici.
  //
  //    APRÈS l'étape 2 aussi : le caviardage est devenu du texte (« Dir. [CENSURÉ] » →
  //    « Dir. donnée expurgée »), donc la condition « au moins deux lettres derrière »,
  //    qui protège les initiales de noms (« Dir. Jonathan A. King »), trouve un mot.
  const abbreviations = lang === 'en' ? ABBREVIATIONS_EN : ABBREVIATIONS_FR;
  for (const rule of abbreviations) {
    t = t.replace(rule.pattern, rule.replacement);
  }

  // 6. Désignations. Le grec d'abord (« FIM α-1 » → « FIM Alpha-1 »), pour que les unités
  //    grecques rejoignent le cas général traité juste en dessous.
  t = expandGreekDesignations(t);

  //    Tirets de désignation. Le moteur prononce « tiret » : « SCP-608-FR » et « SCP tiret
  //    608 tiret FR » rendent un audio identique à l'octet près. C'est la correction qui
  //    change le plus la lecture, le corpus contenant 12 682 codes de ce genre.
  //
  //    Condition : le jeton commence par une majuscule ET contient un chiffre. Sans le
  //    chiffre on massacrerait « Berryman-Langford », « avant-poste » ou « vingt-trois » ;
  //    sans la majuscule initiale on couperait les dates ISO et les intervalles d'années.
  t = t.replace(/\p{Lu}[\p{L}\p{N}]*(?:-[\p{L}\p{N}]+)+/gu, token =>
    /\p{N}/u.test(token) ? token.replace(/-/g, ' ') : token
  );

  //    Les désignations à suffixe alphabétique n'ont pas de chiffre et échappent à la règle
  //    ci-dessus : « Classe-D » (la moitié de ses 150 occurrences), et surtout « Site-A »,
  //    « Site-Z », « Zone-M »… qui pèsent environ 200 occurrences à eux seuls.
  t = t.replace(/(Classe|Class)-([A-E])(?![\p{L}\p{N}])/gu, '$1 $2');
  t = t.replace(
    /(Site|Zone|Secteur|Base|Bio-Site|Avant-Poste|Area|Sector|Outpost)-(\p{Lu})(?![\p{L}\p{N}])/gu,
    '$1 $2'
  );

  //    Tiret orphelin : « SCP-████ » devient « SCP- donnée expurgée » après l'étape 2, et ce
  //    tiret resté seul se prononce. Idem pour le tiret de signature en début de ligne.
  t = t.replace(/(?<=[\p{L}\p{N}])-(?=\s|$)/gu, '');
  t = t.replace(/^\s*-\s+/u, '');

  // 7. Glossaire : première apparition d'un sigle dans le dossier, on le développe. Avant
  //    l'épellation ci-dessous, sinon « FIM » serait déjà devenu « F I M ».
  if (options.expandAcronyms && options.expandAcronyms.size > 0) {
    const glossaire = glossaryFor(lang);
    for (const sigle of options.expandAcronyms) {
      const forme = glossaire[sigle];
      if (!forme) continue;
      // Une seule fois : les occurrences suivantes du même segment restent abrégées.
      t = t.replace(acronymPattern(sigle), `$1${forme}`);
    }
  }

  //    Sigles que le moteur lit comme un mot au lieu de les épeler. Après l'étape 4, qui
  //    aurait sinon remis les lettres espacées en minuscules une à une.
  for (const acronym of SPELL_OUT_ACRONYMS) {
    t = t.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])${acronym}(?![\\p{L}\\p{N}])`, 'gu'),
      `$1${acronym.split('').join(' ')}`
    );
  }

  //    Symboles relationnels du bloc d'alignement ACS (« ALIGNEMENT RATIONNEL : A=Y »,
  //    « COTE : -6 ») : le moteur ne les prononce pas, il y place seulement une pause —
  //    l'auditeur entend « Cote, 6 » et perd le signe. Trois formes mesurées (lot « acs/ »
  //    de probe-speech), toutes divergentes : la règle change bien l'audio. Restreinte au
  //    français — le bloc existe aussi en anglais, mais « equals » n'y a jamais été mesuré.
  //    Place AVANT l'étape 10, dont l'aération transformerait le deux-points en point dans
  //    les phrases longues et ferait échouer le repérage de « : -chiffre ».
  if (lang !== 'en') {
    // « A=Y » → « A égale Y » (3,9 %). Six égalités réelles dans le corpus, toutes dans le
    // bloc ACS de scp-5145 ; le reste des « x=y » est du texte corrompu en minuscules ou en
    // chiffres, que la double exigence de majuscules épargne (« Q= » de scp-3021 inclus,
    // sans membre droit).
    t = t.replace(/(?<![\p{L}\p{N}])(\p{Lu})\s*=\s*(\p{Lu})(?![\p{L}\p{N}])/gu, '$1 égale $2');
    // « Cote : -6 » → « Cote : moins 6 ». Après un deux-points, le tiret sort « tiret »
    // (3,1 % d'écart avec la forme écrite « tiret 6 ») et le signe est perdu pour
    // l'auditeur. Sans deux-points, le moteur dit déjà « moins » (« à -7 °C », verbatim en
    // tête de speechLexicon.ts) — d'où l'exigence du deux-points dans le motif.
    t = t.replace(/:\s*-(?=\d)/gu, ': moins ');
    // « Cote : +0/-0 » → « plus 0, moins 0 » (une seule occurrence dans le corpus). Le
    // slash n'est pas prononçable ; la cible est la transcription orale usuelle d'une cote
    // bifurquante, divergeant de 15,3 % de la forme écrite.
    t = t.replace(/\+(\d+)\s*\/\s*-(\d+)/gu, 'plus $1, moins $2');
    // « N/A » → « sans objet » (16 occurrences en corpus, toutes des tableaux de valeur ;
    // probe-speech lot « tableaux/ » : Rémy 3,19 s vs 3,10 s — le moteur dit déjà « N A »
    // substantiellement, la divergence est d'ordre lexical, pas de coût). Restreint au
    // français : « N/A » se dit « N A » en anglais, forme usuelle là-bas.
    t = t.replace(/\bN\/A\b/g, 'sans objet');
  }

  //    Saisies de terminal (SCP-2317). Le retour arrière « ^H » d'une phrase-clé corrigée :
  //    l'étape 8 retire « ^ » mais laisse « H », épelé (12,4 % d'écart, lot « terminal/ » de
  //    probe-speech, divergent sur les douze voix). Le marqueur part entier, sans simuler
  //    l'effacement : les comptes de « ^H » ne correspondent pas au texte traduit. L'arobase
  //    doublée des identifiants (« jvance1@@fondation.scp ») se dit deux fois (7,2 %, douze
  //    voix) : une seule suffit.
  t = t.replace(/\^H/g, '');
  t = t.replace(/@{2,}/g, '@');

  // 8. Symboles décoratifs du thème, sans valeur parlée.
  t = t.replace(/[►◄▪●■□▲▼◆♦§¤†‡~^_|«»]/g, ' ');

  // 9. Ponctuation d'appui : les suites de points deviennent une vraie suspension, les
  //    tirets cadratins une virgule — le moteur y place alors une pause naturelle.
  //
  //    Mesure au passage : le point de suspension ne dure PAS plus longtemps que le point
  //    (1,3 % d'écart). C'est le passage de la virgule au point qui achète du silence, et il
  //    en achète beaucoup — 0,36 s, soit 10 % sur une phrase courte. C'est le seul levier de
  //    pause interne au texte, edge-tts n'acceptant aucun SSML.
  t = t.replace(/\.{3,}/g, '…');
  t = t.replace(/\s*[–—]\s*/g, ', ');

  // 10. Respiration des phrases longues. Après le tiret cadratin, qui vient de devenir une
  //     virgule et peut donc lui aussi ouvrir une articulation à promouvoir.
  t = aerateLongSentences(t);

  // 11. Nettoyage final.
  t = t.replace(/\s*\.\s*\./g, '.');
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\s{2,}/g, ' ');
  t = t.replace(/\s+([.,;:!?…])/g, '$1');
  // Une espace après « ; » et « : », SAUF entre deux chiffres : « 18:00 » est déjà lu
  // « dix-huit heures », alors que « 18: 00 » produit un audio 27,7 % différent — le moteur
  // ne reconnaît plus l'heure et énumère les nombres. La règle cassait donc précisément ce
  // qu'elle croyait aérer.
  t = t.replace(/([;:])(?!\s)(?<!\d:)(\S)/g, '$1 $2');

  return t.trim();
}

/**
 * Ce que le moteur prononce à la place d'un bloc caviardé.
 *
 * Deux endroits en dépendent et doivent viser exactement la même chaîne : la substitution
 * de `normalizeForSpeech` ci-dessus, et le repérage des caviardages dans les frontières de
 * mots (`speechEngine.censorSpansFrom`), qui coupe le son sur ces mots précis pour y poser
 * un bip.
 *
 * Le découpage du segment en morceaux séparés par un bip, qui existait ici avant, a été
 * retiré : il plaçait bien le bip mais donnait à chaque morceau une intonation de fin de
 * phrase. Les frontières de mots permettent de garder la phrase entière, d'un seul tenant.
 */
export function censoredSpokenWord(lang: string = 'fr'): string {
  return CENSORED_SPOKEN[lang] ?? CENSORED_SPOKEN.fr;
}
