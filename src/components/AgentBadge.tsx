import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const CLEARANCE_LEVELS = [
  { level: 1, label: 'NIVEAU 1', color: '#10b981', description: 'Acces general' },
  { level: 2, label: 'NIVEAU 2', color: '#06b6d4', description: 'Dossiers restreints' },
  { level: 3, label: 'NIVEAU 3', color: '#f59e0b', description: 'Anomalies actives' },
  { level: 4, label: 'NIVEAU 4 / RESTREINT', color: '#dc2626', description: 'Tous dossiers SCP' },
  { level: 5, label: 'O5-X', color: '#a855f7', description: 'Autorite absolue' },
];

interface AgentBadgeProps {
  hasActivePlayer?: boolean;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ hasActivePlayer = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [clearance] = useState(CLEARANCE_LEVELS[3]);
  const [badgeId] = useState(() => 'SCP-19-' + Math.floor(Math.random() * 90000 + 10000).toString());

  const bottomPosition = hasActivePlayer ? 'bottom-[72px] sm:bottom-[68px]' : 'bottom-3 sm:bottom-4';

  return (
    <div className={`fixed right-3 sm:right-6 z-40 flex flex-col items-end gap-1 transition-all duration-300 ${bottomPosition}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 bg-black/90 hover:bg-slate-900 border border-scp-border rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all shadow-xl backdrop-blur-md"
      >
        <Shield className="w-3.5 h-3.5" style={{ color: clearance.color }} />
        <span>BADGE {clearance.label}</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="animate-fade-scale animate-badge-float">
          <div
            className="relative w-56 rounded-xl overflow-hidden border"
            style={{
              borderColor: `${clearance.color}55`,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              boxShadow: `0 0 30px ${clearance.color}33, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="absolute inset-0 animate-holo-shimmer opacity-40 pointer-events-none rounded-xl" />

            <div
              className="px-3 py-1.5 flex items-center justify-between"
              style={{ backgroundColor: `${clearance.color}22`, borderBottom: `1px solid ${clearance.color}44` }}
            >
              <div className="text-[9px] font-mono font-bold tracking-widest" style={{ color: clearance.color }}>
                FONDATION SCP
              </div>
              <div className="animate-rfid w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clearance.color }} />
            </div>

            <div className="p-3">
              <div className="flex gap-3 items-start mb-3">
                <div
                  className="w-12 h-14 rounded flex items-center justify-center shrink-0 relative overflow-hidden bg-slate-800"
                  style={{ border: `1px solid ${clearance.color}33` }}
                >
                  <div className="absolute top-3 left-0 right-0 h-2.5 bg-black/90 z-10" />
                  <div className="text-2xl opacity-70">AGENT</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-mono text-slate-500 mb-0.5">IDENTIFIANT</div>
                  <div className="text-xs font-mono font-bold text-white">{badgeId}</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: clearance.color }}>
                    {clearance.label}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">{clearance.description}</div>
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

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                <span>RAISA CERT.</span>
                <span style={{ color: `${clearance.color}99` }}>
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
