/**
 * Tables de prononciation — ce que le moteur ne lit PAS correctement tout seul.
 *
 * Chaque entrée de ce fichier a été mesurée par `node scripts/probe-speech.mjs`, qui fait
 * lire au moteur la forme écrite puis la forme voulue et compare la durée des deux audios.
 * Durées égales ⇒ le moteur prononçait déjà correctement ⇒ la règle n'existe pas ici.
 *
 * C'est la consigne posée en tête de `speechText.ts` : ne rien ajouter sans le mesurer,
 * parce que le moteur neural normalise déjà énormément de choses et qu'une règle « au cas
 * où » est du code mort qui finit par nuire.
 *
 * CE QUE LE MOTEUR FAIT DÉJÀ BIEN — mesuré, aucune règle à écrire, ne pas « corriger » :
 *
 *   n° 6, no 6, « Objet no : »    → « numéro »   (Crom aplatit n° en « no », c'est lu juste)
 *   etc.                          → « et cetera »
 *   08/07/2022, 16/7/1950         → « 8 juillet 2022 »
 *   16h20, 23 h 05                → « 16 heures 20 »
 *   1er, 3ème, 45e                → « premier », « troisième », « quarante-cinquième »
 *   XIXe siècle, Classe II        → « dix-neuvième », « classe deux »
 *   5 m, 20 cm, 100 km, 40 m²     → mètres, centimètres, kilomètres, mètres carrés
 *   35 °C, 50 %, 30 min, 12 kg    → degrés Celsius, pour cent, minutes, kilogrammes
 *   219 308 784, 2,5              → lus comme des nombres, pas par tranches
 *   SCP, PCS, CMO, GdI, ACS, MTF  → déjà épelés lettre par lettre
 *   RAISA, ONU                    → lus comme des mots, ce qui est l'usage correct
 *
 * Le lot « nombres » d'origine aurait donc été presque entièrement du code mort : sur 21
 * sondes numériques, 18 se sont révélées inutiles.
 *
 * DEUX QUESTIONS TRANCHÉES, pour qu'on ne les rouvre pas :
 *
 *  · Le signe moins. « maintenu à -7 °C » est lu « moins 7 degrés Celsius », correctement.
 *    Le tiret orphelin d'une énumération (« Sites 15, -43, -87 ») est en revanche lu
 *    « tiret ». Aucune règle : le corpus ne contient que 11 cas d'énumération, dont un vrai
 *    négatif (« -64.███° N, -140.███° E »), et se tromper de sens coûte un contresens.
 *
 *  · RAISA et ONU sont lus comme des mots, pas épelés. C'est l'usage, on n'y touche pas —
 *    contrairement à FIM, dont la lecture en « fim » est fautive.
 *
 * LOT ACS — le bloc « ALIGNEMENT RATIONNEL : A=Y » de scp-5145 (règles dans speechText.ts,
 * sondes « acs/ »), mesuré sur Rémy puis les douze voix :
 *
 *   « A=Y »       → « A égale Y » (3,9 %) : le moteur fait une pause au signe sans le dire.
 *   « COTE : -6 » → « Cote : moins 6 » (15,6 %) : après un deux-points, le tiret sort
 *                   « tiret » (3,1 % d'écart avec cette forme) et le signe est perdu pour
 *                   l'auditeur. Cohérent avec la question tranchée ci-dessus : sans
 *                   deux-points le moteur dit déjà « moins », on n'y touche pas.
 *   « +0/-0 »     → « plus 0, moins 0 » (15,3 %) : le slash n'est pas prononçable.
 *   IAA           → épelé (12,6 %), voir SPELL_OUT_ACRONYMS : la casse ne change rien
 *                   (« IAA » ≡ « Iaa », octets identiques), le dégât venait d'amont.
 *   « Description » : non mesurable par cette méthode — le mot est identique en anglais et
 *                   la sonde compare des longueurs, pas des langues. Le deux-points manquant
 *                   est réglé côté parsing (« Description : » conservé) ; l'accent anglais
 *                   éventuel sur le mot reste à l'écoute manuelle, les en-têtes passant par
 *                   les voix natives (Rémy/Vivienne).
 *
 * Sur les douze voix, ces règles divergent partout sauf quelques voix qui lisaient déjà
 * juste : « égale » (5 voix sur 12), « I A A » (Hyunsu seule), le tiret de « -6 » (4 voix).
 * Appliquées à toutes : un verdict « déjà lu » produit le même audio chez ces voix-là,
 * donc la forme développée ne leur coûte rien et corrige les autres.
 *
 * UNE MESURE SUR RÉMY NE VAUT PAS POUR LES DOUZE VOIX. Le catalogue français ne compte que
 * deux voix nativement françaises ; les dix autres sont multilingues et ne se comportent
 * pas pareil. `probe-speech.mjs --voices` rejoue la table sur les douze et a montré que
 * « Dr », « Dre », « Lt », « Mme » et « Col. » — écartés d'après Rémy seul — sont mal lus
 * par une partie du catalogue. Ces règles sont depuis appliquées à toutes les voix : un
 * verdict « déjà lu » signifie que les deux formes produisent le même audio, donc écrire la
 * forme développée ne coûte rien à celles qui savaient déjà et corrige les autres.
 *
 * LOT TABLEAUX — valeurs aplaties par CROM (règle dans speechText.ts, sondes « tableaux/ »),
 * mesuré sur Rémy puis les douze voix :
 *
 *   « N/A »  → « sans objet » : choix de clarté lexicale, pas une correction de défaut.
 *              Le moteur lit « N/A » substantiellement (jamais « na ») : Rémy 3,19 s contre
 *              3,10 s pour « sans objet » — la règle est à coût quasi nul. Sur les douze
 *              voix, l'écart diverge chez 7 (contextuel) à 9 (isolé) d'entre elles et est
 *              « déjà lu » chez les autres : appliquée partout, la forme développée ne
 *              coûte rien à celles qui savaient déjà et unifie la lecture. Restreinte au
 *              français : « N/A » se dit « N A » en anglais, forme usuelle là-bas.
 *
 *   E-mail   → pas de règle. L'adresse écrite (« stacy.steele@site-115.scp ») sort PLUS
 *              LONGUE que sa forme développée « point/arrobase » (5,09 s contre 4,66 s sur
 *              Rémy) : le moteur lit déjà l'adresse en entier, à son rythme.
 *
 * LOT TERMINAL — saisies d'une session SCiPNET (SCP-2317 ; règles dans speechText.ts, sondes
 * « terminal/ »). Mesuré sur la forme qui SORT de la normalisation, qui retirait déjà « ^ »
 * et « | » : c'est ce reste qui atteint le moteur. Rémy, puis les douze voix.
 *
 *   « Je^H^H Ne… »   → « Je Ne… » : devenu « Je H H », le H est épelé (12,4 % ; 10,1 % sur
 *                      « le e^H mArin »). Divergent sur les douze voix. Le marqueur est
 *                      retiré sans simuler l'effacement : les comptes de ^H ne
 *                      correspondent pas au texte traduit.
 *   « a@@b.scp »     → « a@b.scp » : l'arobase doublée est dite deux fois (7,2 %, douze voix).
 *   « 329-765-1029-007 » → pas de règle. Le tiret n'est pas prononcé (« 329 tiret 765… »
 *                      est 10,8 % plus long) ; la forme espacée, plus courte de 3,7 %, n'est
 *                      pas une cible : en français l'espace groupe les milliers.
 */

