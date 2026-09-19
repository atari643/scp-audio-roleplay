import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ObjectClass } from '../types/scp';
import { useT } from '../i18n';

interface ContainmentAlertProps {
  objectClass: ObjectClass;
  scpNumber: string;
  show: boolean;
  onDismiss: () => void;
}

const CLASS_LEVELS: Record<string, { level: number; label: string; color: string }> = {
  'Keter':     { level: 3, label: 'ALERTE KETER',     color: 'var(--classe-keter)' },
  'Apollyon':  { level: 4, label: 'APOLLYON CRITIQUE', color: 'var(--classe-apollyon)' },
  'Thaumiel':  { level: 2, label: 'ALERTE THAUMIEL',  color: 'var(--classe-thaumiel)' },
  'Euclid':    { level: 1, label: 'SURVEILLANCE EUCLID', color: 'var(--classe-euclid)' },
};

/**
 * Bande d'alerte de confinement — volontairement discrète.
 * Uniquement visuelle : aucun effet sonore, pas d'overlay plein écran.
 * Petite pastille semi-transparente en haut à gauche, effacée d'elle-même.
 */
export const ContainmentAlert: React.FC<ContainmentAlertProps> = ({
  objectClass, scpNumber, show, onDismiss
}) => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const alertDef = CLASS_LEVELS[objectClass];

  // onDismiss est recréé à chaque rendu parent (flèche inline) : on le garde
  // dans une ref pour que le minuteur ne soit pas réinitialisé à chaque tick
  // de lecture — sinon la pastille ne disparaîtrait jamais pendant l'écoute.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!show || !alertDef || alertDef.level < 1) return;
    setVisible(true);

    const t = setTimeout(() => {
      setVisible(false);
      onDismissRef.current();
    }, 6000);
    return () => clearTimeout(t);
  }, [show, alertDef]);

  if (!visible || !alertDef) return null;

  return (
    <div
      role="status"
      className="fixed top-16 left-3 z-[900] w-fit max-w-[calc(100vw-1.5rem)]"
    >
      <div
        className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-xs backdrop-blur-sm"
        style={{
          borderColor: `${alertDef.color}55`,
          backgroundColor: 'rgba(10,12,18,0.82)',
        }}
      >
        <ShieldAlert
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: alertDef.color }}
        />
        <span
          className="font-bold tracking-wider whitespace-nowrap"
          style={{ color: alertDef.color }}
        >
          {alertDef.label}
        </span>
        <span className="text-texte-attenue whitespace-nowrap">
          · {scpNumber.toUpperCase()}
        </span>
        <button
          onClick={() => { setVisible(false); onDismissRef.current(); }}
          className="-m-1 ml-0.5 p-2 text-texte-attenue hover:text-texte-second"
          aria-label={t('rp.fermerAlerte')}
        >
          [x]
        </button>
      </div>
    </div>
  );
};
