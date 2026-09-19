import React, { useState } from 'react';
import { Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { DeviceMode } from '../hooks/useDeviceMode';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

interface DeviceSwitcherBadgeProps {
  mode: DeviceMode;
  isMobile: boolean;
  onToggle: () => void;
  onSetMode?: (mode: DeviceMode) => void;
  /**
   * Un lecteur occupe-t-il le bas de l'écran ? La pastille se pose au-dessus.
   *
   * Sans ça, elle tomberait sur les réglages de droite du lecteur de bureau
   * (volume, vitesse, studio) et sur le mini-lecteur du mobile.
   */
  lecteurVisible?: boolean;
}

/**
 * Bascule bureau ⇄ mobile.
 *
 * Elle occupait le coin haut-droit sous forme d'étiquette « VUE BUREAU · SWITCH ⇄ »,
 * c'est-à-dire la place la plus visible de l'écran pour un réglage qu'on touche une
 * fois. Ramenée à une pastille en bas à droite : l'icône dit l'état, le libellé ne
 * sort qu'au survol, et le retour en détection automatique n'apparaît que s'il y a
 * quelque chose à réinitialiser.
 */
export const DeviceSwitcherBadge: React.FC<DeviceSwitcherBadgeProps> = ({
  mode,
  isMobile,
  onToggle,
  onSetMode,
  lecteurVisible = false
}) => {
  const t = useT();
  const [deploye, setDeploye] = useState(false);

  const handleClick = () => {
    sfx.playTerminalBeep();
    onToggle();
  };

  const Icone = isMobile ? Smartphone : Monitor;
  const couleur = isMobile ? 'text-role-agent' : 'text-classe-euclid';
  const bordure = isMobile ? 'border-role-agent/50' : 'border-classe-euclid/50';

  // Hauteurs réelles des barres basses : 53 px pour la navigation mobile, à quoi
  // s'ajoute le mini-lecteur quand il est là ; environ 64 px pour le lecteur de
  // bureau. On y ajoute toujours le retrait de la barre de gestes.
  const basMobile = lecteurVisible ? 124 : 61;
  const basBureau = lecteurVisible ? 72 : 16;
  const bas = isMobile ? basMobile : basBureau;

  return (
    <aside
      aria-label={t('bascule.aria')}
      className="fixed right-3 z-[60] flex items-center gap-1.5"
      style={{ bottom: `calc(${bas}px + env(safe-area-inset-bottom, 0px))` }}
      onMouseEnter={() => setDeploye(true)}
      onMouseLeave={() => setDeploye(false)}
    >
      {mode !== 'auto' && onSetMode && (
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onSetMode('auto');
          }}
          title={t('bascule.auto')}
          aria-label={t('bascule.auto')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-fond/90 border border-bordure text-texte-attenue hover:text-texte hover:border-bordure-forte backdrop-blur-md shadow-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-texte"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        onClick={handleClick}
        onFocus={() => setDeploye(true)}
        onBlur={() => setDeploye(false)}
        title={
          isMobile
            ? 'Vue mobile — basculer vers la vue bureau'
            : 'Vue bureau — basculer vers la vue mobile'
        }
        aria-label={isMobile ? 'Basculer vers la vue bureau' : 'Basculer vers la vue mobile'}
        className={`h-11 min-w-11 flex items-center justify-center gap-1.5 rounded-full bg-fond/90 border ${bordure} ${couleur} backdrop-blur-md shadow-2xl px-3 font-mono text-xs font-bold tracking-technique transition-all hover:border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-texte`}
      >
        <Icone className="w-4 h-4 shrink-0" />
        {/* Le libellé ne s'ouvre qu'au survol ou au focus clavier : au repos, la
            pastille reste un rond de 44 px, la cible tactile minimale. */}
        <span
          className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
            deploye ? 'max-w-[7rem] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          {isMobile ? 'VUE MOBILE' : 'VUE BUREAU'}
        </span>
      </button>
    </aside>
  );
};
