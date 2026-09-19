import { CharacterRole } from '../types/audioRoleplay';

export type CharacterGender = 'male' | 'female';

export interface AssignedVoiceSignature {
  voiceId: string;
  pitch: string;
  rate: string;
  gender: CharacterGender;
  description: string;
}

// 1. CANONICAL SCP RESEARCHERS DATABASE
// Well-known personnel from English and French branches with established lore
export const CANONICAL_SCP_PERSONNEL: Record<string, { gender: CharacterGender; note: string }> = {
  // FEMALE SCIENTISTS & DIRECTORS
  'rights': { gender: 'female', note: 'Dr. Agatha Rights - Psychologue et biologiste en chef' },
  'agatha rights': { gender: 'female', note: 'Dr. Agatha Rights' },
  'light': { gender: 'female', note: 'Dr. Sophia Light - Directrice de Site, biologiste' },
  'sophia light': { gender: 'female', note: 'Dr. Sophia Light' },
  'elliott': { gender: 'female', note: 'Dr. Chelsea Elliott - Biologiste d\'anomalies' },
  'chelsea elliott': { gender: 'female', note: 'Dr. Chelsea Elliott' },
  'low': { gender: 'female', note: 'Dr. Judith Low - Département d\'Ésotérisme et Théologie' },
  'judith low': { gender: 'female', note: 'Dr. Judith Low' },
  'lillihammer': { gender: 'female', note: 'Dr. Lillian Lillihammer - Mémétique et antimémétique' },
  'lillian lillihammer': { gender: 'female', note: 'Dr. Lillian Lillihammer' },
  'moose': { gender: 'female', note: 'Dr. Tilda Moose - Directrice du Site-19' },
  'tilda moose': { gender: 'female', note: 'Dr. Tilda Moose' },
  'maria jones': { gender: 'female', note: 'Maria Jones - Directrice du RAISA' },
  'sinclair': { gender: 'female', note: 'Dr. Katherine Sinclair - Spécialiste occulte Site-87' },
  'katherine sinclair': { gender: 'female', note: 'Dr. Katherine Sinclair' },
  'ward': { gender: 'female', note: 'Dr. Zara Ward - Analyste cinétique' },
  'zara ward': { gender: 'female', note: 'Dr. Zara Ward' },
  'stuart': { gender: 'female', note: 'Dr. Laura Stuart - Chercheuse en chef' },
  'everwood': { gender: 'female', note: 'Dr. Justine Everwood - Analyste' },
  'hirsch': { gender: 'female', note: 'Dr. Evelyn Hirsch - Directrice adjointe' },
  'gryffon': { gender: 'female', note: 'Dre Julie Gryffon - Branche Francophone' },
  'julie gryffon': { gender: 'female', note: 'Dre Julie Gryffon' },
  'hiver': { gender: 'female', note: 'Dre Karen Hiver - Psychologue Branche Francophone' },
  'karen hiver': { gender: 'female', note: 'Dre Karen Hiver' },
  'delacroix': { gender: 'female', note: 'Chercheuse Marie Delacroix' },
  'neru': { gender: 'female', note: 'Chercheuse Hina Neru' },
  'hina neru': { gender: 'female', note: 'Chercheuse Hina Neru' },

  // MALE SCIENTISTS & DIRECTORS
  'bright': { gender: 'male', note: 'Dr. Jack Bright - Chercheur immortel SCP-963' },
  'jack bright': { gender: 'male', note: 'Dr. Jack Bright' },
  'clef': { gender: 'male', note: 'Dr. Alto Clef - Spécialiste des réalités et humanoïdes' },
  'alto clef': { gender: 'male', note: 'Dr. Alto Clef' },
  'gears': { gender: 'male', note: 'Dr. Charles Gears - Scientifique logique et impassible' },
  'charles gears': { gender: 'male', note: 'Dr. Charles Gears' },
  'kondraki': { gender: 'male', note: 'Dr. Benjamin Kondraki - Responsable Site-17' },
  'benjamin kondraki': { gender: 'male', note: 'Dr. Benjamin Kondraki' },
  'hamm': { gender: 'male', note: 'Dr. Raymond Hamm - Interrogateur originel de SCP-049' },
  'raymond hamm': { gender: 'male', note: 'Dr. Raymond Hamm' },
  'dan': { gender: 'male', note: 'Dr. Dan - Responsable du protocole SCP-096' },
  'mann': { gender: 'male', note: 'Dr. Everett Mann - Neurochirurgien' },
  'everett mann': { gender: 'male', note: 'Dr. Everett Mann' },
  'glass': { gender: 'male', note: 'Dr. Simon Glass - Psychologue en chef' },
  'simon glass': { gender: 'male', note: 'Dr. Simon Glass' },
  'sherman': { gender: 'male', note: 'Dr. Theron Sherman - Chercheur de confinement' },
  'theron sherman': { gender: 'male', note: 'Dr. Theron Sherman' },
  'king': { gender: 'male', note: 'Dr. Jonathan King - Chercheur spécialiste' },
  'jonathan king': { gender: 'male', note: 'Dr. Jonathan King' },
  'cimmerian': { gender: 'male', note: 'Dr. Michael Cimmerian - Comité d\'éthique' },
  'michael cimmerian': { gender: 'male', note: 'Dr. Michael Cimmerian' },
  'iceberg': { gender: 'male', note: 'Dr. Iceberg - Adjoint du Dr. Gears' },
  'gerald': { gender: 'male', note: 'Dr. Gerald - Chercheur assistant' },
  'wettle': { gender: 'male', note: 'Dr. William Wettle - Spécialiste de la probabilité' },
  'mcdoctorate': { gender: 'male', note: 'Dr. Placeholder McDoctorate' },
  'bridge': { gender: 'male', note: 'Dr. Django Bridge - Archiviste en chef' },
  'django bridge': { gender: 'male', note: 'Dr. Django Bridge' },
  'shaw': { gender: 'male', note: 'Dr. Elias Shaw' },
  'von hanz': { gender: 'male', note: 'Dr. Johannes Von Hanz - Branche Francophone' },
  'johannes von hanz': { gender: 'male', note: 'Dr. Johannes Von Hanz' },
  'macro': { gender: 'male', note: 'Dr. Macro - Branche Francophone' },
  'grym': { gender: 'male', note: 'Dr. Grym - Branche Francophone' },
  'neremsa': { gender: 'male', note: 'Dr. Neremsa - Branche Francophone' },
  'frog': { gender: 'male', note: 'Dr. Frog - Branche Francophone' }
};

