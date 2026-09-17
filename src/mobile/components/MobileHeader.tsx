import React from 'react';
import { Volume2, VolumeX, Shuffle, Menu, Globe } from 'lucide-react';
import { LanguageBranch, SUPPORTED_LANGUAGES } from '../../types/scp';
import { sfx } from '../../services/sfxService';

interface MobileHeaderProps {
  currentLanguage: LanguageBranch;
  onLanguageChange: (lang: LanguageBranch) => void;
  onOpenDrawer: () => void;
  onRandomScp: () => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenDrawer,
  onRandomScp,
  sfxEnabled,
  onToggleSfx
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-scp-border backdrop-blur-md px-3 py-2 flex items-center justify-between">
      {/* Brand & Node Status */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/80 flex items-center justify-center p-1 shadow-inner shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-500 fill-current">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4"/>
            <path d="M50 4 L50 22 M50 96 L50 78 M4 50 L22 50 M96 50 L78 50" stroke="currentColor" strokeWidth="5"/>
            <polygon points="50,32 40,46 60,46" fill="currentColor"/>
          </svg>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold tracking-wider text-white">SCiPNET</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-950 border border-red-700 text-red-400">
              MOB-4
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SITE-19 NODE</span>
          </div>
        </div>
      </div>

      {/* Quick Tactical Actions */}
      <div className="flex items-center gap-1.5">
        {/* Random SCP Button */}
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onRandomScp();
          }}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 active:scale-95 transition-all"
          title="Dossier Aléatoire"
          aria-label="Dossier Aléatoire"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* SFX Toggle */}
        <button
          onClick={() => {
            onToggleSfx();
          }}
          className={`p-2 rounded-lg border active:scale-95 transition-all ${
            sfxEnabled 
              ? 'bg-slate-900 border-slate-700 text-emerald-400' 
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
          title={sfxEnabled ? "Désactiver effets sonores" : "Activer effets sonores"}
          aria-label="Effets sonores"
        >
          {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Language selector pill */}
        <div className="relative flex items-center">
          <label htmlFor="mobile-lang-select" className="sr-only">Changer de langue</label>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200">
            <Globe className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-[11px] font-bold">{currentLanguage.flag}</span>
            <select
              id="mobile-lang-select"
              value={currentLanguage.code}
              onChange={(e) => {
                sfx.playTerminalBeep();
                const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (found) onLanguageChange(found);
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tactical Drawer Menu Button */}
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onOpenDrawer();
          }}
          className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/80 active:scale-95 transition-all"
          title="Menu Tactique"
          aria-label="Ouvrir le menu tactique"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
