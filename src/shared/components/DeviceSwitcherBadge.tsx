import React from 'react';
import { Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { DeviceMode } from '../hooks/useDeviceMode';
import { sfx } from '../../services/sfxService';

interface DeviceSwitcherBadgeProps {
  mode: DeviceMode;
  isMobile: boolean;
  onToggle: () => void;
  onSetMode?: (mode: DeviceMode) => void;
}

export const DeviceSwitcherBadge: React.FC<DeviceSwitcherBadgeProps> = ({
  mode,
  isMobile,
  onToggle,
  onSetMode
}) => {
  const handleClick = () => {
    sfx.playTerminalBeep();
    onToggle();
  };

  return (
    <aside aria-label="Sélecteur d'affichage" className="fixed top-2 right-2 z-50 flex items-center gap-1 bg-fond/90 border border-classe-euclid/60 rounded-full px-2.5 py-1 shadow-2xl backdrop-blur-md text-xs font-mono text-classe-euclid hover:border-classe-euclid transition-all group">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 font-bold tracking-wider hover:text-texte"
        title="Basculer entre la version Bureau et la version Mobile"
      >
        {isMobile ? (
          <>
            <Smartphone className="w-3.5 h-3.5 text-role-agent" />
            <span className="text-role-agent">VUE MOBILE</span>
          </>
        ) : (
          <>
            <Monitor className="w-3.5 h-3.5 text-classe-euclid" />
            <span className="text-classe-euclid">VUE BUREAU</span>
          </>
        )}
        <span className="text-xs px-1 py-0.5 rounded bg-surface-3/80 border border-classe-euclid/50 text-classe-euclid">
          SWITCH ⇄
        </span>
      </button>

      {mode !== 'auto' && onSetMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            sfx.playTerminalBeep();
            onSetMode('auto');
          }}
          className="ml-1 text-xs text-texte-attenue hover:text-texte flex items-center gap-0.5 border-l border-bordure pl-1.5"
          title="Réinitialiser en mode Détection Automatique"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>AUTO</span>
        </button>
      )}
    </aside>
  );
};
