import React, { Suspense, lazy } from 'react';
import { useScpApp } from './shared/hooks/useScpApp';
import { useDeviceMode } from './shared/hooks/useDeviceMode';
import { DeviceSwitcherBadge } from './shared/components/DeviceSwitcherBadge';
import { EcranAttente } from './shared/components/EcranAttente';
import { LimiteErreur } from './shared/components/LimiteErreur';
import { useT } from './i18n';

/**
 * Aiguilleur racine : route vers `DesktopApp` ou `MobileApp` selon la détection
 * d'appareil, tout en laissant la bascule manuelle via `DeviceSwitcherBadge`.
 *
 * Les deux vues sont chargées en `lazy` **à dessein** : importées statiquement, les
 * deux arbres se retrouvaient dans le même paquet, et un téléphone téléchargeait
 * l'intégralité de l'interface desktop avant d'afficher quoi que ce soit. Le
 * découpage se fait ici et nulle part ailleurs — la frontière `desktop/` `mobile/`
 * reste intacte.
 *
 * La logique métier partagée vit dans `src/shared/hooks/useScpApp.ts`.
 */
const DesktopApp = lazy(() =>
  import('./desktop/DesktopApp').then(m => ({ default: m.DesktopApp }))
);
const MobileApp = lazy(() =>
  import('./mobile/MobileApp').then(m => ({ default: m.MobileApp }))
);

export const App: React.FC = () => {
  const t = useT();
  const app = useScpApp();
  const { mode, isMobile, toggleMode, setDeviceMode } = useDeviceMode();

  return (
    <>
      {/* Bascule tactique flottante (Bureau ⇄ Mobile), en bas à droite */}
      <DeviceSwitcherBadge
        mode={mode}
        isMobile={isMobile}
        onToggle={toggleMode}
        onSetMode={setDeviceMode}
        lecteurVisible={app.playerStatus.totalSegments > 0}
      />

      {/*
        Vue dédiée, chargée à la demande.

        La limite est DANS l'aiguilleur et non seulement à la racine : un `import()`
        de chunk qui échoue traverse `<Suspense>`, qui ne rattrape que l'attente. La
        placer ici garde la bascule desktop ⇄ mobile utilisable même quand la vue,
        elle, n'a pas pu se charger.
      */}
      <LimiteErreur contexte={t(isMobile ? 'erreur.contexteMobile' : 'erreur.contexteBureau')}>
        <Suspense fallback={<EcranAttente />}>
          {isMobile ? (
            <MobileApp app={app} toggleMode={toggleMode} setDeviceMode={setDeviceMode} />
          ) : (
            <DesktopApp app={app} />
          )}
        </Suspense>
      </LimiteErreur>
    </>
  );
};