// 2. EXTENSIVE FIRST NAMES DICTIONARY (FRENCH & INTERNATIONAL)
const FEMALE_FIRST_NAMES = new Set([
  'sophia', 'agatha', 'marie', 'julie', 'sarah', 'sara', 'emma', 'claire', 'laura', 'katherine',
  'elizabeth', 'elena', 'sophie', 'camille', 'lea', 'chloe', 'manon', 'alice', 'juliette', 'charlotte',
  'pauline', 'mathilde', 'lucie', 'marine', 'justine', 'elise', 'amelie', 'audrey', 'celine', 'helen',
  'helene', 'karen', 'valerie', 'caroline', 'delphine', 'emilie', 'anne', 'marion', 'catherine', 'isabelle',
  'natacha', 'natalie', 'nathalie', 'stephanie', 'sandrine', 'virginie', 'christine', 'laurence', 'sylvie',
  'patricia', 'martine', 'monique', 'nicole', 'francoise', 'rachel', 'jessica', 'emily', 'ashley', 'amanda',
  'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'cynthia', 'kathleen', 'amy', 'shirley', 'angela',
  'anna', 'brenda', 'pamela', 'nicole', 'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn',
  'janet', 'maria', 'heather', 'diane', 'virginia', 'julie', 'joyce', 'victoria', 'olivia', 'kelly',
  'christina', 'lauren', 'joan', 'evelyn', 'judith', 'megan', 'cheryl', 'andrea', 'hannah', 'martha',
  'jacqueline', 'frances', 'ann', 'gloria', 'jean', 'kathryn', 'alice', 'teresa', 'sara', 'janice',
  'doris', 'madison', 'julia', 'grace', 'judy', 'abigail', 'marie', 'denise', 'beverly', 'amber',
  'theresa', 'marilyn', 'danielle', 'diana', 'brittany', 'natalie', 'sophia', 'rose', 'isabella', 'alexis',
  'kayla', 'charlotte', 'zoe', 'chloe', 'lily', 'eleanor', 'maya', 'eva', 'clara', 'beatrice', 'hina'
]);

