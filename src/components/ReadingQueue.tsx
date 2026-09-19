import React, { useState } from 'react';
import { ListPlus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { WikiLink } from '../services/linkExtractor';
import { useT } from '../i18n';

interface ReadingQueueProps {
  queue: WikiLink[];
  onOpen: (link: WikiLink) => void;
  onRemove: (target: string) => void;
  onClear: () => void;
}

const KIND_LABEL: Record<WikiLink['kind'], string> = {
  scp: 'SCP',
  tale: 'CONTE',
  hub: 'HUB',
  goi: 'GDI',
  external: 'EXT'
};

/**
 * File « À SUIVRE » — partagée desktop et mobile.
 *
 * Elle existe pour une raison précise : dans une app audio, cliquer un lien en pleine
 * écoute fait perdre sa place. Le clic met donc de côté, et on enchaîne quand on veut.
 */
export const ReadingQueue: React.FC<ReadingQueueProps> = ({ queue, onOpen, onRemove, onClear }) => {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (queue.length === 0) return null;

  return (
    <div className="reading-queue mb-4">
      <button
        type="button"
        className="reading-queue__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <ListPlus className="w-3.5 h-3.5" />
        <span>{t('file.aSuivre')}</span>
        <span className="reading-queue__count">{queue.length}</span>
      </button>

      {open && (
        <div>
          {queue.map(link => (
            <div key={link.target} className="flex items-stretch">
              <button
                type="button"
                className="reading-queue__item flex-1"
                onClick={() => onOpen(link)}
                title={link.target}
              >
                <span className={`wiki-link-badge wiki-link--${link.kind}`}>
                  {KIND_LABEL[link.kind]}
                </span>
                <span className="truncate">{link.label}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(link.target)}
                className="px-3 border-t border-bordure/60 text-texte-attenue hover:text-accent-texte shrink-0"
                style={{ minWidth: 44 }}
                aria-label={t('file.retirer', { libelle: link.label })}
              >
                <X className="w-3.5 h-3.5 mx-auto" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="w-full py-2 text-xs font-mono uppercase tracking-wider text-texte-attenue hover:text-texte-second border-t border-bordure/60"
          >
            Vider la file
          </button>
        </div>
      )}
    </div>
  );
};
