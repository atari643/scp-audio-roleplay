import { useState, useEffect, useCallback } from 'react';
import { storageService, DeviceMode } from '../../services/storageService';

export type { DeviceMode };

/** Seuil d'aiguillage automatique, aligné sur le `md` de Tailwind. */
const REQUETE_MOBILE = '(max-width: 767px)';

/**
 * Choix de la vue : automatique selon la largeur, ou forcé par l'utilisateur.
 *
 * L'implémentation précédente gardait `window.innerWidth` dans un state et
 * écoutait `resize`. Sur téléphone, la barre d'URL qui se rétracte déclenche
 * `resize` en rafale : chaque pixel re-rendait l'application entière. On
 * n'écoute donc plus qu'un booléen, via `matchMedia`, qui ne change qu'au
 * franchissement du seuil.
 */
export function useDeviceMode() {
  const [mode, setMode] = useState<DeviceMode>(() => storageService.getDeviceMode());

  const [estEtroit, setEstEtroit] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(REQUETE_MOBILE).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(REQUETE_MOBILE);
    const surChangement = (e: MediaQueryListEvent) => setEstEtroit(e.matches);
    mql.addEventListener('change', surChangement);
    return () => mql.removeEventListener('change', surChangement);
  }, []);

  const setDeviceMode = useCallback((nouveau: DeviceMode) => {
    setMode(nouveau);
    storageService.saveDeviceMode(nouveau);
  }, []);

  const isMobile = mode === 'mobile' || (mode === 'auto' && estEtroit);

  const toggleMode = useCallback(() => {
    setDeviceMode(isMobile ? 'desktop' : 'mobile');
  }, [isMobile, setDeviceMode]);

  return {
    mode,
    isMobile,
    setDeviceMode,
    toggleMode
  };
}
