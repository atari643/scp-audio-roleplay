import React from 'react';
import { BookOpen, FileText, Headphones, Database, Sliders } from 'lucide-react';
import { sfx } from '../../services/sfxService';

export type MobileTab = 'catalog' | 'reader' | 'audio' | 'scipnet' | 'settings';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  hasActiveDossier: boolean;
  isPlaying: boolean;
  hasAudioLoaded: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveDossier,
  isPlaying,
  hasAudioLoaded
}) => {
  const handleTabClick = (tab: MobileTab) => {
    sfx.playTerminalBeep();
    onSelectTab(tab);
  };

  return (
    <nav 
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-scp-border backdrop-blur-xl px-2 py-1 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {/* 1. Catalog */}
        <button
          onClick={() => handleTabClick('catalog')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'catalog'
              ? 'text-red-400 bg-red-950/40 border border-red-800/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-tight font-medium">Archives</span>
        </button>

        {/* 2. Dossier / Reader */}
        <button
          onClick={() => {
            if (hasActiveDossier) {
              handleTabClick('reader');
            } else {
              handleTabClick('catalog');
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'reader'
              ? 'text-red-400 bg-red-950/40 border border-red-800/50 shadow-inner'
              : hasActiveDossier
              ? 'text-slate-300 hover:text-white'
              : 'text-slate-600'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-tight font-medium">Dossier</span>
          {hasActiveDossier && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          )}
        </button>

        {/* 3. Audio Player */}
        <button
          onClick={() => handleTabClick('audio')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'audio'
              ? 'text-red-400 bg-red-950/40 border border-red-800/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Headphones className={`w-5 h-5 mb-0.5 ${isPlaying ? 'text-cyan-400 animate-bounce' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono tracking-tight font-medium">
            {isPlaying ? 'Écoute' : 'Audio'}
          </span>
        </button>

        {/* 4. SCiPNET Explorer */}
        <button
          onClick={() => handleTabClick('scipnet')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'scipnet'
              ? 'text-red-400 bg-red-950/40 border border-red-800/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-tight font-medium">SCiPNET</span>
        </button>

        {/* 5. Tactical Settings */}
        <button
          onClick={() => handleTabClick('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'text-red-400 bg-red-950/40 border border-red-800/50 shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-tight font-medium">Tactique</span>
        </button>
      </div>
    </nav>
  );
};
