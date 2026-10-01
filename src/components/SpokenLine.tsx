import React, { useMemo } from 'react';
import { WikiLink, motifLibelle } from '../services/linkExtractor';
import { adresseDossier } from '../services/lienPartage';
import { splitDisplayWords } from '../services/wordAlignment';
import { useT } from '../i18n';

/**
 * Le texte d'une réplique, rendu mot à mot pour pouvoir suivre la lecture.
 *
 * Partagé par les deux vues : la ligne se rendait auparavant deux fois, une version dans
 * `ScpReader` (bureau) et une dans `MobileScpReader`, avec chacune sa gestion des liens et
 * des blocs caviardés. Les regrouper ici évite d'implémenter le surlignage deux fois et de
 * le voir diverger.
 *
 * Le découpage en mots suit exactement `splitDisplayWords`, celui-là même qui sert à
 * aligner les frontières de mots du moteur de synthèse : c'est ce qui garantit que
 * `activeWordIndex` désigne bien le mot que l'on entend.
 *
 * Liens et caviardages sont traités comme des DÉCORATIONS posées sur des plages de
 * caractères, pas comme un second découpage. Un découpage imbriqué ferait diverger la
 * numérotation des mots dès qu'un libellé de lien en contient plusieurs.
 */

interface Decoration {
  start: number;
  end: number;
  kind: 'link' | 'redacted';
  link?: WikiLink;
}

interface SpokenLineProps {
  text: string;
  links?: WikiLink[];
  /** Mot en cours de lecture, ou -1 quand ce n'est pas la réplique active. */
  activeWordIndex?: number;
  onEnqueueLink?: (link: WikiLink) => void;
  onOpenLink?: (link: WikiLink) => void;
}

const KIND_LABEL: Record<string, string> = {
  scp: 'Dossier SCP',
  tale: 'Conte',
  hub: 'Hub',
  external: 'Lien externe',
  other: 'Page du wiki'
};

const REDACTED = /\[(?:censuré|redacted|données\s*supprimées|donnée\s*censurée)\]/gi;

function buildDecorations(text: string, links?: WikiLink[]): Decoration[] {
  const decorations: Decoration[] = [];

  for (const m of text.matchAll(REDACTED)) {
    if (m.index === undefined) continue;
    decorations.push({ start: m.index, end: m.index + m[0].length, kind: 'redacted' });
  }

  if (links && links.length > 0) {
    // Les libellés longs d'abord : sans ça, « Site-120 » découperait
    // « Secure Facility Dossier: Site-120 » par le milieu.
    const ordered = [...links].sort((a, b) => b.label.length - a.label.length);
    for (const link of ordered) {
      for (const m of text.matchAll(motifLibelle(link.label))) {
        if (m.index === undefined || m[0].length === 0) continue;
        const start = m.index;
        const end = start + m[0].length;
        // Un libellé déjà couvert par une décoration plus longue est ignoré.
        if (decorations.some(d => start < d.end && end > d.start)) continue;
        decorations.push({ start, end, kind: 'link', link });
      }
    }
  }

  return decorations.sort((a, b) => a.start - b.start);
}

export const SpokenLine: React.FC<SpokenLineProps> = ({
  text,
  links,
  activeWordIndex = -1,
  onEnqueueLink,
  onOpenLink
}) => {
  const t = useT();
  const { words, decorations } = useMemo(
    () => ({ words: splitDisplayWords(text), decorations: buildDecorations(text, links) }),
    [text, links]
  );

  if (words.length === 0) return <>{text}</>;

  const noeuds: React.ReactNode[] = [];
  let i = 0;
  let curseurTexte = 0;

  while (i < words.length) {
    const mot = words[i];

    // L'espace et la ponctuation qui précèdent le mot sont réinsérés tels quels.
    if (mot.start > curseurTexte) {
      noeuds.push(text.slice(curseurTexte, mot.start));
    }

    const deco = decorations.find(d => mot.start < d.end && mot.end > d.start);

    if (!deco) {
      const actif = i === activeWordIndex;
      noeuds.push(
        <span key={`w${i}`} className={actif ? 'mot-lu' : undefined}>
          {mot.text}
        </span>
      );
      curseurTexte = mot.end;
      i++;
      continue;
    }

    // Tous les mots couverts par la même décoration sont rendus d'un bloc.
    let fin = i;
    while (fin + 1 < words.length && words[fin + 1].start < deco.end) fin++;
    const actif = activeWordIndex >= i && activeWordIndex <= fin;
    const contenu = text.slice(deco.start, deco.end);

    if (deco.kind === 'redacted') {
      noeuds.push(
        <span
          key={`r${i}`}
          className={`redacted-block mx-1${actif ? ' mot-lu' : ''}`}
          title={t('rp.caviarde')}
        >
          ██████
        </span>
      );
    } else if (deco.link && onEnqueueLink && onOpenLink) {
      const link = deco.link;
      const externe = link.kind === 'external';
      // Un vrai lien, avec une adresse : Ctrl+clic et clic molette l'ouvrent dans un
      // nouvel onglet, comme partout ailleurs. Sans adresse (cible qui n'est pas un slug
      // accepté à l'ouverture), le clic reste le seul chemin.
      const href = externe ? link.url || link.target : adresseDossier(link.target);
      const Balise = href ? 'a' : 'button';
      noeuds.push(
        <Balise
          key={`l${i}`}
          {...(href
            ? { href, ...(externe ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
            : { type: 'button' as const })}
          className={`wiki-link wiki-link--${link.kind}${actif ? ' mot-lu' : ''}`}
          title={
            externe
              ? `Lien externe : ${link.url || link.target}`
              : t('file.miseDeCote', { genre: KIND_LABEL[link.kind] || t('file.page'), cible: link.target })
          }
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            // Ctrl, Cmd ou Maj : le navigateur ouvre l'adresse lui-même.
            if (href && (e.ctrlKey || e.metaKey || e.shiftKey)) return;
            e.preventDefault();
            // Le clic OUVRE le dossier. Il le mettait de côté, dans la file « À suivre »
            // affichée en haut du dossier, hors de vue : on cliquait et rien ne se passait.
            if (e.altKey && !externe) onEnqueueLink(link);
            else onOpenLink(link);
          }}
          onContextMenu={(e: React.MouseEvent) => {
            if (externe) return;
            // Clic droit, ou appui long sur téléphone : mettre de côté sans couper l'écoute.
            e.preventDefault();
            e.stopPropagation();
            onEnqueueLink(link);
          }}
        >
          {contenu}
        </Balise>
      );
    } else {
      noeuds.push(
        <span key={`p${i}`} className={actif ? 'mot-lu' : undefined}>
          {contenu}
        </span>
      );
    }

    curseurTexte = Math.max(deco.end, words[fin].end);
    i = fin + 1;
  }

  if (curseurTexte < text.length) noeuds.push(text.slice(curseurTexte));

  return <>{noeuds}</>;
};