/** Résultat d'une sonde, cité en regard de chaque règle pour qu'on puisse la contester. */
type Mesure = string;

export interface AbbreviationRule {
  /** Motif appliqué au texte prononcé. */
  pattern: RegExp;
  /** Remplacement (syntaxe `String.replace`). */
  replacement: string;
  /** Écart de durée mesuré entre la forme écrite et la forme voulue. */
  mesure: Mesure;
}

/**
 * Abréviations que le moteur épelle ou tronque au lieu de les développer.
 *
 * Les frontières sont écrites en classes Unicode explicites : en JavaScript `\b` est ASCII,
 * donc `/\bDir\./` ne se déclenche pas après un caractère accentué (piège documenté en tête
 * de `speechText.ts`).
 *
 * Toutes exigent au moins DEUX lettres derrière l'abréviation. Le corpus contient des
 * centaines d'initiales caviardées — « Dir. Jonathan A. King », « Dr F████ » — où la lettre
 * seule doit rester épelée : c'est un nom, pas un mot tronqué.
 *
 * CASSE. Ces motifs sont appliqués APRÈS la mise en casse de phrase, donc un « DR » du wiki
 * leur arrive en « Dr » — d'où l'insensibilité à la casse. Deux exceptions, où la minuscule
 * désigne autre chose que le titre :
 *
 *   `M.`    en minuscule, « m. » est une unité de longueur → « Monsieur » serait pire
 *   `Col.`  « col » est un mot français : « au bord du col. Le sujet… » deviendrait
 *           « au bord du Colonel Le sujet… »
 */