const MALE_FIRST_NAMES = new Set([
  'raymond', 'jack', 'charles', 'alexandre', 'jean', 'pierre', 'thomas', 'nicolas', 'julien', 'david',
  'michael', 'john', 'robert', 'william', 'james', 'daniel', 'paul', 'mark', 'antoine', 'gabriel',
  'lucas', 'louis', 'hugo', 'arthur', 'jules', 'leo', 'maxime', 'simon', 'clement', 'romain',
  'benjamin', 'adrien', 'vincent', 'mathieu', 'florent', 'sebastien', 'guillaume', 'kevin', 'anthony', 'samuel',
  'etienne', 'francois', 'frederic', 'laurent', 'stephane', 'christophe', 'eric', 'philippe', 'alain', 'michel',
  'christian', 'bernard', 'richard', 'joseph', 'charles', 'matthew', 'anthony', 'donald', 'steven', 'andrew',
  'joshua', 'kenneth', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey',
  'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
  'brandon', 'frank', 'benjamin', 'gregory', 'samuel', 'raymond', 'patrick', 'alexander', 'jack', 'dennis',
  'jerry', 'tyler', 'aaron', 'jose', 'henry', 'douglas', 'adam', 'peter', 'nathan', 'zachary',
  'walter', 'kyle', 'harold', 'carl', 'jeremy', 'keith', 'roger', 'gerald', 'ethan', 'arthur',
  'terry', 'christian', 'sean', 'lawrence', 'austin', 'joe', 'noah', 'jesse', 'albert', 'billy',
  'bruce', 'willie', 'jordan', 'dylan', 'alan', 'ralph', 'gabriel', 'roy', 'juan', 'wayne',
  'eugene', 'logan', 'randy', 'louis', 'russell', 'vincent', 'philip', 'bobby', 'johnny', 'bradley',
  'alto', 'theron', 'everett', 'elias', 'django', 'johannes', 'mario'
]);

// 3. FRENCH AND ENGLISH NEURAL VOICE POOLS FOR RESEARCHERS
/**
 * Pools de timbres attribués aux personnages nommés (un Dr Untel = toujours la même voix).
 *
 * Uniquement des voix « Multilingual » : les Neural de première génération ont été retirées
 * du projet. Le décalage de hauteur et de débit propre à chaque entrée reste le principal
 * outil de différenciation, puisque le vivier français natif se limite à deux voix.
 *
 * Hyunsu (ko-KR), Giuseppe (it-IT) et Thalita (pt-BR) ont été retirées des pools : leur
 * coloration d'origine dominait la lecture du français. Elles restent au catalogue et
 * sélectionnables dans le studio des voix.
 */
const FEMALE_RESEARCHER_VOICES_FR = [
  { id: 'fr-FR-VivienneMultilingualNeural', basePitch: '+0Hz', baseRate: '+0%', desc: 'Enveloppante, nette et experte' },
  { id: 'en-US-AvaMultilingualNeural', basePitch: '-2Hz', baseRate: '+0%', desc: 'Calculée, froide et méthodique' },
  { id: 'en-US-EmmaMultilingualNeural', basePitch: '+2Hz', baseRate: '+2%', desc: 'Observatrice, claire et clinique' },
  { id: 'de-DE-SeraphinaMultilingualNeural', basePitch: '-4Hz', baseRate: '-2%', desc: 'Posée, grave et protocolaire' }
];

