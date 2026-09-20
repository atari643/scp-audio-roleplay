import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { PlayerStatus } from '../types/audioRoleplay';
import { ObjectClass } from '../types/scp';
import { useT } from '../i18n';

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
  info:    'text-role-agent',
  warn:    'text-classe-euclid',
  alert:   'text-accent-texte',
  success: 'text-classe-safe',
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
  const t = useT();
  const [collapsed, setCollapsed] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([
    makeLog('success', 'RAISA_NODE', t('log.connexion')),
    makeLog('info',    'CROM_API',  t('log.synchro')),
    makeLog('warn',    'MEMETIC',   t('log.derive')),
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
    addLog('info', 'DOSSIER_REQ', t('log.extraction', { dossier: activeScpNumber.toUpperCase() }));
    if (activeObjectClass === 'Keter' || activeObjectClass === 'Apollyon') {
      addLog('alert', 'SECURITY',
        t('log.danger', { classe: activeObjectClass }));
    }
  }, [activeScpNumber, activeObjectClass, addLog]);

  useEffect(() => {
    const msgs: [LogLevel, string, string][] = [
      ['info',    'SITE19_CTRL', t('log.secteurs')],
      ['warn',    'MEMETIC',     t('log.deriveNormale')],
      ['info',    'RAISA_NODE',  t('log.ping')],
      ['info',    'CROM_API',    t('log.cache')],
      ['success', 'NEURAL_TTS',  t('log.profils')],
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
          className="flex items-center gap-2 px-3 py-1.5 bg-black/90 hover:bg-surface-1 border border-accent-texte/60 hover:border-accent-texte rounded-lg shadow-xl text-xs font-mono text-texte-second hover:text-texte transition-all backdrop-blur-md group"
          title={t('raisa.ouvrir')}
        >
          <Terminal className="w-3.5 h-3.5 text-accent-texte" />
          <span className="text-accent-texte font-bold">RAISA</span>
          <span className="hidden sm:inline text-texte-attenue">WATCHDOG</span>
          <span className="text-texte-attenue">|</span>
          <span className="text-systeme">{t('log.actif')}</span>
          <span className="text-texte-attenue font-bold">({logs.length})</span>
          <ChevronUp className="w-3 h-3 text-texte-attenue ml-0.5" />
        </button>
      ) : (
        /* Expanded Floating Terminal Window */
        <div
          className="w-[calc(100vw-24px)] sm:w-[540px] bg-black/98 border border-accent-texte/80 rounded-xl shadow-2xl overflow-hidden animate-slide-down"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-1/90 border-b border-accent-texte/60 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-accent-texte" />
              <span className="text-accent-texte font-bold text-xs tracking-wider">RAISA WATCHDOG CONSOLE v4.19</span>
              <span className="text-xs text-systeme font-bold">{t('log.connecte')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-texte-attenue">{logs.length} événements</span>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 hover:bg-surface-3/60 rounded text-texte-attenue hover:text-texte transition-colors"
                title={t('raisa.reduire')}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={scrollRef}
            className="p-2.5 space-y-1 overflow-y-auto no-scrollbar font-mono text-xs"
            style={{ height: 175 }}
          >
            {logs.map(log => (
              <div key={log.id} className="raisa-log-line flex gap-2 leading-tight">
                <span className="text-texte-attenue shrink-0 select-none">[{log.time}]</span>
                <span className={`${LEVEL_COLORS[log.level]} shrink-0 w-24 truncate font-bold`}>{log.module}:</span>
                <span className="text-texte-second">{log.message}</span>
              </div>
            ))}
            <div className="flex gap-2 text-accent-texte/70 pt-0.5">
              <span className="text-texte-attenue select-none">[{new Date().toISOString().substring(11, 19)}]</span>
              <span className="font-bold">RAISA_NODE:</span>
              <span className="animate-alarm-pulse font-bold">_ █</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
