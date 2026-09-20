import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, ShieldCheck, AlertTriangle } from 'lucide-react';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

interface MobileBiometricScannerProps {
  scpTitle: string;
  onGranted: () => void;
}

export const MobileBiometricScanner: React.FC<MobileBiometricScannerProps> = ({
  scpTitle,
  onGranted
}) => {
  const t = useT();
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isGranted, setIsGranted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startScan = () => {
    setIsScanning(true);
    sfx.playTerminalBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  };

  const cancelScan = () => {
    if (!isGranted) {
      setIsScanning(false);
      setProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (isScanning && !isGranted) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsGranted(true);
            sfx.playAccessGranted();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 200]);
            }
            setTimeout(() => {
              onGranted();
            }, 600);
            return 100;
          }
          return prev + 6;
        });
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isScanning, isGranted, onGranted]);

  return (
    <div className="fixed inset-0 z-50 bg-fond/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 select-none animate-fadeIn">
      {/* Top Banner */}
      <div className="text-center mt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-3/80 border border-accent-texte/80 text-xs font-mono text-accent-texte mb-3">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          <span>{t('rp.verificationBio')}</span>
        </div>
        <h2 className="text-lg font-bold font-mono text-texte tracking-wider">
          {t('bio.accesDossier')}
        </h2>
        <p className="text-xs font-mono text-accent-texte mt-1">
          {scpTitle}
        </p>
      </div>

      {/* Center Biometric Thumb Zone */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Circular Progress Ring */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-texte-attenue"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              className={`transition-all duration-75 ${
                isGranted ? 'text-classe-safe' : 'text-accent-texte'
              }`}
              strokeWidth="6"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Scanner Button (Touch / Mouse hold) */}
          <button
            onMouseDown={startScan}
            onMouseUp={cancelScan}
            onTouchStart={startScan}
            onTouchEnd={cancelScan}
            className={`absolute inset-4 rounded-full flex flex-col items-center justify-center transition-all ${
              isGranted
                ? 'bg-surface-3/80 border-2 border-classe-safe text-classe-safe shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : isScanning
                ? 'bg-surface-3/80 border-2 border-accent-texte text-accent-texte shadow-[0_0_30px_rgba(220,38,38,0.5)] scale-95'
                : 'bg-surface-1 border-2 border-bordure text-texte-attenue active:scale-95'
            }`}
          >
            {isGranted ? (
              <ShieldCheck className="w-14 h-14 animate-bounce" />
            ) : (
              <Fingerprint className={`w-14 h-14 ${isScanning ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs font-mono text-texte-second font-semibold">
            {isGranted
              ? t('bio.autorisation')
              : isScanning
              ? `SCAN EN COURS... ${progress}%`
              : t('bio.maintenezPouce')}
          </p>
          <p className="text-xs font-mono text-texte-attenue mt-1">
            {t('bio.protocole')}
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center mb-4">
        <button
          onClick={() => {
            sfx.playAccessGranted();
            onGranted();
          }}
          className="text-xs font-mono text-texte-attenue underline hover:text-texte-second"
        >
          [Bypass d'urgence terminal Superviseur]
        </button>
      </div>
    </div>
  );
};
