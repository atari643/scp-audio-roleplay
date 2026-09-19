import React, { useState, useEffect } from 'react';
import { Volume2, X } from 'lucide-react';
import { sfx } from '../services/sfxService';
import { CleTraduction, useT } from '../i18n';

/**
 * Les annonces de l'intercom, par clé.
 *
 * On stocke la clé et non le texte : le module est évalué une fois au
 * chargement, avant que la langue ne soit connue, et une annonce tirée au sort
 * doit sortir dans la langue affichée au moment où elle passe.
 */
const ANNONCES: CleTraduction[] = [
  'intercom.dosimetre',
  'intercom.transfert',
  'intercom.bright',
  'intercom.alarme',
  'intercom.keter',
  'intercom.protocoles'
];

interface IntercomAnnouncementProps {
  trigger: boolean;
}

export const IntercomAnnouncement: React.FC<IntercomAnnouncementProps> = ({ trigger }) => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    const cle = ANNONCES[Math.floor(Math.random() * ANNONCES.length)];
    setMessage(t(cle));
    setVisible(true);
    setFlash(true);
    sfx.playIntercom();

    const flashTimer = setTimeout(() => setFlash(false), 2700);
    const hideTimer  = setTimeout(() => setVisible(false), 7000);

    return () => { clearTimeout(flashTimer); clearTimeout(hideTimer); };
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-20 sm:top-24 right-3 sm:right-6 z-40 max-w-md w-[calc(100%-24px)] sm:w-auto flex items-start gap-3 p-3.5 bg-black/95 border-2 border-classe-euclid/80 rounded-xl shadow-2xl animate-slide-down ${
        flash ? 'animate-pa-flash border-classe-euclid' : ''
      }`}
      style={{ backdropFilter: 'blur(12px)', textShadow: '0 0 8px rgba(245, 158, 11, 0.3)' }}
    >
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-lg bg-surface-3/80 border border-classe-euclid/60 flex items-center justify-center">
          <Volume2 className="w-4 h-4 text-classe-euclid animate-alarm-pulse" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs tracking-widest text-classe-euclid font-bold font-mono uppercase">
            {t('intercom.diffusion')}
          </span>
          <span className="text-[8px] font-mono text-classe-euclid border border-classe-euclid/50 px-1 py-0.5 rounded">
            {t('intercom.canal')}
          </span>
        </div>
        <p className="text-xs font-mono text-classe-euclid leading-relaxed">
          {message}
        </p>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm text-texte-attenue hover:text-texte hover:bg-surface-3 transition-colors"
        title={t('rp.fermerAnnonce')}
        aria-label={t('rp.fermerAnnonce')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export function useIntercomAnnouncements(enabled: boolean): boolean {
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(() => {
      setTrigger(true);
      setTimeout(() => setTrigger(false), 100);
    }, 4000);

    const interval = setInterval(() => {
      setTrigger(true);
      setTimeout(() => setTrigger(false), 100);
    }, 120000);

    return () => { clearTimeout(first); clearInterval(interval); };
  }, [enabled]);

  return trigger;
}
