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
    <aside aria-label="Sélecteur d'affichage" className="fixed top-2 right-2 z-50 flex items-center gap-1 bg-slate-950/90 border border-amber-600/60 rounded-full px-2.5 py-1 shadow-2xl backdrop-blur-md text-[11px] font-mono text-amber-300 hover:border-amber-400 transition-all group">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 font-bold tracking-wider hover:text-white"
        title="Basculer entre la version Bureau et la version Mobile"
      >
        {isMobile ? (
          <>
            <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300">VUE MOBILE</span>
          </>
        ) : (
          <>
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">VUE BUREAU</span>
          </>
        )}
        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 border border-amber-700/50 text-amber-400">
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
          className="ml-1 text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5 border-l border-slate-700 pl-1.5"
          title="Réinitialiser en mode Détection Automatique"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>AUTO</span>
        </button>
      )}
    </aside>
  );
};
