import React from 'react';
import { DesktopApp } from './desktop/DesktopApp';
import { MobileApp } from './mobile/MobileApp';
import { useScpApp } from './shared/hooks/useScpApp';
import { useDeviceMode } from './shared/hooks/useDeviceMode';
import { DeviceSwitcherBadge } from './shared/components/DeviceSwitcherBadge';

/**
 * Root Application Switcher:
 * Automatically routes to DesktopApp or MobileApp based on viewport/device detection,
 * while allowing instant manual toggle via DeviceSwitcherBadge.
 * 
 * Shared business logic is managed in `src/shared/hooks/useScpApp.ts`.
 * Desktop views & layout live in `src/desktop/`.
 * Mobile views & layout live in `src/mobile/`.
 */
export const App: React.FC = () => {
  const app = useScpApp();
  const { mode, isMobile, toggleMode, setDeviceMode } = useDeviceMode();

  return (
    <>
      {/* Floating Tactical Switcher (Desktop ⇄ Mobile) */}
      <DeviceSwitcherBadge
        mode={mode}
        isMobile={isMobile}
        onToggle={toggleMode}
        onSetMode={setDeviceMode}
      />

      {/* Render dedicated view */}
      {isMobile ? (
        <MobileApp app={app} toggleMode={toggleMode} setDeviceMode={setDeviceMode} />
      ) : (
        <DesktopApp app={app} />
      )}
    </>
  );
};
