import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Sliders,
  Bookmark,
  Globe,
  Dices,
  Tv,
  FolderOpen
} from 'lucide-react';
import { LanguageBranch, SUPPORTED_LANGUAGES } from '../types/scp';
import { sfx } from '../services/sfxService';
import { useT } from '../i18n';

interface HeaderProps {
  currentLanguage: LanguageBranch;
  onLanguageChange: (lang: LanguageBranch) => void;
  onOpenVoiceStudio: () => void;
  onOpenFavorites: () => void;
  onOpenExplorer?: () => void;
  onRandomScp: () => void;
  favoritesCount: number;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
}

/**
 * Gabarit commun à tous les boutons de la barre d'actions.
 *
 * L'ancienne version donnait à chaque bouton sa propre couleur de bordure au
 * survol (ambre pour l'explorateur, rouge pour le studio, cyan pour le son) :
 * six boutons, quatre traitements. Un seul gabarit désormais — la
 * différenciation passe par l'icône et le libellé, pas par la teinte.
 */
const BOUTON_BARRE =
  'inline-flex items-center gap-1.5 h-9 px-2.5 rounded text-xs font-mono ' +
  'bg-surface-2 border border-bordure text-texte-second ' +
  'hover:bg-surface-3 hover:text-texte hover:border-forte transition-colors';

// État actif : l'élément se relève d'un cran. Le libellé reste en `texte` et
// non en rouge, parce que `surface-4` ne porte pas de texte rouge (3,58:1) —
// c'est la bordure qui dit l'accent.
const BOUTON_BARRE_ACTIF =
  'inline-flex items-center gap-1.5 h-9 px-2.5 rounded text-xs font-mono ' +
  'bg-surface-4 border border-accent-texte text-texte shadow-relief transition-colors';

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenVoiceStudio,
  onOpenFavorites,
  onOpenExplorer,
  onRandomScp,
  favoritesCount,
  sfxEnabled,
  onToggleSfx,
  crtEnabled,
  onToggleCrt
}) => {
  const t = useT();
  const [siteTime, setSiteTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSiteTime(now.toISOString().substring(11, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface-1/95 backdrop-blur border-b border-bordure">
      {/* Bandeau de niveau d'accréditation.
          Il informe : ni bouclier pulsant, ni point clignotant. Le seul mouvement
          de l'application est réservé à ce qui est en cours de lecture. */}
      <div className="border-b border-faible bg-fond px-3 sm:px-6 py-1.5 flex items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-3.5 h-3.5 text-accent-texte shrink-0" aria-hidden="true" />
          <span className="text-accent-texte font-semibold tracking-technique uppercase shrink-0">
            {t('entete.restreint')}
          </span>
          <span className="text-bordure-forte hidden sm:inline" aria-hidden="true">|</span>
          <span className="hidden sm:inline text-texte-attenue truncate tracking-technique">
            {t('entete.surveillance')}
          </span>
          <span className="sm:hidden text-texte-attenue truncate">{t('entete.archive')}</span>
        </div>

        {/* Horodatage et nœud réseau : de l'information machine, donc du cyan
            système. Le rouge reste à la classification, à gauche. */}
        <div className="flex items-center gap-3 shrink-0 tracking-technique">
          <span className="hidden lg:inline text-texte-attenue">{t('entete.noeud')}</span>
          <span className="text-bordure-forte hidden lg:inline" aria-hidden="true">|</span>
          <span className="tabular-nums text-texte-attenue">
            UTC <span className="text-systeme">{siteTime || '00:00:00'}</span>
          </span>
        </div>
      </div>

      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Emblème et titre */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" aria-hidden="true">
              <circle cx="50" cy="50" r="46" stroke="var(--accent-texte)" strokeWidth="4" strokeDasharray="12 4" />
              <circle cx="50" cy="50" r="30" stroke="var(--texte)" strokeWidth="3.5" />
              <circle cx="50" cy="50" r="13" fill="var(--accent-texte)" />
              <path d="M50 4 L50 20 M44 14 L50 20 L56 14" stroke="var(--texte)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M89.8 73 L76 65 M73 73 L76 65 L82 68" stroke="var(--texte)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.2 73 L24 65 M18 68 L24 65 L27 73" stroke="var(--texte)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-mono font-bold tracking-tight text-texte truncate">
              FONDATION <span className="text-accent-texte">SCP</span>
            </h1>
            <p className="text-xs text-texte-attenue hidden sm:block font-mono tracking-technique truncate">
              {t('entete.sousTitre')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sélecteur de branche */}
          <div className="relative flex items-center h-9 bg-surface-2 border border-bordure rounded px-2 focus-within:border-accent-texte transition-colors">
            <Globe className="w-4 h-4 text-texte-attenue mr-1.5 hidden sm:block" aria-hidden="true" />
            <select
              value={currentLanguage.code}
              onChange={(e) => {
                const lang = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                if (lang) onLanguageChange(lang);
              }}
              className="bg-transparent text-xs text-texte-second font-mono cursor-pointer focus:outline-none pr-1"
              aria-label={t('entete.brancheAria')}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-surface-1 text-texte font-mono">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onRandomScp();
            }}
            title={t('entete.aleatoireInfo')}
            className={BOUTON_BARRE}
          >
            <Dices className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">{t('entete.aleatoire')}</span>
          </button>

          {onOpenExplorer && (
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onOpenExplorer();
              }}
              title={t('entete.explorateurInfo')}
              className={BOUTON_BARRE}
            >
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">{t('entete.explorateur')}</span>
            </button>
          )}

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenVoiceStudio();
            }}
            title={t('entete.voixInfo')}
            className={BOUTON_BARRE}
          >
            <Sliders className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">{t('entete.voix')}</span>
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleCrt();
            }}
            title={t(crtEnabled ? 'entete.desactiverCrt' : 'entete.activerCrt')}
            aria-pressed={crtEnabled}
            className={crtEnabled ? BOUTON_BARRE_ACTIF : BOUTON_BARRE}
          >
            <Tv className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">CRT</span>
          </button>

          <button
            onClick={onToggleSfx}
            title={t(sfxEnabled ? 'entete.couperSons' : 'entete.activerSons')}
            aria-pressed={sfxEnabled}
            className={`${sfxEnabled ? BOUTON_BARRE_ACTIF : BOUTON_BARRE} w-9 justify-center px-0`}
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenFavorites();
            }}
            title={t('entete.favoris')}
            className={`${BOUTON_BARRE} relative w-9 justify-center px-0`}
          >
            <Bookmark className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-sm bg-accent text-xs font-mono font-bold text-texte flex items-center justify-center tabular-nums">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
