import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sfx } from '../services/sfxService';
import { ShieldAlert, Biohazard } from 'lucide-react';
import { useT } from '../i18n';

interface MemeticWarningProps {
  onComplete: () => void;
}

export const MemeticWarning: React.FC<MemeticWarningProps> = ({ onComplete }) => {
  const t = useT();
  const [scanProgress, setScanProgress] = useState(0);
  const [phase, setPhase] = useState<'warning' | 'scanning' | 'confirmed' | 'done'>('warning');
  const [telemetryVal, setTelemetryVal] = useState('7.4 Hz');
  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('done');
    sfx.playAccessGranted();
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // Phase 1: Heavy security alert on pure black background (2.2s deliberate pause)
  useEffect(() => {
    sfx.playCensorBeep(0.25);
    const t1 = setTimeout(() => {
      setPhase('scanning');
      sfx.playTerminalBeep();
    }, 2200);
    return () => clearTimeout(t1);
  }, []);

  // Phase 2: Deliberate slow synaptic scan (over ~4.2 seconds)
  useEffect(() => {
    if (phase !== 'scanning') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1.2;
      setScanProgress(Math.min(100, progress));

      // Telemetry frequency jitter
      const hz = (5.5 + Math.random() * 4.2).toFixed(1);
      setTelemetryVal(`${hz} Hz`);

      // Synaptic pulse sound every ~15%
      if (Math.floor(progress) % 15 === 0 && progress < 95) {
        sfx.playSynapticPulse(400 + progress * 8);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setPhase('confirmed');
        sfx.playAccessGranted();
        // Pause 1.8s on confirmation screen before entering terminal
        setTimeout(() => {
          handleFinish();
        }, 1800);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, handleFinish]);

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* CRT Scanline overlay on pure black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.45) 50%)',
          backgroundSize: '100% 4px',
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 160px rgba(0,0,0,0.98)', zIndex: 2 }}
      />

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleFinish}
          className="text-xs font-mono text-texte-attenue hover:text-accent-texte border border-bordure-faible hover:border-accent-texte/60 bg-black px-3 py-1 rounded transition-colors"
        >
          {t('memetique.passer')}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
        {/* Top Warning Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-3/80 border border-accent-texte text-accent-texte font-mono text-xs font-bold tracking-widest mb-6 animate-alarm-pulse">
          <Biohazard className="w-4 h-4 text-accent-texte animate-spin" style={{ animationDuration: '8s' }} />
          <span>{t('rp.avertissementMemetique')}</span>
          <ShieldAlert className="w-4 h-4 text-accent-texte" />
        </div>

        {/* Berryman-Langford Hypnotic Fractal */}
        <div className="relative mb-8 my-2">
          <div
            className="w-44 h-44 animate-memetic shadow-2xl"
            style={{
              background: 'conic-gradient(from 0deg, #dc2626 0deg, #991b1b 72deg, #7c3aed 144deg, #dc2626 216deg, #f59e0b 288deg, #dc2626 360deg)',
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              filter: 'drop-shadow(0 0 25px rgba(220, 38, 38, 0.7))',
              animationDuration: '7s',
            }}
          />

          {/* Concentric neural resonance rings */}
          {[36, 60, 84, 108].map((size, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full border pointer-events-none"
              style={{
                width: size * 1.6,
                height: size * 1.6,
                borderColor: i % 2 === 0 ? 'rgba(220, 38, 38, 0.35)' : 'rgba(245, 158, 11, 0.25)',
                transform: 'translate(-50%, -50%)',
                animation: `memetic-pulse ${6 + i * 1.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
              }}
            />
          ))}

          {/* Moving Laser Scan Line */}
          {phase === 'scanning' && (
            <div
              className="absolute left-0 right-0 h-1 bg-accent-texte pointer-events-none"
              style={{
                animation: 'memetic-scan 2.2s ease-in-out infinite',
                boxShadow: '0 0 12px 3px rgba(239, 68, 68, 0.9)',
                top: 0
              }}
            />
          )}
        </div>

        {/* Text and Protocol Notice */}
        <div className="w-full">
          <h2 className="text-texte font-mono font-bold text-base sm:text-lg tracking-wider mb-2">
            {t('memetique.protocole')}
          </h2>
          <p className="text-texte-attenue font-mono text-xs leading-relaxed mb-6 max-w-md mx-auto">
            {t('memetique.consultation')}
          </p>

          {/* Phase 1: Initializing */}
          {phase === 'warning' && (
            <div className="py-4 font-mono text-xs text-classe-euclid flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-classe-euclid animate-ping" />
              <span>{t('rp.calibration')}</span>
            </div>
          )}

          {/* Phase 2: Scanning */}
          {phase === 'scanning' && (
            <div className="w-full bg-fond border border-bordure p-4 rounded-xl shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-classe-euclid flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-classe-euclid animate-ping" />
                  {t('memetique.rythme')}
                </span>
                <span className="text-texte-attenue">{t('memetique.ondes', { valeur: String(telemetryVal) })}</span>
              </div>

              {/* Slow retro progress bar */}
              <div className="h-2.5 bg-black rounded-full overflow-hidden border border-bordure p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-surface-3 via-surface-3 to-surface-3 transition-all duration-100 shadow-lg"
                  style={{
                    width: `${scanProgress}%`,
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-texte-attenue mt-2">
                <span>{t('rp.resistance')}</span>
                <span className="text-classe-euclid font-bold">{t('memetique.effectue', { n: String(Math.round(scanProgress)) })}</span>
              </div>
            </div>
          )}

          {/* Phase 3: Confirmed */}
          {phase === 'confirmed' && (
            <div className="p-4 rounded-xl bg-surface-3/60 border border-classe-safe/80 text-center animate-fade-scale shadow-2xl">
              <div className="text-classe-safe font-mono font-bold text-sm sm:text-base flex items-center justify-center gap-2 mb-1">
                <span>{t('memetique.validee')}</span>
              </div>
              <div className="text-xs font-mono text-classe-safe">
                {t('memetique.statut')}
              </div>
              <div className="text-xs font-mono text-texte-attenue mt-2">
                {t('memetique.ouverture')}
              </div>
            </div>
          )}
        </div>

        {/* Subtle Footer Telemetry */}
        <div className="mt-8 text-xs font-mono text-texte-attenue tracking-widest">
          {t('memetique.securite')}
        </div>
      </div>
    </div>
  );
};
