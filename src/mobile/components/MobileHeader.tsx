import React from 'react';
import { Volume2, VolumeX, Shuffle, Menu, Globe } from 'lucide-react';
import { LanguageBranch, SUPPORTED_LANGUAGES } from '../../types/scp';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

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
  const t = useT();
  return (
    <header
      className="sticky top-0 z-40 bg-fond/95 border-b border-scp-border backdrop-blur-md px-3 py-2 flex items-center justify-between"
      /* Encoche et barre d'état : sans ce retrait, le logo passe sous l'heure du téléphone. */
      style={{
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
        paddingLeft: 'calc(0.75rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(0.75rem + env(safe-area-inset-right, 0px))'
      }}
    >
      {/* Brand & Node Status */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-surface-3/80 border border-accent-texte/80 flex items-center justify-center p-1 shadow-inner shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full text-accent-texte fill-current">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4"/>
            <path d="M50 4 L50 22 M50 96 L50 78 M4 50 L22 50 M96 50 L78 50" stroke="currentColor" strokeWidth="5"/>
            <polygon points="50,32 40,46 60,46" fill="currentColor"/>
          </svg>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold tracking-wider text-texte">SCiPNET</span>
            <span className="text-xs font-mono px-1 py-0.5 rounded bg-surface-3 border border-accent-texte text-accent-texte">
              MOB-4
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-texte-attenue">
            <span className="w-1.5 h-1.5 rounded-full bg-systeme" aria-hidden="true"></span>
            <span className="text-systeme">Site-19</span>
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
          className="w-11 h-11 flex items-center justify-center rounded-sm bg-surface-2 border border-bordure text-texte-attenue active:bg-surface-3 transition-colors"
          title={t('menu.aleatoire')}
          aria-label={t('menu.aleatoire')}
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* SFX Toggle */}
        <button
          onClick={() => {
            onToggleSfx();
          }}
          className={`w-11 h-11 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${
            sfxEnabled 
              ? 'bg-surface-1 border-bordure text-classe-safe' 
              : 'bg-surface-1/60 border-bordure text-texte-attenue'
          }`}
          title={sfxEnabled ? "Désactiver effets sonores" : "Activer effets sonores"}
          aria-label={t('menu.effetsSonores')}
        >
          {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Language selector pill */}
        <div className="relative flex items-center">
          <label htmlFor="mobile-lang-select" className="sr-only">{t('menu.changerLangue')}</label>
          <div className="flex items-center gap-1 bg-surface-1 border border-bordure rounded-lg px-2 py-1.5 text-xs font-mono text-texte">
            <Globe className="w-3.5 h-3.5 text-accent-texte shrink-0" />
            <span className="text-xs font-bold">{currentLanguage.flag}</span>
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
                <option key={lang.code} value={lang.code} className="bg-surface-1 text-texte">
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
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-3/60 border border-accent-texte/80 text-accent-texte hover:bg-surface-3/80 active:scale-95 transition-all"
          title={t('menu.tactique')}
          aria-label={t('menu.ouvrirTactique')}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
