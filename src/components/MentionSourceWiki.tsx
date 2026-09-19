import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useT } from '../i18n';

/**
 * La ligne « titre — page d'origine, sous licence CC BY-SA 3.0 ».
 *
 * Elle existait déjà, écrite en dur au bas de `CreditsDossier`. Elle est sortie ici
 * parce qu'un second endroit en a besoin : le répertoire d'entités affiche des
 * résumés **repris verbatim des annuaires du wiki** (`Entite.resume`, 418 sur 818
 * entités), et les affichait sans rien créditer — alors que ce texte est exactement
 * celui que la licence protège.
 *
 * Une seule formulation pour les deux, sans quoi elles auraient divergé.
 *
 * Utilisée par les deux vues, d'où sa place dans `src/components/`.
 */

interface MentionSourceWikiProps {
  /** Page d'origine sur le wiki — la source au sens de la licence. */
  url: string;
  /** Titre de la page citée, entre guillemets dans la mention. */
  titre: string;
  /**
   * Ce qui précède le titre. Par défaut rien : la mention commence par le titre.
   * Le répertoire d'entités s'en sert pour dire « Résumé repris de ».
   */
  intro?: string;
  className?: string;
}

export const MentionSourceWiki: React.FC<MentionSourceWikiProps> = ({
  url,
  titre,
  intro,
  className = ''
}) => {
  const t = useT();

  return (
  <p className={`text-xs text-texte-attenue leading-relaxed ${className}`}>
    {intro ? `${intro} ` : ''}{t('credits.citation', { titre })} —{' '}
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-texte"
    >
      {t('credits.pageOrigine')}
      <ExternalLink className="inline w-3 h-3 ml-0.5 align-[-1px]" aria-hidden="true" />
    </a>
    , {t('credits.publieeSous')}{' '}
    <a
      href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr"
      target="_blank"
      rel="noopener noreferrer license"
      className="underline underline-offset-2 hover:text-texte"
    >
      CC BY-SA 3.0
    </a>
    .
  </p>
  );
};
