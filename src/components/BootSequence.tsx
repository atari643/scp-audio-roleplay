import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sfx } from '../services/sfxService';

const BOOT_LINES = [
  { text: 'SCiPNET MAINFRAME BIOS v4.19-R — INITIALISATION DU TERMINAL...', delay: 0, type: 'system' },
  { text: 'TEST DE LA MÉMOIRE VIVE CONVENTIONNELLE : 640 Ko... [OK]', delay: 450, type: 'ok' },
  { text: 'VÉRIFICATION QUANTUM-ENCRYPTED HANDSHAKE (SITE-19)... [OK]', delay: 950, type: 'ok' },
  { text: 'CHARGEMENT NOYAU SÉCURITÉ : PROTOCOLE BERRYMAN-LANGFORD v9.3...', delay: 1550, type: 'warn' },
  { text: 'MONTAGE ARCHIVE SONORE MULTI-VOIX ET SYNTHÈSE NEURALE... [OK]', delay: 2150, type: 'ok' },
  { text: 'LIAISON SATELLITE CRYPTÉE VERS CROM GRAPHQL API... [CONNECTÉ]', delay: 2750, type: 'ok' },
  { text: 'VÉRIFICATION ACCRÉDITATION OPÉRATEUR : NIVEAU 4 / RESTREINT... [VALIDÉ]', delay: 3350, type: 'ok' },
  { text: 'ACTIVATION DU PARE-FEU COGNITIF ET ISOLATION MÉMÉTIQUE... [ACTIF]', delay: 3950, type: 'warn' },
  { text: 'CHARGEMENT DES SIGNATURES VOCALES DES CHERCHEURS (♂/♀)... [OK]', delay: 4550, type: 'ok' },
  { text: 'TERMINAL SITE-19 OPÉRATIONNEL — CANAL SÉCURISÉ ACTIF', delay: 5150, type: 'ok' },
  { text: '>_ ACCÈS AUTORISÉ. PRÉPARATION DU TEST D\'INOCULATION...', delay: 5750, type: 'access' },
];

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [phase, setPhase] = useState<'crt' | 'boot' | 'done'>('crt');
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('done');
    sfx.playTerminalBeep();
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // Handle keyboard skip (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  useEffect(() => {
    sfx.playBootSound();
    // Warm-up CRT phosphor delay (1.1s for authentic retro feel)
    const crtTimer = setTimeout(() => {
      setPhase('boot');
      sfx.playTerminalBeep();
    }, 1100);

    return () => clearTimeout(crtTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'boot') return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        if (line.type === 'ok') {
          sfx.playTerminalBeep();
        } else {
          sfx.playKeyClick();
        }
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, line.delay + 300);
      timers.push(t);
    });

    // Complete after last line + deliberate pause
    const doneTimer = setTimeout(() => {
      handleFinish();
    }, 6600);
    timers.push(doneTimer);

    return () => timers.forEach(clearTimeout);
  }, [phase, handleFinish]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${phase === 'crt' ? 'animate-crt-boot' : ''}`}
    >
      {/* Retro CRT scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.35) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))',
          backgroundSize: '100% 3px, 6px 100%',
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.95)', zIndex: 2 }}
      />

      {/* Skip button in corner */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleFinish}
          className="text-xs font-mono text-texte-attenue hover:text-accent-texte border border-bordure hover:border-accent-texte/60 bg-black/60 px-3 py-1 rounded transition-colors"
        >
          [ PASSER LA SÉQUENCE (ÉCHAP) ]
        </button>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-surface-1/90 border border-accent-texte/60 rounded-t px-3 py-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-texte/80 animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-classe-euclid/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-classe-safe/80" />
            <span className="ml-2 text-xs text-texte-attenue tracking-widest font-semibold">
              SCiPNET DIRECT CONSOLE // NOEUD SÉCURISÉ SITE-19
            </span>
          </div>
          <span className="text-xs text-accent-texte font-bold">CLEARANCE 4</span>
        </div>

        {/* Console content */}
        <div
          ref={containerRef}
          className="bg-black border border-t-0 border-accent-texte/50 rounded-b p-5 h-72 overflow-y-auto no-scrollbar shadow-2xl"
          style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.2)' }}
        >
          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className={`text-xs font-mono leading-relaxed transition-opacity duration-200 mb-1 ${
                visibleLines.includes(i) ? 'opacity-100' : 'opacity-0'
              } ${
                line.type === 'ok' ? 'text-classe-safe' :
                line.type === 'warn' ? 'text-classe-euclid' :
                line.type === 'access' ? 'text-accent-texte font-bold text-sm mt-3 animate-pulse' :
                'text-texte-second'
              }`}
            >
              {line.type !== 'access' && (
                <span className="text-texte-attenue mr-2 select-none">
                  [{String(i).padStart(2, '0')}]
                </span>
              )}
              {line.text}
              {line.type === 'ok' && visibleLines.includes(i) && (
                <span className="text-classe-safe ml-2 font-bold select-none">✓</span>
              )}
            </div>
          ))}

          {phase === 'boot' && visibleLines.length < BOOT_LINES.length && (
            <div className="text-xs font-mono text-accent-texte mt-1">
              &gt;_{' '}
              <span className="bg-accent-texte text-fond px-0.5 inline-block" style={{ opacity: cursorVisible ? 1 : 0 }}>
                █
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-fond rounded overflow-hidden border border-bordure">
          <div
            className="h-full bg-gradient-to-r from-surface-3 via-surface-3 to-surface-3 transition-all duration-300"
            style={{
              width: `${Math.min(100, (visibleLines.length / BOOT_LINES.length) * 100)}%`
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs font-mono text-texte-attenue">
          <span>SYSTÈME : SCiPNET v4.19 / RAISA</span>
          <span>INITIALISATION : {Math.min(100, Math.round((visibleLines.length / BOOT_LINES.length) * 100))}%</span>
        </div>
      </div>

      <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-40 select-none">
        <div className="text-xl font-mono font-bold text-accent-texte tracking-[0.25em]">☣ FONDATION SCP ☣</div>
        <div className="text-xs font-mono text-texte-attenue tracking-[0.3em]">SÉCURISER. CONTENIR. PROTÉGER.</div>
      </div>
    </div>
  );
};
