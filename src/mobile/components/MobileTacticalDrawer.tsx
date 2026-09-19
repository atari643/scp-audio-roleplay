import React from 'react';
import { 
  X, Sparkles, Star, Volume2, VolumeX, Tv, Terminal, 
  Radio, Globe, Monitor, Smartphone, ShieldAlert
} from 'lucide-react';
import { LanguageBranch, SUPPORTED_LANGUAGES } from '../../types/scp';
import { sfx } from '../../services/sfxService';

interface MobileTacticalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceStudio: () => void;
  onOpenFavorites: () => void;
  favoritesCount: number;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  ambienceActive: boolean;
  onToggleAmbience: () => void;
  onOpenRaisa: () => void;
  currentLanguage: LanguageBranch;
  onLanguageChange: (lang: LanguageBranch) => void;
  onSwitchToDesktop: () => void;
}

export const MobileTacticalDrawer: React.FC<MobileTacticalDrawerProps> = ({
  isOpen,
  onClose,
  onOpenVoiceStudio,
  onOpenFavorites,
  favoritesCount,
  sfxEnabled,
  onToggleSfx,
  crtEnabled,
  onToggleCrt,
  ambienceActive,
  onToggleAmbience,
  onOpenRaisa,
  currentLanguage,
  onLanguageChange,
  onSwitchToDesktop
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-4/5 max-w-sm bg-slate-950 border-l border-red-900/60 h-full p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                CENTRE TACTIQUE
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Access List */}
          <div className="space-y-2">
            {/* Voice Studio */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
                onOpenVoiceStudio();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-700 text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">Voice Studio Neural</div>
                  <div className="text-[10px] font-mono text-slate-400">Profilage vocal des acteurs</div>
                </div>
              </div>
              <span className="text-xs text-cyan-400">→</span>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
                onOpenFavorites();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-700 text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">Dossiers Favoris</div>
                  <div className="text-[10px] font-mono text-slate-400">{favoritesCount} dossiers sauvegardés</div>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {favoritesCount}
              </span>
            </button>

            {/* RAISA Console */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
                onOpenRaisa();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-700 text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">Console RAISA</div>
                  <div className="text-[10px] font-mono text-slate-400">Ligne de commande & télémétrie</div>
                </div>
              </div>
              <span className="text-xs text-red-400">CLI</span>
            </button>
          </div>

          {/* Section: Ambiance & Affichage */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 font-bold uppercase mb-2.5">
              SYSTÈME & IMMERSION
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* SFX Button */}
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  onToggleSfx();
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  sfxEnabled
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px] font-mono font-bold">SONS SFX</span>
              </button>

              {/* CRT Filter */}
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  onToggleCrt();
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  crtEnabled
                    ? 'bg-red-950/40 border-red-700 text-red-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold">ÉCRAN CRT</span>
              </button>
            </div>

            {/* Containment Ambience */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onToggleAmbience();
              }}
              className={`w-full mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                ambienceActive
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${ambienceActive ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>Bruit Blanc Confinement</span>
              </div>
              <span className="text-[10px] font-bold">
                {ambienceActive ? 'ACTIF' : 'INACTIF'}
              </span>
            </button>
          </div>

          {/* Languages */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
              <Globe className="w-3 h-3 text-red-500" />
              <span>BRANCHE LINGUISTIQUE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    sfx.playTerminalBeep();
                    onLanguageChange(lang);
                  }}
                  className={`p-2 rounded-lg border text-left text-xs font-mono flex items-center gap-1.5 transition-all ${
                    currentLanguage.code === lang.code
                      ? 'bg-red-950 border-red-600 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Switch to Desktop button */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onClose();
              onSwitchToDesktop();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-600/70 text-amber-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>Passer en Mode Bureau 🖥️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