const MALE_RESEARCHER_VOICES_FR = [
  { id: 'fr-FR-RemyMultilingualNeural', basePitch: '+0Hz', baseRate: '+2%', desc: 'Naturel, éloquent et scientifique' },
  { id: 'en-US-AndrewMultilingualNeural', basePitch: '+2Hz', baseRate: '+3%', desc: 'Curieux, engagé et analytique' },
  { id: 'en-US-BrianMultilingualNeural', basePitch: '-3Hz', baseRate: '+0%', desc: 'Chaleureux, assuré et posé' },
  { id: 'en-AU-WilliamMultilingualNeural', basePitch: '+4Hz', baseRate: '+3%', desc: 'Rugueux, direct et tendu' },
  { id: 'de-DE-FlorianMultilingualNeural', basePitch: '-8Hz', baseRate: '-2%', desc: 'Grave, ferme et autoritaire' }
];

const FEMALE_RESEARCHER_VOICES_EN = [
  { id: 'en-US-AvaNeural', basePitch: '-2Hz', baseRate: '+0%', desc: 'Stern, calculated senior scientist' },
  { id: 'en-US-JennyNeural', basePitch: '+2Hz', baseRate: '+2%', desc: 'Clear, articulate researcher' },
  { id: 'en-US-EmmaNeural', basePitch: '+0Hz', baseRate: '+0%', desc: 'Observant, clinical analyst' },
  { id: 'en-GB-SoniaNeural', basePitch: '-2Hz', baseRate: '-2%', desc: 'Refined, methodical specialist' }
];

const MALE_RESEARCHER_VOICES_EN = [
  { id: 'en-US-GuyNeural', basePitch: '+0Hz', baseRate: '+2%', desc: 'Articulate, calm scientist' },
  { id: 'en-US-ChristopherNeural', basePitch: '-6Hz', baseRate: '-2%', desc: 'Authoritative, classified tone' },
  { id: 'en-US-AndrewNeural', basePitch: '+3Hz', baseRate: '+4%', desc: 'Inquisitive field researcher' },
  { id: 'en-GB-ThomasNeural', basePitch: '-2Hz', baseRate: '+0%', desc: 'Proper British lab director' }
];

