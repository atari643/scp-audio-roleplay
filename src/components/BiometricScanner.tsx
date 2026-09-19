import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sfx } from '../services/sfxService';

interface BiometricScannerProps {
  scpTitle: string;
  onGranted: () => void;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({ scpTitle, onGranted }) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'holding' | 'granted' | 'denied'>('idle');
  const [scanY, setScanY] = useState(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef(false);
  const completedRef = useRef(false);

  const handleInstantGrant = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('granted');
    sfx.playAccessGranted();
    setTimeout(onGranted, 600);
  }, [onGranted]);

  useEffect(() => {
    scanRef.current = setInterval(() => {
      setScanY(y => (y >= 100 ? 0 : y + 2));
    }, 30);
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, []);

  const startHold = useCallback(() => {
    if (phase === 'granted' || completedRef.current) return;
    holdStartRef.current = true;
    setPhase('holding');
    sfx.playBiometricScan(2.6);

    holdRef.current = setInterval(() => {
      setHoldProgress(p => {
        const next = p + 1.15; // takes ~2.6s for full hold
        if (next >= 100) {
          if (holdRef.current) clearInterval(holdRef.current);
          holdStartRef.current = false;
          completedRef.current = true;
          setPhase('granted');
          sfx.playAccessGranted();
          setTimeout(onGranted, 1100);
          return 100;
        }
        return next;
      });
    }, 30);
  }, [phase, onGranted]);

  const stopHold = useCallback(() => {
    if (!holdStartRef.current || completedRef.current) return;
    holdStartRef.current = false;
    if (holdRef.current) clearInterval(holdRef.current);
    if (phase !== 'granted') {
      setPhase('denied');
      setHoldProgress(0);
      sfx.playCensorBeep(0.2);
      setTimeout(() => setPhase('idle'), 900);
    }
  }, [phase]);

  const getTelemetryText = () => {
    if (phase === 'granted') return 'AUTHENTIFICATION VALIDÉE // ACCÈS AUTORISÉ';
    if (phase === 'denied') return 'ERREUR D\'EMPREINTE — SIGNAL INTERROMPU';
    if (phase === 'idle') return 'Maintenez le doigt ou le clic sur le capteur';
    if (holdProgress < 25) return 'ACQUISITION DU SILLON DERMOPAPILLAIRE...';
    if (holdProgress < 55) return 'ANALYSE DES MINUTIES ET SILLONS...';
    if (holdProgress < 85) return 'COMPARAISON REGISTRE DU SITE-19...';
    return 'VÉRIFICATION ACCRÉDITATION NIVEAU 4...';
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-black/90 flex items-center justify-center p-6 animate-fade-scale select-none">
      <div className="w-full max-w-sm bg-scp-surface border border-scp-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="hazard-stripes-amber h-2" />
        <div className="p-4 border-b border-scp-border flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-classe-euclid tracking-widest font-semibold">
              SCiPNET // CONTRÔLE D'ACCÈS BIOMÉTRIQUE
            </div>
            <div className="text-sm font-mono text-texte font-bold truncate mt-0.5">{scpTitle}</div>
          </div>
          <button
            onClick={handleInstantGrant}
            className="text-xs font-mono text-texte-attenue hover:text-accent-texte border border-bordure hover:border-accent-texte px-2 py-1 rounded transition-colors"
          >
            [ PASSER ]
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          <div
            className={`relative w-36 h-44 rounded-xl border-2 cursor-pointer select-none overflow-hidden transition-colors ${
              phase === 'holding' ? 'border-classe-euclid shadow-lg shadow-amber-950/50' :
              phase === 'granted' ? 'border-classe-safe shadow-lg shadow-emerald-950/50' :
              phase === 'denied'  ? 'border-accent-texte animate-shake shadow-lg shadow-red-950/50' :
              'border-bordure-forte hover:border-bordure-forte'
            }`}
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />

            <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full p-3 opacity-40">
              {[8,16,24,32,40,48,56,64,72,80].map((r, i) => (
                <ellipse
                  key={i} cx="50" cy="60"
                  rx={r * 0.65} ry={r * 0.55}
                  fill="none"
                  stroke={
                    phase === 'granted'
                      ? 'var(--classe-safe)'
                      : phase === 'denied'
                      ? 'var(--accent-texte)'
                      : 'var(--texte-attenue)'
                  }
                  strokeWidth="1.2"
                  opacity={0.4 + i * 0.06}
                />
              ))}
            </svg>

            <div
              className="absolute left-0 right-0 h-0.5 pointer-events-none"
              style={{
                top: `${scanY}%`,
                background: phase === 'granted' ? 'rgba(16,185,129,0.9)' : 'rgba(220,38,38,0.85)',
                boxShadow: phase === 'granted'
                  ? '0 0 8px 2px rgba(16,185,129,0.6)'
                  : '0 0 8px 2px rgba(220,38,38,0.6)',
              }}
            />

            {phase === 'granted' && (
              <div className="absolute inset-0 bg-surface-3/80 flex items-center justify-center animate-fade-scale">
                <div className="text-center">
                  <div className="text-3xl mb-1 text-classe-safe font-bold">✓</div>
                  <div className="text-classe-safe font-mono font-bold text-xs">ACCÈS ACCORDÉ</div>
                </div>
              </div>
            )}
            {phase === 'denied' && (
              <div className="absolute inset-0 bg-surface-3/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-1 text-accent-texte font-bold">✗</div>
                  <div className="text-accent-texte font-mono font-bold text-xs">REFUSÉ</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center w-full">
            <p className="text-xs font-mono text-texte-second min-h-[32px] flex items-center justify-center text-center px-2 leading-tight">
              {getTelemetryText()}
            </p>

            <div className="w-full h-2 bg-fond rounded-full overflow-hidden border border-bordure mt-2 p-0.5">
              <div
                className={`h-full rounded-full transition-none ${
                  phase === 'granted' ? 'bg-classe-safe' : 'bg-gradient-to-r from-surface-3 to-surface-3'
                }`}
                style={{ width: `${holdProgress}%` }}
              />
            </div>
            <div className="text-xs font-mono text-texte-attenue mt-1 flex justify-between px-1">
              <span>CANAL BIOMÉTRIQUE</span>
              <span className="text-texte-attenue font-bold">{Math.round(holdProgress)}%</span>
            </div>
          </div>
        </div>

        <div className="hazard-stripes h-2" />
      </div>
    </div>
  );
};
