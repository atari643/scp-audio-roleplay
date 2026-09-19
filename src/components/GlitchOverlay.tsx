import React, { useEffect, useRef } from 'react';
import { ObjectClass } from '../types/scp';

const CLASS_INTENSITY: Record<string, string> = {
  'Safe':          'intensity-safe',
  'Euclid':        'intensity-euclid',
  'Keter':         'intensity-keter',
  'Apollyon':      'intensity-apollyon',
  'Thaumiel':      'intensity-euclid',
  'Archon':        'intensity-euclid',
  'Neutralized':   'intensity-safe',
  'Decommissioned':'intensity-safe',
  'Non assigné':   '',
};

interface GlitchOverlayProps {
  objectClass: ObjectClass | null;
  isActive: boolean;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ objectClass, isActive }) => {
  const glitchRef = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intensity = objectClass ? CLASS_INTENSITY[objectClass] || '' : '';
  const isDangerous = objectClass === 'Keter' || objectClass === 'Apollyon';

  useEffect(() => {
    if (!isActive || !isDangerous || !glitchRef.current) return;

    const scheduleGlitch = () => {
      const delay = 3000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        if (!glitchRef.current) return;
        const bar = document.createElement('div');
        const top = Math.random() * 95;
        const height = 1 + Math.random() * 3;
        const shift = (Math.random() - 0.5) * 16;
        bar.style.cssText = `
          position: absolute;
          left: 0; right: 0;
          top: ${top}%;
          height: ${height}px;
          background: rgba(220,38,38,${0.15 + Math.random() * 0.2});
          transform: translateX(${shift}px);
          pointer-events: none;
        `;
        glitchRef.current.appendChild(bar);
        setTimeout(() => bar.remove(), 100);
        scheduleGlitch();
      }, delay);
    };

    scheduleGlitch();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isActive, isDangerous]);

  if (!isActive || !intensity) return null;

  return (
    <>
      <div className={`glitch-noise-overlay ${intensity}`} />
      <div
        ref={glitchRef}
        className="fixed inset-0 pointer-events-none z-[997] overflow-hidden"
      />
      {isDangerous && (
        <div
          className="fixed inset-0 pointer-events-none z-[990]"
          style={{ animation: 'power-flicker 14s steps(1) infinite' }}
        />
      )}
    </>
  );
};