// Hash function to deterministically map a string to an integer
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const characterVoiceService = {
  /**
   * Determine gender of a speaker through 4-stage pipeline:
   * 1. Canonical lore database check
   * 2. Linguistic and title markers (Dre, Chercheuse, Mme vs Dr, Chercheur, M.)
   * 3. First name extraction & dictionary lookup
   * 4. Contextual pronoun scan in full document
   */
  detectGender(speakerName: string, fullContextText: string = ''): CharacterGender {
    const raw = speakerName.trim();
    const lower = raw.toLowerCase();

    // Stage 1: Explicit female linguistic markers in title
    if (
      lower.startsWith('dre') ||
      lower.includes('doctoresse') ||
      lower.includes('chercheuse') ||
      lower.includes('interrogatrice') ||
      lower.includes('directrice') ||
      lower.includes('mme') ||
      lower.includes('madame') ||
      lower.includes('(f)') ||
      lower.includes('(femme)') ||
      lower.includes('(female)')
    ) {
      return 'female';
    }

    // Stage 2: Canonical SCP Personnel Database
    // Check if canonical surname is in speakerName
    for (const [key, info] of Object.entries(CANONICAL_SCP_PERSONNEL)) {
      if (lower.includes(key)) {
        return info.gender;
      }
    }

    // Stage 3: First name extraction from speaker name
    // e.g., "Dr Raymond Hamm" -> words: ["dr", "raymond", "hamm"]
    const cleanTokens = lower
      .replace(/[^a-zà-ÿ\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && t !== 'the' && t !== 'pour' && t !== 'sur');

    for (const token of cleanTokens) {
      if (FEMALE_FIRST_NAMES.has(token)) {
        return 'female';
      }
      if (MALE_FIRST_NAMES.has(token)) {
        return 'male';
      }
    }

    // Stage 4: Contextual co-reference scan in full document
    // If the speaker name appears in context, check for nearby pronouns (elle/she vs il/he)
    if (fullContextText && cleanTokens.length > 0) {
      const surname = cleanTokens[cleanTokens.length - 1];
      if (surname.length >= 3) {
        const regex = new RegExp(`(?:dr|docteur|chercheur[se]*|dre)?\\s*${surname}[^.!?]{0,100}?\\b(elle|la\\s+chercheuse|she|her|il|le\\s+chercheur|he|him)\\b`, 'i');
        const match = fullContextText.match(regex);
        if (match) {
          const pronoun = match[1].toLowerCase();
          if (pronoun.startsWith('elle') || pronoun.startsWith('she') || pronoun.startsWith('her') || pronoun.includes('la')) {
            return 'female';
          }
          if (pronoun.startsWith('il') || pronoun.startsWith('he') || pronoun.startsWith('him') || pronoun.includes('le')) {
            return 'male';
          }
        }
      }
    }

    // Default to male for traditional "Dr" / "Agent" if unresolvable, but preserves high accuracy
    return 'male';
  },

  /**
   * Generates a unique, deterministic, consistent voice signature for ANY scientist
   * Even across hundreds of different doctors, each doctor receives their OWN persistent voice!
   */
  getScientistVoiceSignature(
    speakerName: string,
    languageCode: string = 'fr',
    fullContextText: string = ''
  ): AssignedVoiceSignature {
    const gender = this.detectGender(speakerName, fullContextText);
    const hash = hashString(speakerName.toLowerCase().trim());

    if (languageCode === 'en') {
      const pool = gender === 'female' ? FEMALE_RESEARCHER_VOICES_EN : MALE_RESEARCHER_VOICES_EN;
      const base = pool[hash % pool.length];

      // Procedural pitch variation (-12Hz to +12Hz) based on speaker name hash
      const pitchMod = (hash % 9) - 4; // -4 to +4
      const rateMod = ((hash % 7) - 3) * 2; // -6% to +6%

      const sign = pitchMod >= 0 ? `+${pitchMod}` : `${pitchMod}`;
      const rateSign = rateMod >= 0 ? `+${rateMod}%` : `${rateMod}%`;

      return {
        voiceId: base.id,
        pitch: `${sign}Hz`,
        rate: rateSign,
        gender,
        description: base.desc
      };
    }

    // French pool
    const pool = gender === 'female' ? FEMALE_RESEARCHER_VOICES_FR : MALE_RESEARCHER_VOICES_FR;
    const base = pool[hash % pool.length];

    // Calculate subtle pitch offset to distinguish Dr. Hamm from Dr. Sherman even if using same base voice
    const pitchOffsetNum = ((hash % 11) - 5) * 2; // -10Hz, -8Hz, ... +10Hz
    const pitchStr = pitchOffsetNum >= 0 ? `+${pitchOffsetNum}Hz` : `${pitchOffsetNum}Hz`;
    const rateOffsetNum = ((hash % 5) - 2) * 2; // -4%, -2%, 0, +2%, +4%
    const rateStr = rateOffsetNum >= 0 ? `+${rateOffsetNum}%` : `${rateOffsetNum}%`;

    return {
      voiceId: base.id,
      pitch: pitchStr,
      rate: rateStr,
      gender,
      description: `${base.desc} (Timbre unique assigné)`
    };
  }
};

/**
 * Titles that introduce a person, in both branches.
 *
 * The leading letter is explicitly case-tolerant rather than relying on the `i` flag: the
 * name tokens that follow MUST stay case-sensitive (they are matched with \p{Lu}), and a
 * global `i` would make every lowercase word look like a name. SCP-5618 depends on this —
 * it writes "le chercheur Zorić" in lowercase.
 */
const PERSON_TITLES =
  '(?:[Dd]re?|[Dd]octeure?|[Dd]octoresse|[Cc]hercheu(?:r|se)|[Aa]gente?|[Dd]irect(?:eur|rice)|[Pp]rofesseure?|[Ss]uperviseure?|[Rr]esearcher|[Dd]octor|[Dd]irector)';

/**
 * Resolve initial-signatures — the "[AF]" / "[SZ]" that annotated dossiers append to
 * marginal notes — to the person they stand for, using only what the document itself says.
 *
 * Why this is needed: a note signed "[SZ]" carries no name, so gender detection has nothing
 * to work with and every annotator ends up with the same default voice. Resolving the
 * initials to "chercheur Stephen Zorić" lets the EXISTING detectGender pipeline do its job —
 * no per-article hardcoding, and it works for any dossier using this convention.
 *
 * Two matching strategies, because the full name is often never written in one piece:
 *   1. A titled mention whose two name initials match  ("Dr Alice Forth" → AF).
 *   2. A surname from a titled mention matching the SECOND initial, combined with a known
 *      first name elsewhere in the text matching the FIRST ("le chercheur Zorić" + "Stephen"
 *      → SZ). SCP-5618 needs this: "Stephen Zorić" never appears adjacently.
 *
 * Unresolvable signatures are simply omitted — callers keep their generic label. That keeps
 * organisation acronyms ("[ACS]", "[DAT]", "[FIM]") from being mistaken for people.
 */
export function resolveInitialSignatories(fullText: string): Map<string, string> {
  const resolved = new Map<string, string>();
  if (!fullText) return resolved;

  const signatures = new Set(
    [...fullText.matchAll(/\[([A-ZÀ-Þ]{2,3})\]/g)].map(m => m[1])
  );
  if (signatures.size === 0) return resolved;

  // Titled mentions: capture the title and up to two capitalised name tokens after it.
  // \p{Lu} / \p{L} rather than A-Z ranges: surnames carry diacritics outside Latin-1
  // ("Zorić", "Ojeda", "Głowa") and an ASCII class would truncate or skip them.
  const titled: Array<{ title: string; tokens: string[] }> = [];
  const titledRegex = new RegExp(
    `\\b(${PERSON_TITLES})\\.?\\s+(\\p{Lu}[\\p{L}'’\\-]+)(?:\\s+(\\p{Lu}[\\p{L}'’\\-]+))?`,
    'gu'
  );
  for (const m of fullText.matchAll(titledRegex)) {
    const tokens = [m[2], m[3]].filter(Boolean) as string[];
    if (tokens.length) titled.push({ title: m[1], tokens });
  }

  // Known first names actually present in this document.
  const firstNames = new Map<string, string>(); // initial -> name as written
  for (const m of fullText.matchAll(/\b(\p{Lu}[\p{Ll}'’\-]{2,})\b/gu)) {
    const word = m[1];
    const lower = word.toLowerCase();
    if (FEMALE_FIRST_NAMES.has(lower) || MALE_FIRST_NAMES.has(lower)) {
      const initial = word[0].toUpperCase();
      if (!firstNames.has(initial)) firstNames.set(initial, word);
    }
  }

  for (const sig of signatures) {
    if (sig.length !== 2) continue; // Only "First Last" initials are unambiguous enough.
    const [a, b] = [sig[0], sig[1]];

    // Strategy 1: a titled mention whose own initials match.
    const direct = titled.find(
      t =>
        t.tokens.length === 2 &&
        t.tokens[0][0].toUpperCase() === a &&
        t.tokens[1][0].toUpperCase() === b
    );
    if (direct) {
      resolved.set(sig, `${direct.title} ${direct.tokens.join(' ')}`);
      continue;
    }

    // Strategy 2: surname from a titled mention + a known first name found elsewhere.
    const bySurname = titled.find(t => {
      const surname = t.tokens[t.tokens.length - 1];
      return surname[0].toUpperCase() === b;
    });
    const firstName = firstNames.get(a);
    if (bySurname && firstName) {
      const surname = bySurname.tokens[bySurname.tokens.length - 1];
      resolved.set(sig, `${bySurname.title} ${firstName} ${surname}`);
    }
  }

  return resolved;
}
