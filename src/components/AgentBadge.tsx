import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../i18n';

const CLEARANCE_LEVELS = [
  { level: 1, label: 'NIVEAU 1', color: 'var(--classe-safe)', description: 'Accès général' },
  { level: 2, label: 'NIVEAU 2', color: 'var(--role-agent)', description: 'Dossiers restreints' },
  { level: 3, label: 'NIVEAU 3', color: 'var(--classe-euclid)', description: 'Anomalies actives' },
  { level: 4, label: 'NIVEAU 4 / RESTREINT', color: 'var(--accent-texte)', description: 'Tous dossiers SCP' },
  { level: 5, label: 'O5-X', color: 'var(--classe-thaumiel)', description: 'Autorité absolue' },
];

interface AgentBadgeProps {
  hasActivePlayer?: boolean;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ hasActivePlayer = false }) => {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [clearance] = useState(CLEARANCE_LEVELS[3]);
  const [badgeId] = useState(() => 'SCP-19-' + Math.floor(Math.random() * 90000 + 10000).toString());

  const bottomPosition = hasActivePlayer ? 'bottom-[72px] sm:bottom-[68px]' : 'bottom-3 sm:bottom-4';

  return (
    <div className={`fixed right-3 sm:right-6 z-40 flex flex-col items-end gap-1 transition-all duration-300 ${bottomPosition}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 bg-surface-1/95 hover:bg-surface-2 border border-bordure rounded px-3 py-1.5 text-xs font-mono text-texte-attenue hover:text-texte hover:border-bordure-forte transition-all shadow-xl backdrop-blur-md"
      >
        <Shield className="w-3.5 h-3.5" style={{ color: clearance.color }} />
        <span>BADGE {clearance.label}</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="animate-fade-scale">
          <div
            className="relative w-56 rounded overflow-hidden border"
            style={{
              borderColor: `color-mix(in srgb, ${clearance.color} 45%, transparent)`,
              background: 'var(--surface-1)',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              className="px-3 py-1.5 flex items-center justify-between"
              style={{
                backgroundColor: `color-mix(in srgb, ${clearance.color} 12%, transparent)`,
                borderBottom: `1px solid color-mix(in srgb, ${clearance.color} 35%, transparent)`
              }}
            >
              <div className="text-xs font-mono font-bold tracking-widest" style={{ color: clearance.color }}>
                FONDATION SCP
              </div>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clearance.color }} />
            </div>

            <div className="p-3">
              <div className="flex gap-3 items-start mb-3">
                <div
                  className="w-12 h-14 rounded flex items-center justify-center shrink-0 relative overflow-hidden bg-surface-2"
                  style={{ border: `1px solid color-mix(in srgb, ${clearance.color} 30%, transparent)` }}
                >
                  <div className="absolute top-3 left-0 right-0 h-2.5 bg-fond z-10" />
                  <div className="text-2xl opacity-70">{t('rp.agent')}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono text-texte-attenue mb-0.5">{t('rp.identifiant')}</div>
                  <div className="text-xs font-mono font-bold text-texte">{badgeId}</div>
                  <div className="text-xs font-mono mt-1" style={{ color: clearance.color }}>
                    {clearance.label}
                  </div>
                  <div className="text-xs font-mono text-texte-attenue">{clearance.description}</div>
                </div>
              </div>

              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(l => (
                  <div
                    key={l}
                    className="flex-1 h-1.5 rounded-sm"
                    style={{
                      backgroundColor: l <= clearance.level ? clearance.color : 'rgba(255,255,255,0.1)',
                      opacity: l <= clearance.level ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-texte-attenue">
                <span>RAISA CERT.</span>
                <span style={{ color: clearance.color }}>
                  ACTIF
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