export const ABBREVIATIONS_FR: AbbreviationRule[] = [
  // Ces cinq-là avaient d'abord été écartés : mesurés sur Rémy seul, ils sortaient « déjà
  // lus ». Le balayage des douze voix du catalogue (`probe-speech.mjs --voices`) dit autre
  // chose — « Dr » n'est développé que par 9 voix sur 12, « Mme » par 11, « Lt » par 9.
  // Les dix voix non nativement françaises ne se comportent pas comme Rémy.
  //
  // Insensibles à la casse (sauf Col.) : appliquées APRÈS la mise en casse de phrase, elles
  // rencontrent « dr » là où le wiki avait écrit « DR ». Aucune de ces formes n'est un mot
  // français, la confusion est donc impossible.
  //
  // La règle est appliquée à TOUTES les voix, et non conditionnée à l'une d'elles : un
  // verdict « déjà lu » signifie précisément que les deux formes produisent le même audio,
  // donc écrire la forme développée ne change rien pour ces voix-là et corrige les autres.
  { pattern: /(^|[^\p{L}\p{N}])Dre\.?(?=\s+\p{L}{2})/giu, replacement: '$1Docteure', mesure: '3 voix sur 12' },
  { pattern: /(^|[^\p{L}\p{N}])Dr\.?(?=\s+\p{L}{2})/giu, replacement: '$1Docteur', mesure: '3 voix sur 12' },
  { pattern: /(^|[^\p{L}\p{N}])Lt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Lieutenant', mesure: '3 voix sur 12' },
  { pattern: /(^|[^\p{L}\p{N}])Mme\.?(?=\s+\p{L}{2})/giu, replacement: '$1Madame', mesure: '1 voix sur 12' },
  { pattern: /(^|[^\p{L}\p{N}])Mlle\.?(?=\s+\p{L}{2})/giu, replacement: '$1Mademoiselle', mesure: 'symétrie Mme' },
  // Sensible à la casse, contrairement à `Dir.` : « col » est un mot français courant, et
  // une fin de phrase comme « …au bord du col. Le sujet a chuté » deviendrait sinon
  // « …au bord du Colonel Le sujet a chuté ». La majuscule est ce qui distingue le grade.
  { pattern: /(^|[^\p{L}\p{N}])Col\.(?=\s+\p{L}{2})/gu, replacement: '$1Colonel', mesure: '10 voix sur 12' },

  { pattern: /(^|[^\p{L}\p{N}])Dir\.?(?=\s+\p{L}{2})/giu, replacement: '$1Directeur', mesure: '7,0 %' },
  { pattern: /(^|[^\p{L}\p{N}])Agt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Agent', mesure: '23,6 %' },
  { pattern: /(^|[^\p{L}\p{N}])Ca?pt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Capitaine', mesure: '16,1 %' },
  { pattern: /(^|[^\p{L}\p{N}])Prof\.(?=\s+\p{L}{2})/giu, replacement: '$1Professeur', mesure: '8,7 %' },
  { pattern: /(^|[^\p{L}\p{N}])Sgt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Sergent', mesure: '3,0 %' },
  // La négation écarte l'initiale d'un prénom qui suit un autre titre : dans « Dr. M. Husayn
  // Haykal » ou « le Dr M. King », le M est le prénom, pas « Monsieur ». Sans elle on
  // obtenait « Dr. Monsieur Husayn Haykal ». JavaScript accepte les lookbehind de longueur
  // variable, ce qui permet d'énumérer les titres au lieu de deviner sur la ponctuation.
  {
    pattern:
      /(^|[^\p{L}\p{N}])(?<!(?:Dr|Dre|Dir|Docteure?|Directeur|Prof|Professeure?|Agt|Agent|Capitaine|Lieutenant|Sergent|Colonel|Madame)\.?\s)M\.(?=\s+\p{L}{2})/gu,
    replacement: '$1Monsieur',
    mesure: '2,5 %'
  },
  // « MacCarthy Jr. » : 18,8 %. Suit un nom propre, donc pas de lettre exigée derrière.
  { pattern: /(?<=\p{L})\s+Jr\.?(?=$|[^\p{L}\p{N}])/giu, replacement: ' Junior', mesure: '18,8 %' },
  { pattern: /(^|[^\p{L}\p{N}])cf\.(?=\s)/giu, replacement: '$1voir', mesure: '9,6 %' },
  { pattern: /(^|[^\p{L}\p{N}])p\.\s?ex\./giu, replacement: '$1par exemple', mesure: '10,4 %' },
  // « après 48h » sort en « quarante-huit hache ». Deux exclusions : « 16h20 » et « 23 h 05 »
  // sont DÉJÀ lus « seize heures vingt » — un chiffre après le h, collé ou espacé, signifie
  // que le moteur a reconnu une heure tout seul et qu'il ne faut surtout pas y toucher.
  { pattern: /(\d)\s?h(?![\p{L}\p{N}]|\s*\d)/gu, replacement: '$1 heures', mesure: '8,3 %' }
];

export const ABBREVIATIONS_EN: AbbreviationRule[] = [
  { pattern: /(^|[^\p{L}\p{N}])Dir\.?(?=\s+\p{L}{2})/giu, replacement: '$1Director', mesure: 'symétrie FR' },
  { pattern: /(^|[^\p{L}\p{N}])Agt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Agent', mesure: 'symétrie FR' },
  { pattern: /(^|[^\p{L}\p{N}])Capt\.(?=\s+\p{L}{2})/giu, replacement: '$1Captain', mesure: 'symétrie FR' },
  { pattern: /(^|[^\p{L}\p{N}])Prof\.(?=\s+\p{L}{2})/giu, replacement: '$1Professor', mesure: 'symétrie FR' },
  { pattern: /(^|[^\p{L}\p{N}])Sgt\.?(?=\s+\p{L}{2})/giu, replacement: '$1Sergeant', mesure: 'symétrie FR' },
  { pattern: /(?<=\p{L})\s+Jr\.?(?=$|[^\p{L}\p{N}])/giu, replacement: ' Junior', mesure: 'symétrie FR' }
];

/**
 * Sigles que le moteur lit comme un MOT alors qu'ils devraient être épelés.
 *
 * `KEEP_UPPERCASE` (speechText.ts) repose sur l'idée que les capitales suffisent à faire
 * épeler un sigle. La mesure dit le contraire : la casse seule ne change rien à la
 * prononciation, exactement comme pour les mots ordinaires. Ce qui décide, c'est que le
 * sigle forme ou non une syllabe prononçable.
 *
 * Contre-épreuve : « la FIM Bêta-2 » et « la fime Bêta-2 » produisent le même audio à 1 %
 * près — le moteur dit bien « fim ». À l'inverse « SCP-096 » et « Skeup-096 » diffèrent de
 * 6,3 %, donc SCP est déjà épelé et ne doit pas être touché.
 *
 * On n'inscrit ici que les sigles dont la lecture en mot est FAUTIVE. RAISA et ONU sont
 * aussi lus comme des mots (22,5 % et 12,4 % d'écart avec la forme épelée), mais c'est
 * l'usage français : les laisser tranquilles.
 *
 * IAA (Intelligences Artificielles Autonomes, bloc ACS) : 19 occurrences autonomes dans le
 * corpus, lues « ia » comme un mot — et la casse ne change rien (« IAA » ≡ « Iaa », octets
 * identiques). Il fallait donc le protéger aussi dans `KEEP_UPPERCASE` (speechText.ts),
 * sinon la mise en casse de phrase le dégradait en « Iaa » AVANT de passer ici. La forme
 * épelée diverge de 12,6 % de la forme brute : la règle change bien l'audio. « Yellow.iaa »
 * (minuscule, scp-706-fr) est un identifiant, épargné par la sensibilité à la casse.
 */
export const SPELL_OUT_ACRONYMS = ['FIM', 'FIS', 'IAA'];

/**
 * Glossaire de première occurrence.
 *
 * Un sigle épelé est correct mais opaque : « la F I M Bêta-2 est intervenue » ne dit rien à
 * qui découvre le dossier. Le développer partout serait pire — « Force d'Intervention
 * Mobile » revient 231 fois dans le corpus, ce serait assommant.
 *
 * On le développe donc UNE fois, à sa première apparition dans le dossier, puis on laisse
 * la forme courte. C'est ce que fait un rédacteur, et ce que fait un narrateur.
 *
 * Le calcul de « première occurrence » se fait une fois par dossier, dans `setScript`, et
 * non au fil de la lecture : le préchargement synthétise les segments dans le désordre, et
 * une décision qui dépendrait de l'ordre d'appel rendrait la clé de cache instable.
 *
 * Les développements viennent du lexique officiel de la branche francophone.
 */
export const GLOSSARY_FR: Record<string, string> = {
  FIM: "Force d'Intervention Mobile",
  PCS: 'Procédures de Confinement Spéciales',
  GdI: "Groupe d'Intérêt",
  GDI: "Groupe d'Intérêt",
  CMO: 'Coalition Mondiale Occulte',
  BSIA: 'Bureau de Surveillance des Individus Anormaux',
  EdDB: 'Église du Dieu Brisé',
  FCM: 'Fondation Caritative de la Manne',
  MCD: 'Marshall, Carter et Dark'
};

export const GLOSSARY_EN: Record<string, string> = {
  MTF: 'Mobile Task Force',
  GOI: 'Group of Interest',
  GOC: 'Global Occult Coalition',
  SCPS: 'Special Containment Procedures'
};

/**
 * Lettres grecques employées comme désignation d'unité (« FIM α-1 », « Ζ9-Cap »).
 *
 * Restreint aux emplois de désignation par `speechText.ts` : les passages de texte corrompu
 * du wiki en contiennent aussi, et là le charabia est voulu — le traduire reviendrait à
 * réparer un effet de style.
 */
export const GREEK_DESIGNATIONS: Record<string, string> = {
  Α: 'Alpha', α: 'Alpha',
  Β: 'Bêta', β: 'Bêta',
  Γ: 'Gamma', γ: 'Gamma',
  Δ: 'Delta', δ: 'Delta',
  Ε: 'Epsilon', ε: 'Epsilon',
  Ζ: 'Zêta', ζ: 'Zêta',
  Η: 'Êta', η: 'Êta',
  Θ: 'Thêta', θ: 'Thêta',
  Ι: 'Iota', ι: 'Iota',
  Κ: 'Kappa', κ: 'Kappa',
  Λ: 'Lambda', λ: 'Lambda',
  Μ: 'Mu', μ: 'Mu',
  Ν: 'Nu', ν: 'Nu',
  Ξ: 'Xi', ξ: 'Xi',
  Ο: 'Omicron', ο: 'Omicron',
  Π: 'Pi', π: 'Pi',
  Ρ: 'Rhô', ρ: 'Rhô',
  Σ: 'Sigma', σ: 'Sigma',
  Τ: 'Tau', τ: 'Tau',
  Υ: 'Upsilon', υ: 'Upsilon',
  Φ: 'Phi', φ: 'Phi',
  Χ: 'Chi', χ: 'Chi',
  Ψ: 'Psi', ψ: 'Psi',
  Ω: 'Oméga', ω: 'Oméga'
};

/**
 * Homoglyphes cyrilliques → latin.
 *
 * Le wiki en contient au milieu de mots latins (« Dr Аndrews » avec un А cyrillique, U+0410).
 * Le moteur bascule alors de langue en plein mot et le nom devient méconnaissable — 2,2 %
 * d'écart mesuré, pour un défaut bien plus audible que ce chiffre ne le suggère.
 *
 * Uniquement les paires réellement identiques à l'œil : convertir tout le cyrillique
 * casserait un dossier volontairement écrit en russe.
 */
export const CYRILLIC_HOMOGLYPHS: Record<string, string> = {
  А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O',
  Р: 'P', С: 'C', Т: 'T', У: 'Y', Х: 'X', Ѕ: 'S', І: 'I', Ј: 'J',
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', ѕ: 's', і: 'i', ј: 'j'
};

/**
 * Effet audio d'une didascalie.
 *
 * `extractStageDirections` (scriptParser) récolte depuis toujours les « (Pause) », « (rit) »,
 * « (murmure) », « (tousse) » et les range dans `segment.stageDirections`. Le lecteur les
 * affiche, le moteur ne les regardait jamais : ce sont pourtant des indications de JEU, la
 * seule chose du dossier qui dise explicitement comment une réplique doit être dite.
 *
 * On ne cherche pas à imiter un rire ou une toux — aucune voix de synthèse ne le fait
 * proprement. On applique ce que la didascalie implique de mesurable : du silence, un
 * volume, un débit.
 */
export interface StageEffect {
  /** Multiplicateur de débit appliqué par-dessus celui du rôle. */
  rate?: number;
  /** Décalage de volume, au format edge-tts. */
  volume?: string;
  /** Silence supplémentaire avant la réplique, en millisecondes. */
  pause?: number;
}

/**
 * Les frontières sont explicites : « rit » sans elles se déclencherait sur « écrit » et
 * « décrit », « cri » sur « écrit » et « décrire », ce qui ferait hurler des répliques
 * ordinaires.
 */
export const STAGE_DIRECTIONS: ReadonlyArray<{ motif: RegExp; effet: StageEffect }> = [
  { motif: /(?<![\p{L}])(?:pause|silence|un temps|beat)(?![\p{L}])/iu, effet: { pause: 700 } },
  {
    motif: /(?<![\p{L}])(?:murmur\w*|chuchot\w*|voix basse|whisper\w*|softly|apart[ée]|aside)(?![\p{L}])/iu,
    effet: { volume: '-25%', rate: 0.95 }
  },
  {
    motif: /(?<![\p{L}])(?:crie|crient|criant|cris|hurl\w*|shout\w*|yell\w*|scream\w*)(?![\p{L}])/iu,
    effet: { volume: '+18%', rate: 1.05 }
  },
  { motif: /(?<![\p{L}])(?:soupir\w*|sigh\w*|souffle)(?![\p{L}])/iu, effet: { pause: 400 } },
  { motif: /(?<![\p{L}])(?:rit|rient|riant|rire|laugh\w*|rican\w*|chuckl\w*)(?![\p{L}])/iu, effet: { pause: 350 } },
  { motif: /(?<![\p{L}])(?:tousse|toussant|cough\w*|racle)(?![\p{L}])/iu, effet: { pause: 300 } },
  { motif: /(?<![\p{L}])(?:lentement|slowly|h[ée]sit\w*|hesitat\w*)(?![\p{L}])/iu, effet: { rate: 0.92 } },
  { motif: /(?<![\p{L}])(?:rapidement|quickly|pr[ée]cipit\w*|h[âa]te)(?![\p{L}])/iu, effet: { rate: 1.08 } }
];

/**
 * Fusionne les effets de toutes les didascalies d'une réplique.
 *
 * Les débits se multiplient, les pauses s'additionnent, et le dernier volume nommé gagne :
 * « (murmure, hésitant) » doit être à la fois plus bas et plus lent.
 */
export function stageEffectFor(directions?: string[]): StageEffect {
  if (!directions || directions.length === 0) return {};

  const cumul: StageEffect = {};
  for (const direction of directions) {
    for (const { motif, effet } of STAGE_DIRECTIONS) {
      if (!motif.test(direction)) continue;
      if (effet.rate) cumul.rate = (cumul.rate ?? 1) * effet.rate;
      if (effet.volume) cumul.volume = effet.volume;
      if (effet.pause) cumul.pause = (cumul.pause ?? 0) + effet.pause;
    }
  }
  return cumul;
}

/**
 * Ce que le moteur prononce à la place d'un bloc caviardé, une fois `[censuré]` normalisé.
 *
 * Exporté parce que deux endroits en dépendent : la substitution dans `normalizeForSpeech`
 * et le découpage en parties de `speechEngine`, qui remplace ce texte par un bip. Les deux
 * doivent viser exactement la même chaîne.
 */
export const CENSORED_SPOKEN: Record<string, string> = {
  fr: 'donnée expurgée',
  en: 'redacted'
};
