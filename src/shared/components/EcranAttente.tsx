import React from 'react';
import { useT } from '../../i18n';

/**
 * Écran d'attente affiché pendant le chargement du paquet de la vue (desktop ou
 * mobile), découpées en `lazy` dans `src/App.tsx`.
 *
 * Il est volontairement minuscule et sans dépendance : il appartient au paquet
 * d'entrée, donc chaque octet ici est un octet que le téléphone télécharge avant
 * de pouvoir afficher quoi que ce soit. Pas d'icône importée, pas d'animation
 * coûteuse — un pouls d'opacité, que `prefers-reduced-motion` neutralise.
 */
export const EcranAttente: React.FC = () => {
  const t = useT();
  return (
  <div
    className="fixed inset-0 z-[5] flex flex-col items-center justify-center gap-4 bg-fond"
    role="status"
    aria-live="polite"
  >
    <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent motion-safe:animate-spin" />
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-texte-attenue">
      {t('general.chargement')}
    </p>
  </div>
  );
};
