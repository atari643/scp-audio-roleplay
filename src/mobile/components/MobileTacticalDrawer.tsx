import React from 'react';
import { 
  X, ChevronRight, Sparkles, Star, Volume2, VolumeX, Tv, Terminal, 
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
      <div
        className="relative z-10 w-4/5 max-w-sm bg-fond border-l border-accent-texte/60 h-full p-5 flex flex-col justify-between overflow-y-auto shadow-2xl"
        /* Le tiroir occupe toute la hauteur : il doit contourner l'encoche en haut et la
           barre de gestes en bas, sinon ses deux extrémités deviennent inatteignables. */
        style={{
          paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          paddingRight: 'calc(1.25rem + env(safe-area-inset-right, 0px))'
        }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-bordure mb-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent-texte" />
              <span className="text-xs font-mono font-bold text-texte tracking-wider">
                CENTRE TACTIQUE
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
              }}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-1 border border-bordure text-texte-attenue hover:text-texte"
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
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-1/80 border border-bordure hover:border-role-agent text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-role-agent" />
                <div>
                  <div className="text-xs font-mono font-bold text-texte">Voice Studio Neural</div>
                  <div className="text-xs font-mono text-texte-attenue">Profilage vocal des acteurs</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-texte-attenue" />
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
                onOpenFavorites();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-1/80 border border-bordure hover:border-classe-euclid text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-classe-euclid fill-current" />
                <div>
                  <div className="text-xs font-mono font-bold text-texte">Dossiers Favoris</div>
                  <div className="text-xs font-mono text-texte-attenue">{favoritesCount} dossiers sauvegardés</div>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-3 text-classe-euclid border border-classe-euclid">
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
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-1/80 border border-bordure hover:border-accent-texte text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-accent-texte" />
                <div>
                  <div className="text-xs font-mono font-bold text-texte">Console RAISA</div>
                  <div className="text-xs font-mono text-texte-attenue">Ligne de commande & télémétrie</div>
                </div>
              </div>
              <span className="text-xs text-accent-texte">CLI</span>
            </button>
          </div>

          {/* Section: Ambiance & Affichage */}
          <div className="mt-6 pt-4 border-t border-bordure">
            <div className="text-xs font-mono text-texte-attenue font-bold uppercase mb-2.5">
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
                    ? 'bg-surface-3/40 border-classe-safe text-classe-safe'
                    : 'bg-surface-1 border-bordure text-texte-attenue'
                }`}
              >
                {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-xs font-mono font-bold">SONS SFX</span>
              </button>

              {/* CRT Filter */}
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  onToggleCrt();
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  crtEnabled
                    ? 'bg-surface-3/40 border-accent-texte text-accent-texte'
                    : 'bg-surface-1 border-bordure text-texte-attenue'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">ÉCRAN CRT</span>
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
                  ? 'bg-surface-3/50 border-classe-safe text-classe-safe'
                  : 'bg-surface-1 border-bordure text-texte-attenue'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${ambienceActive ? 'text-classe-safe' : ''}`} />
                <span>Bruit Blanc Confinement</span>
              </div>
              <span className="text-xs font-bold">
                {ambienceActive ? 'ACTIF' : 'INACTIF'}
              </span>
            </button>
          </div>

          {/* Languages */}
          <div className="mt-6 pt-4 border-t border-bordure">
            <div className="text-xs font-mono text-texte-attenue font-bold uppercase mb-2 flex items-center gap-1">
              <Globe className="w-3 h-3 text-accent-texte" />
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
                      ? 'bg-surface-3 border-accent-texte text-texte font-bold'
                      : 'bg-surface-1 border-bordure text-texte-attenue hover:text-texte'
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
        <div className="pt-4 border-t border-bordure mt-4">
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onClose();
              onSwitchToDesktop();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-1 border border-classe-euclid/70 text-classe-euclid hover:text-texte text-xs font-mono font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          >
            <Monitor className="w-4 h-4 text-classe-euclid" />
            <span>Passer en mode bureau</span>
          </button>
        </div>
      </div>
    </div>
  );
};
