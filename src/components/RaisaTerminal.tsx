import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { PlayerStatus } from '../types/audioRoleplay';
import { ObjectClass } from '../types/scp';

type LogLevel = 'info' | 'warn' | 'alert' | 'success';

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  module: string;
  message: string;
}

let logIdCounter = 1;

function makeLog(level: LogLevel, module: string, message: string): LogEntry {
  const now = new Date();
  const time = now.toISOString().substring(11, 19);
  return { id: logIdCounter++, time, level, module, message };
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info:    'text-cyan-400',
  warn:    'text-amber-400',
  alert:   'text-red-400',
  success: 'text-emerald-400',
};

interface RaisaTerminalProps {
  playerStatus: PlayerStatus;
  activeScpNumber: string | null;
  activeObjectClass: ObjectClass | null;
  hasActivePlayer?: boolean;
}

export const RaisaTerminal: React.FC<RaisaTerminalProps> = ({
  playerStatus, activeScpNumber, activeObjectClass, hasActivePlayer = false
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([
    makeLog('success', 'RAISA_NODE', 'Connexion établie — SCiPNET Secure Terminal opérationnel.'),
    makeLog('info',    'CROM_API',  'Synchronisation archive Crom v1.2 — OK.'),
    makeLog('warn',    'MEMETIC',   'Dérive mémétique mesurée : 0.00% — Sujet stable.'),
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogLevel, module: string, message: string) => {
    setLogs(prev => [...prev.slice(-99), makeLog(level, module, message)]);
  }, []);

  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, collapsed]);

  useEffect(() => {
    if (!activeScpNumber) return;
    if (playerStatus.isPlaying) {
      const seg = playerStatus.currentSegmentIndex + 1;
      const total = playerStatus.totalSegments;
      const speaker = playerStatus.currentSpeaker;
      addLog('success', 'AUDIO_LINK',
        'Flux neural actif — Segment ' + seg + '/' + total + ' — Intervenant: ' + speaker);
    }
  }, [playerStatus.currentSegmentIndex, playerStatus.isPlaying, activeScpNumber, addLog,
      playerStatus.currentSpeaker, playerStatus.totalSegments]);

  useEffect(() => {
    if (!activeScpNumber) return;
    addLog('info', 'DOSSIER_REQ', 'Extraction ' + activeScpNumber.toUpperCase() + ' autorisée — Chargement.');
    if (activeObjectClass === 'Keter' || activeObjectClass === 'Apollyon') {
      addLog('alert', 'SECURITY',
        'DANGER — Anomalie ' + activeObjectClass + ' — Protocoles de confinement renforcés.');
    }
  }, [activeScpNumber, activeObjectClass, addLog]);

  useEffect(() => {
    const msgs: [LogLevel, string, string][] = [
      ['info',    'SITE19_CTRL', 'Vérification systèmes confinement — Secteurs OK.'],
      ['warn',    'MEMETIC',     'Dérive mémétique dans les limites normales.'],
      ['info',    'RAISA_NODE',  'Ping SCiPNET : 4ms — Stable.'],
      ['info',    'CROM_API',    'Cache archive synchronisé.'],
      ['success', 'NEURAL_TTS',  'Profils vocaux opérationnels.'],
    ];
    const interval = setInterval(() => {
      const [lvl, mod, msg] = msgs[Math.floor(Math.random() * msgs.length)];
      addLog(lvl, mod, msg);
    }, 18000);
    return () => clearInterval(interval);
  }, [addLog]);

  const bottomPosition = hasActivePlayer ? 'bottom-[72px] sm:bottom-[68px]' : 'bottom-3 sm:bottom-4';

  return (
    <div className={`fixed left-3 sm:left-6 z-40 transition-all duration-300 ${bottomPosition}`}>
      {/* Collapsed Pill Button */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-black/90 hover:bg-slate-900 border border-red-900/60 hover:border-red-600 rounded-lg shadow-xl text-[11px] font-mono text-slate-300 hover:text-white transition-all backdrop-blur-md group"
          title="Ouvrir la console RAISA Watchdog"
        >
          <Terminal className="w-3.5 h-3.5 text-red-500 group-hover:animate-pulse" />
          <span className="text-red-400 font-bold">RAISA</span>
          <span className="hidden sm:inline text-slate-500">WATCHDOG</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400">● ACTIF</span>
          <span className="text-slate-500 font-bold">({logs.length})</span>
          <ChevronUp className="w-3 h-3 text-slate-500 ml-0.5" />
        </button>
      ) : (
        /* Expanded Floating Terminal Window */
        <div
          className="w-[calc(100vw-24px)] sm:w-[540px] bg-black/98 border border-red-800/80 rounded-xl shadow-2xl overflow-hidden animate-slide-down"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-red-900/60 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-400 font-bold text-[10px] tracking-wider">RAISA WATCHDOG CONSOLE v4.19</span>
              <span className="text-[10px] text-emerald-400 font-bold">● CONNECTÉ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{logs.length} événements</span>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 hover:bg-red-950/60 rounded text-slate-400 hover:text-white transition-colors"
                title="Réduire le terminal"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={scrollRef}
            className="p-2.5 space-y-1 overflow-y-auto no-scrollbar font-mono text-[10px]"
            style={{ height: 175 }}
          >
            {logs.map(log => (
              <div key={log.id} className="raisa-log-line flex gap-2 leading-tight">
                <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                <span className={`${LEVEL_COLORS[log.level]} shrink-0 w-24 truncate font-bold`}>{log.module}:</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
            <div className="flex gap-2 text-red-500/70 pt-0.5">
              <span className="text-slate-700 select-none">[{new Date().toISOString().substring(11, 19)}]</span>
              <span className="font-bold">RAISA_NODE:</span>
              <span className="animate-alarm-pulse font-bold">_ █</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
