import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { CharacterRole } from '../types/audioRoleplay';

interface HeartRateMonitorProps {
  isPlaying: boolean;
  currentRole: CharacterRole;
  className?: string;
  compact?: boolean;
}

const ROLE_BPM: Record<CharacterRole, { base: number; max: number; color: string }> = {
  narrator:   { base: 62,  max: 68,  color: '#06b6d4' },
  researcher: { base: 72,  max: 85,  color: '#10b981' },
  anomaly:    { base: 110, max: 145, color: '#ef4444' },
  classD:     { base: 90,  max: 115, color: '#f59e0b' },
  agent:      { base: 78,  max: 95,  color: '#06b6d4' },
  commander:  { base: 65,  max: 78,  color: '#a855f7' },
  intercom:   { base: 60,  max: 65,  color: '#94a3b8' },
};

function buildEcgPath(width: number, height: number, bpm: number): string {
  const period = (60 / bpm) * 100;
  const midY = height / 2;
  const points: [number, number][] = [];
  let x = 0;

  while (x < width * 2) {
    points.push([x, midY]);
    x += period * 0.3;
    points.push([x, midY]);
    x += 2; points.push([x, midY - height * 0.1]);
    x += 4; points.push([x, midY]);
    x += 4;
    points.push([x, midY + height * 0.05]);
    x += 2; points.push([x, midY - height * 0.42]);
    x += 2; points.push([x, midY + height * 0.25]);
    x += 3; points.push([x, midY]);
    x += 6; points.push([x, midY - height * 0.12]);
    x += 8; points.push([x, midY]);
    x += period * 0.2;
  }

  return points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
}

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({
  isPlaying, currentRole, className, compact = false
}) => {
  const svgRef = useRef<SVGPathElement>(null);
  const [currentBpm, setCurrentBpm] = useState(72);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const roleDef = ROLE_BPM[currentRole] || ROLE_BPM.narrator;

  useEffect(() => {
    const target = isPlaying
      ? roleDef.base + Math.random() * (roleDef.max - roleDef.base)
      : 65;
    const interval = setInterval(() => {
      setCurrentBpm(prev => {
        const diff = target - prev;
        return Math.abs(diff) < 0.5 ? target : prev + diff * 0.05;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, currentRole, roleDef]);

  useEffect(() => {
    if (compact) return;
    const W = 160;
    const H = 28;
    const pathD = buildEcgPath(W, H, currentBpm);
    const speed = (currentBpm / 60) * 0.8;

    const tick = () => {
      offsetRef.current -= speed;
      if (svgRef.current) {
        svgRef.current.setAttribute('d', pathD);
        svgRef.current.setAttribute('transform', `translate(${offsetRef.current % W},0)`);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentBpm, compact]);

  const bpmInt = Math.round(currentBpm);
  const isCritical = bpmInt > 115;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] font-mono select-none ${className || ''}`}>
        <Activity
          className={`w-3 h-3 shrink-0 ${isCritical ? 'animate-bpm-pulse text-red-500' : ''}`}
          style={{ color: roleDef.color }}
        />
        <span
          className={`font-bold tabular-nums ${isCritical ? 'animate-bpm-pulse' : ''}`}
          style={{ color: roleDef.color }}
        >
          {bpmInt}
        </span>
        <span className="text-[8px] text-slate-500">BPM</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className || ''}`}>
      <Activity
        className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'animate-bpm-pulse' : ''}`}
        style={{ color: roleDef.color }}
      />
      <div className="relative overflow-hidden" style={{ width: 70, height: 24 }}>
        <svg width="140" height="24" className="absolute left-0 top-0">
          <path
            ref={svgRef}
            fill="none"
            strokeWidth="1.5"
            stroke={roleDef.color}
            strokeLinecap="round"
            style={{ opacity: isPlaying ? 1 : 0.4 }}
          />
        </svg>
      </div>
      <div className="text-right min-w-[36px]">
        <div
          className={`text-xs font-mono font-bold tabular-nums ${isCritical ? 'animate-bpm-pulse' : ''}`}
          style={{ color: roleDef.color }}
        >
          {bpmInt}
        </div>
        <div className="text-[8px] font-mono text-slate-600">BPM</div>
      </div>
    </div>
  );
};
