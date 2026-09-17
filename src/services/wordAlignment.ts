/**
 * Faire correspondre ce qui est PRONONCÉ à ce qui est AFFICHÉ.
 *
 * Le service de synthèse renvoie une frontière par mot, avec son instant de départ. On
 * pourrait croire qu'il suffit de compter les mots pour surligner le texte à l'écran ; ce
 * n'est pas le cas, parce que les deux textes ne sont pas les mêmes. `normalizeForSpeech`
 * réécrit ce qui part au moteur, et l'écran garde la page du wiki telle quelle :
 *
 *   affiché   « Dir. Vemhoff »        prononcé  « Directeur Vemhoff »     1 mot → 1 mot
 *   affiché   « SCP-608-FR »          prononcé  « SCP 608 FR »            1 mot → 3 mots
 *   affiché   « ██████ »              prononcé  « donnée expurgée »       1 mot → 2 mots
 *   affiché   « [DÉBUT DE JOURNAL] »  prononcé  « Début de journal. »     mêmes mots
 *
 * L'alignement est donc MONOTONE et TOLÉRANT : on avance dans les deux listes en parallèle,
 * plusieurs mots prononcés peuvent retomber sur un seul mot affiché, et un mot qu'on ne
 * reconnaît pas ne fait pas dérailler la suite — on reste simplement sur place.
 *
 * C'est approximatif par construction. C'est assez juste pour suivre une lecture à l'œil,
 * et ça se dégrade doucement : au pire le surlignage prend un mot de retard, jamais il ne
 * part à l'autre bout du paragraphe.
 */

/** Un mot du texte affiché, avec sa position exacte pour pouvoir le découper au rendu. */
export interface DisplayWord {
  text: string;
  start: number;
  end: number;
}

/** Réduit un mot à sa forme comparable : minuscules, sans accents ni ponctuation. */
function simplify(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Découpe le texte affiché en mots, en gardant leurs bornes.
 *
 * Les bornes servent au rendu : le composant réinsère les espaces et la ponctuation entre
 * les mots plutôt que de les perdre.
 */
export function splitDisplayWords(text: string): DisplayWord[] {
  const mots: DisplayWord[] = [];
  const re = /[^\s]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    mots.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return mots;
}

/**
 * Pour chaque mot prononcé, l'indice du mot affiché correspondant.
 *
 * Trois issues à chaque étape, dans cet ordre :
 *  1. le mot affiché suivant correspond → on avance ;
 *  2. il correspond en préfixe dans un sens ou dans l'autre (« Dir. » ↔ « Directeur »,
 *     « SCP-608-FR » ↔ « SCP ») → on avance aussi ;
 *  3. rien ne correspond → on reste sur le mot courant, et le mot prononcé suivant retentera
 *     sa chance. C'est ce qui absorbe « SCP-608-FR » lu en trois mots.
 *
 * Une fenêtre de recherche limitée à trois mots permet de rattraper un mot ajouté par la
 * normalisation sans jamais sauter au loin.
 */
export function alignSpokenToDisplayed(spokenWords: string[], displayed: DisplayWord[]): number[] {
  const cibles = displayed.map(d => simplify(d.text));
  const indices: number[] = [];
  let curseur = 0;
  // Dernier mot affiché réellement reconnu. C'est LUI, et non le mot suivant, sur lequel se
  // rabattent les mots prononcés qu'on n'identifie pas : ces mots-là sont presque toujours
  // la suite d'une expansion (« SCP-608-FR » lu « SCP », « 608 », « FR »), donc ils
  // appartiennent encore au mot affiché qu'on vient de quitter. Se rabattre sur le suivant
  // faisait au contraire avancer le surlignage d'un cran à chaque code rencontré.
  let dernierReconnu = -1;

  for (const brut of spokenWords) {
    const mot = simplify(brut);
    if (!mot) {
      indices.push(dernierReconnu >= 0 ? dernierReconnu : 0);
      continue;
    }

    let trouve = -1;
    for (let d = 0; d < 3 && curseur + d < cibles.length; d++) {
      const cible = cibles[curseur + d];
      if (!cible) continue;
      if (cible === mot || cible.startsWith(mot) || mot.startsWith(cible)) {
        trouve = curseur + d;
        break;
      }
    }

    if (trouve >= 0) {
      indices.push(trouve);
      dernierReconnu = trouve;
      curseur = trouve + 1;
    } else {
      // Mot inconnu : on reste sur le dernier mot reconnu et on ne fait pas avancer le
      // curseur, pour que le mot prononcé suivant retente sa chance au même endroit.
      indices.push(dernierReconnu >= 0 ? dernierReconnu : Math.min(curseur, displayed.length - 1));
    }
  }

  return indices;
}

/**
 * Table prête à l'emploi pour le suivi de lecture : pour chaque frontière, l'instant de
 * départ et le mot affiché à surligner.
 */
export interface SpokenCue {
  time: number;
  wordIndex: number;
}

export function buildCues(
  boundaries: { offset: number; text: string }[],
  displayedText: string
): SpokenCue[] {
  if (boundaries.length === 0) return [];
  const mots = splitDisplayWords(displayedText);
  if (mots.length === 0) return [];

  const indices = alignSpokenToDisplayed(
    boundaries.map(b => b.text),
    mots
  );
  return boundaries.map((b, i) => ({ time: b.offset, wordIndex: indices[i] }));
}

/**
 * Quel mot est prononcé à cet instant ? Renvoie -1 avant le premier.
 *
 * Recherche dichotomique : appelée à chaque image d'animation pendant la lecture.
 */
export function wordIndexAt(cues: SpokenCue[], time: number): number {
  if (cues.length === 0 || time < cues[0].time) return -1;
  let bas = 0;
  let haut = cues.length - 1;
  while (bas < haut) {
    const milieu = Math.ceil((bas + haut) / 2);
    if (cues[milieu].time <= time) bas = milieu;
    else haut = milieu - 1;
  }
  return cues[bas].wordIndex;
}
