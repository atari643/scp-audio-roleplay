import React from 'react';
import { AttributionScp } from '../types/scp';
import { MentionSourceWiki } from './MentionSourceWiki';

/**
 * Le pavé de crédits d'un dossier.
 *
 * Il n'est pas décoratif : le wiki SCP publie sous CC BY-SA 3.0, et la licence
 * exige quatre choses — le titre, la source, l'auteur et la licence. Le bouton
 * « Source » du lecteur couvre les trois premières ; l'auteur manquait, alors
 * que Crom le connaît. Sur une traduction, le traducteur ET l'auteur de
 * l'original doivent être cités, d'où la distinction ci-dessous.
 *
 * Affiché dans les deux lecteurs, d'où sa place dans `src/components/`.
 */

/** Les rôles que renvoie Crom, dits en français. */
const ROLES: Record<string, string> = {
  AUTHOR: 'Auteur',
  SUBMITTER: 'Publié par',
  TRANSLATOR: 'Traduction',
  REWRITE: 'Réécriture',
  CONTRIBUTOR: 'Contribution',
  MAINTAINER: 'Maintenance'
};

interface CreditsDossierProps {
  attributions?: AttributionScp[];
  /** Page d'origine sur le wiki — la source au sens de la licence. */
  url: string;
  titre: string;
  className?: string;
}

export const CreditsDossier: React.FC<CreditsDossierProps> = ({
  attributions,
  url,
  titre,
  className = ''
}) => {
  const credits = attributions ?? [];

  return (
    <section
      className={`rounded border border-bordure-faible bg-surface-1/60 px-3 py-2.5 ${className}`}
      aria-label="Crédits et licence du dossier"
    >
      <p className="font-mono text-xs uppercase tracking-technique text-texte-attenue mb-1.5">
        Crédits
      </p>

      {credits.length > 0 ? (
        <ul className="space-y-0.5 text-xs text-texte-second">
          {credits.map((credit) => (
            <li key={`${credit.nom}-${credit.type}-${credit.surOriginal ? 'o' : 'p'}`}>
              <span className="text-texte-attenue">
                {ROLES[credit.type] || credit.type}
                {credit.surOriginal ? " de l'original" : ''} :{' '}
              </span>
              <span className="font-medium text-texte">{credit.nom}</span>
            </li>
          ))}
        </ul>
      ) : (
        // Crom ne connaît pas toujours les crédits d'une page. Plutôt que de
        // laisser croire qu'il n'y a pas d'auteur, on renvoie à la page, qui
        // fait foi.
        <p className="text-xs text-texte-second">
          Crédits non renseignés dans l'index : ils figurent sur la page d'origine.
        </p>
      )}

      <MentionSourceWiki
        url={url}
        titre={titre}
        className="mt-2 pt-2 border-t border-bordure-faible"
      />
    </section>
  );
};
