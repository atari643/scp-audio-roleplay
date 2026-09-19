import React, { useState, useEffect } from 'react';
import { sfx } from '../services/sfxService';

interface DeclassifiedStampProps {
  show: boolean;
  objectClass?: string;
}

export const DeclassifiedStamp: React.FC<DeclassifiedStampProps> = ({ show, objectClass }) => {
  const [slammed, setSlammed] = useState(false);

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => {
        setSlammed(true);
        sfx.playCensorBeep(0.08);
        sfx.playTerminalBeep();
      }, 350);
      return () => clearTimeout(t);
    } else {
      setSlammed(false);
    }
  }, [show]);

  const isKeter = objectClass === 'Keter' || objectClass === 'Apollyon';

  if (!show) return null;

  return (
    <div className={`pointer-events-none select-none absolute top-4 right-4 z-20 ${slammed ? 'animate-stamp-slam' : 'opacity-0'}`}>
      <div
        className="font-mono font-bold text-xs tracking-widest border-2 px-3 py-1.5 rounded"
        style={{
          border: `3px solid ${isKeter ? 'rgba(220,38,38,0.75)' : 'rgba(245,158,11,0.65)'}`,
          color: isKeter ? 'rgba(220,38,38,0.85)' : 'rgba(245,158,11,0.75)',
          backgroundColor: isKeter ? 'rgba(220,38,38,0.06)' : 'rgba(245,158,11,0.05)',
          transform: 'rotate(-7deg)',
          textShadow: isKeter ? '0 0 8px rgba(220,38,38,0.3)' : 'none',
        }}
      >
        DECLASSIFIE
        <div className="text-[8px] tracking-wider mt-0.5 text-center">PAR ORDRE DU CONSEIL O5</div>
      </div>
    </div>
  );
};
