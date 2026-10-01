import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useT } from '../i18n';

/**
 * Le dossier contient un programme (`estPageInteractive`) que la lecture ne restitue pas.
 *
 * SCP-3340, SCP-2212 ou SCP-280-JP écrivent leur texte par un script, au chargement de la
 * page : hors du navigateur il n'en reste rien, et le lecteur s'ouvrait sur les seuls
 * crédits sans qu'on sache pourquoi. Partagé par les deux vues.
 */
export const AvisPageInteractive: React.FC<{ url: string; className?: string }> = ({ url, className = '' }) => {
  const t = useT();
  return (
    <p
      role="note"
      className={`rounded border border-bordure bg-surface-1 px-3 py-2.5 text-sm text-texte-second leading-relaxed ${className}`}
    >
      {t('dossier.pageInteractive')}{' '}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 align-middle text-accent-texte underline underline-offset-4"
      >
        {t('dossier.sourceInfo')}
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </p>
  );
};
