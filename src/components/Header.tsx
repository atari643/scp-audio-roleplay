import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Bookmark, 
  Globe, 
  Terminal,
  Dices,
  Tv,
  Radio,
  FolderOpen
} from 'lucide-react';
import { LanguageBranch, SUPPORTED_LANGUAGES } from '../types/scp';
import { sfx } from '../services/sfxService';

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
  const [siteTime, setSiteTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19);
      setSiteTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-scp-surface/95 backdrop-blur border-b border-scp-border">
      {/* Top Security Clearance Marquee / RAISA Terminal Bar */}
      <div className="bg-red-950/90 border-b border-red-700/60 text-red-200 text-xs px-3 py-1.5 flex items-center justify-between font-mono tracking-wider">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
          <span className="font-bold text-white bg-red-800 px-1.5 py-0.2 rounded text-[10px] tracking-widest uppercase">
            RESTREINT // O5-CLEARANCE
          </span>
          <span className="hidden sm:inline text-red-300/90 truncate">
            AVERTISSEMENT RAISA : TOUT ACCÈS NON AUTORISÉ EST ENREGISTRÉ ET TRAITÉ PAR DÉPLOIEMENT FIM
          </span>
          <span className="sm:hidden text-red-300 truncate">ARCHIVE SITE-19</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] font-mono shrink-0">
          <span className="text-emerald-400 hidden lg:inline flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            SCiPNET NODE 19-B
          </span>
          <span className="text-red-300/90 bg-red-900/60 border border-red-700/50 px-2 py-0.5 rounded">
            UTC {siteTime || '00:00:00'}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-900 via-red-950 to-black p-1.5 border border-red-600/60 flex items-center justify-center shadow-lg shadow-red-950/40 relative group cursor-pointer">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <circle cx="50" cy="50" r="46" stroke="#ef4444" strokeWidth="5" strokeDasharray="12 4" />
              <circle cx="50" cy="50" r="30" stroke="#f8fafc" strokeWidth="4" />
              <circle cx="50" cy="50" r="14" fill="#ef4444" />
              <path d="M50 4 L50 20 M44 14 L50 20 L56 14" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M89.8 73 L76 65 M73 73 L76 65 L82 68" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.2 73 L24 65 M18 68 L24 65 L27 73" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute inset-0 rounded-lg border border-red-400/30 animate-pulse pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-1">
                FONDATION <span className="text-red-500 terminal-glow-red">SCP</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-red-400 border border-red-800/60 font-mono font-bold tracking-wider">
                SCiPNET AUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 font-mono">
              <span>Terminal d'Archive RAISA</span>
              <span className="text-slate-600">•</span>
              <span className="text-red-400/80">Audio Théâtralisé</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* CRT Terminal Screen Toggle */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleCrt();
            }}
            title={crtEnabled ? "Désactiver le filtre écran CRT" : "Activer l'effet moniteur CRT terminal"}
            className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
              crtEnabled
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-sm shadow-red-900/50'
                : 'bg-scp-card border-scp-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden lg:inline text-[11px] font-semibold">
              CRT {crtEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-scp-card border border-scp-border rounded-lg px-2 py-1 hover:border-scp-red transition-colors">
            <Globe className="w-4 h-4 text-slate-400 mr-1.5 hidden sm:inline" />
            <select
              value={currentLanguage.code}
              onChange={(e) => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (lang) onLanguageChange(lang);
              }}
              className="bg-transparent text-xs text-slate-200 font-mono font-medium cursor-pointer focus:outline-none pr-1"
              aria-label="Sélection de la branche SCP"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-scp-surface text-slate-200 font-mono">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Random SCP Button */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onRandomScp();
            }}
            title="Dossier SCP Aléatoire"
            className="flex items-center gap-1 text-xs font-mono bg-scp-card hover:bg-scp-cardHover text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-scp-border hover:border-amber-600/60 transition-all"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Aléatoire</span>
          </button>

          {/* SCiPNET Explorer Button */}
          {onOpenExplorer && (
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onOpenExplorer();
              }}
              title="Explorateur d'Entités SCiPNET (Départements, Chercheurs, GdI)"
              className="flex items-center gap-1.5 text-xs bg-scp-card hover:bg-slate-800 text-amber-300 hover:text-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-600/70 hover:border-amber-400 transition-all font-mono font-semibold"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Explorateur</span>
            </button>
          )}

          {/* Voice Studio Button */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenVoiceStudio();
            }}
            title="Studio des Voix & Rôles"
            className="flex items-center gap-1.5 text-xs bg-scp-card hover:bg-scp-cardHover text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-scp-border hover:border-red-600/60 transition-all font-mono"
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">Studio Voix</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSfx}
            title={sfxEnabled ? "Désactiver les effets sonores (bips, radio)" : "Activer les effets sonores"}
            className={`p-1.5 rounded-lg border transition-colors ${
              sfxEnabled 
                ? 'bg-scp-card border-cyan-700/60 text-cyan-400 shadow-sm shadow-cyan-950/40' 
                : 'bg-scp-card border-scp-border text-slate-500 hover:text-slate-400'
            }`}
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenFavorites();
            }}
            title="Dossiers sauvegardés"
            className="relative p-1.5 bg-scp-card hover:bg-scp-cardHover text-slate-300 hover:text-amber-400 rounded-lg border border-scp-border transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center font-mono shadow">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
