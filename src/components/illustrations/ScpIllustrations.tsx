import React from 'react';

export interface IllustrationProps {
  className?: string;
  glowColor?: string;
}

// ==========================================
// 1. DÉPARTEMENTS DE LA FONDATION SCP (16)
// ==========================================

// 1. Pataphysique
export const PataphysicsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="95" stroke="#9333ea" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
    <circle cx="100" cy="100" r="85" stroke="#a855f7" strokeWidth="1" opacity="0.4" />
    <path d="M40 100 Q70 60 100 100 T160 100" stroke="#c084fc" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M40 100 Q70 140 100 100 T160 100" stroke="#c084fc" strokeWidth="3" fill="none" opacity="0.8" />
    <rect x="75" y="45" width="50" height="70" rx="3" stroke="#e9d5ff" strokeWidth="2" fill="#3b0764" fillOpacity="0.7" />
    <line x1="82" y1="60" x2="118" y2="60" stroke="#c084fc" strokeWidth="1.5" />
    <line x1="82" y1="72" x2="118" y2="72" stroke="#c084fc" strokeWidth="1.5" />
    <line x1="82" y1="84" x2="105" y2="84" stroke="#c084fc" strokeWidth="1.5" />
    <path d="M125 40 L95 130 L90 145 L105 140 L135 50 Z" fill="#d8b4fe" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="100" cy="100" r="8" fill="#e9d5ff" opacity="0.9" />
    <text x="100" y="180" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace" letterSpacing="2">
      METANARRATIVE // DEP-01
    </text>
  </svg>
);

// 2. Antimémétiques
export const AntimemeticsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="95" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
    <path d="M100 25 L165 55 V110 C165 150 100 178 100 178 C100 178 35 150 35 110 V55 Z" stroke="#10b981" strokeWidth="2.5" fill="#022c22" fillOpacity="0.8" />
    <path d="M50 100 Q100 55 150 100 Q100 145 50 100 Z" stroke="#34d399" strokeWidth="2" fill="#064e3b" fillOpacity="0.5" />
    <circle cx="100" cy="100" r="20" fill="#022c22" stroke="#6ee7b7" strokeWidth="2" />
    <circle cx="100" cy="100" r="8" fill="#10b981" />
    <line x1="60" y1="60" x2="140" y2="140" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
    <rect x="75" y="93" width="50" height="14" fill="#000000" stroke="#ef4444" strokeWidth="1" />
    <text x="100" y="103" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">
      [REDACTED]
    </text>
    <text x="100" y="165" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="monospace" letterSpacing="1.5">
      ANTIMEMETICS // NULL
    </text>
  </svg>
);

// 3. Comité d'Éthique
export const EthicsCommitteeIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="95" stroke="#d97706" strokeWidth="2" opacity="0.6" />
    <line x1="100" y1="35" x2="100" y2="160" stroke="#f59e0b" strokeWidth="3" />
    <line x1="50" y1="60" x2="150" y2="60" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M50 60 L35 110 H65 Z" stroke="#fcd34d" strokeWidth="2" fill="#78350f" fillOpacity="0.7" />
    <path d="M150 60 L135 110 H165 Z" stroke="#fcd34d" strokeWidth="2" fill="#78350f" fillOpacity="0.7" />
    <path d="M90 35 L100 20 L110 35 Z" fill="#f59e0b" />
    <circle cx="100" cy="100" r="14" fill="#1c1917" stroke="#f59e0b" strokeWidth="2" />
    <path d="M100 90 L100 96 M94 104 L100 100 L106 104" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" />
    <text x="100" y="180" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" letterSpacing="2">
      ETHICS COMMITTEE // O5-E
    </text>
  </svg>
);

// 4. RAISA
export const RaisaIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="8" stroke="#2563eb" strokeWidth="2" fill="#0f172a" />
    <rect x="40" y="40" width="120" height="90" rx="4" stroke="#3b82f6" strokeWidth="2" fill="#1e3a8a" fillOpacity="0.6" />
    <circle cx="100" cy="80" r="22" stroke="#60a5fa" strokeWidth="2" fill="#0284c7" fillOpacity="0.3" />
    <path d="M96 74 C96 71 104 71 104 74 C104 78 101 80 101 83 L101 88" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="100" cy="94" r="2" fill="#ffffff" />
    <line x1="50" y1="145" x2="150" y2="145" stroke="#3b82f6" strokeWidth="2" />
    <rect x="70" y="150" width="60" height="12" rx="2" fill="#1e293b" stroke="#60a5fa" strokeWidth="1" />
    <text x="100" y="120" textAnchor="middle" fill="#93c5fd" fontSize="7" fontFamily="monospace" letterSpacing="2">
      SCIPNET // SEC-02
    </text>
  </svg>
);

// 5. Alchimie
export const AlchemyIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
    <polygon points="100,28 172,152 28,152" stroke="#facc15" strokeWidth="2.5" fill="#422006" fillOpacity="0.6" />
    <polygon points="100,172 28,48 172,48" stroke="#ca8a04" strokeWidth="1.5" opacity="0.5" />
    <circle cx="100" cy="100" r="35" stroke="#fef08a" strokeWidth="2" />
    <circle cx="100" cy="92" r="10" stroke="#facc15" strokeWidth="2" fill="none" />
    <line x1="100" y1="102" x2="100" y2="122" stroke="#facc15" strokeWidth="2" />
    <line x1="90" y1="112" x2="110" y2="112" stroke="#facc15" strokeWidth="2" />
    <text x="100" y="186" textAnchor="middle" fill="#facc15" fontSize="8" fontFamily="monospace" letterSpacing="1.5">
      SOLVE ET COAGULA
    </text>
  </svg>
);

// 6. Anomalies Temporelles
export const TemporalIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="95" stroke="#06b6d4" strokeWidth="2" opacity="0.5" />
    <circle cx="100" cy="100" r="75" stroke="#22d3ee" strokeWidth="3" fill="#083344" fillOpacity="0.7" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
      <line key={i} x1="100" y1="32" x2="100" y2="40" stroke="#67e8f9" strokeWidth="2" transform={`rotate(${deg} 100 100)`} />
    ))}
    <line x1="100" y1="100" x2="135" y2="75" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <line x1="100" y1="100" x2="100" y2="55" stroke="#a5f3fc" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M70 145 C60 115 80 85 100 85 C130 85 140 120 120 135 C100 150 80 130 100 115" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 2" fill="none" />
    <text x="100" y="185" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" letterSpacing="2">
      XACTS // TACHYON
    </text>
  </svg>
);

// 7. Désinformation
export const DisinformationIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="95" stroke="#64748b" strokeWidth="2" opacity="0.6" />
    <rect x="40" y="45" width="120" height="110" rx="4" stroke="#94a3b8" strokeWidth="2" fill="#0f172a" />
    <rect x="52" y="60" width="96" height="10" fill="#334155" />
    <rect x="52" y="78" width="80" height="10" fill="#000000" stroke="#dc2626" strokeWidth="1" />
    <rect x="52" y="96" width="96" height="10" fill="#334155" />
    <rect x="52" y="114" width="60" height="10" fill="#000000" stroke="#dc2626" strokeWidth="1" />
    <line x1="30" y1="30" x2="170" y2="170" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 5" opacity="0.7" />
    <text x="100" y="180" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" letterSpacing="1.5">
      COVER-STORY // CLASS-A
    </text>
  </svg>
);

// 8. Tactical / FIM
export const TacticalIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#dc2626" strokeWidth="2.5" opacity="0.7" />
    <circle cx="100" cy="100" r="60" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="8 4" />
    <line x1="100" y1="15" x2="100" y2="185" stroke="#f87171" strokeWidth="2" />
    <line x1="15" y1="100" x2="185" y2="100" stroke="#f87171" strokeWidth="2" />
    <circle cx="100" cy="100" r="8" stroke="#fee2e2" strokeWidth="2" fill="#991b1b" />
    <path d="M70 145 L100 120 L130 145" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="100" y="45" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      MTF // EPSILON-11
    </text>
  </svg>
);

// 9. Théologie Tactique
export const TacticalTheologyIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#f59e0b" strokeWidth="2.5" opacity="0.7" />
    <polygon points="100,25 125,75 180,75 135,110 155,165 100,130 45,165 65,110 20,75 75,75" stroke="#fbbf24" strokeWidth="2" fill="#451a03" fillOpacity="0.6" />
    <circle cx="100" cy="100" r="30" stroke="#fef3c7" strokeWidth="2" fill="#78350f" />
    <line x1="100" y1="80" x2="100" y2="120" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <line x1="85" y1="92" x2="115" y2="92" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <text x="100" y="185" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      TACTICAL THEOLOGY // DEICIDE
    </text>
  </svg>
);

// 10. Mémétique
export const MemeticsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#10b981" strokeWidth="2" opacity="0.6" />
    <circle cx="100" cy="100" r="70" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
    <circle cx="100" cy="100" r="50" stroke="#6ee7b7" strokeWidth="2" />
    <circle cx="100" cy="100" r="30" stroke="#a7f3d0" strokeWidth="3" fill="#064e3b" />
    <circle cx="100" cy="100" r="12" fill="#ef4444" />
    {[0, 60, 120, 180, 240, 300].map((ang, i) => (
      <path key={i} d="M100 100 Q140 60 160 100" stroke="#34d399" strokeWidth="1.5" fill="none" transform={`rotate(${ang} 100 100)`} />
    ))}
    <text x="100" y="185" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      COGNITOHAZARD // KILL-AGENT
    </text>
  </svg>
);

// 11. Déclassement
export const DecommissioningIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#e11d48" strokeWidth="2.5" opacity="0.8" />
    <polygon points="100,35 165,150 35,150" stroke="#f43f5e" strokeWidth="3" fill="#4c0519" fillOpacity="0.7" />
    <line x1="60" y1="60" x2="140" y2="140" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
    <line x1="140" y1="60" x2="60" y2="140" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
    <circle cx="100" cy="100" r="18" fill="#9f1239" stroke="#fda4af" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#fda4af" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      DECOMMISSIONING // TERMINATE
    </text>
  </svg>
);

// 12. Affaires Internes
export const InternalAffairsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#64748b" strokeWidth="2.5" opacity="0.8" />
    <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" stroke="#94a3b8" strokeWidth="2" fill="#0f172a" />
    <circle cx="100" cy="100" r="35" stroke="#cbd5e1" strokeWidth="2" fill="#1e293b" />
    <circle cx="100" cy="100" r="14" fill="#38bdf8" />
    <circle cx="100" cy="100" r="6" fill="#ffffff" />
    <line x1="100" y1="65" x2="100" y2="75" stroke="#94a3b8" strokeWidth="2" />
    <line x1="100" y1="125" x2="100" y2="135" stroke="#94a3b8" strokeWidth="2" />
    <text x="100" y="188" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      INTERNAL AFFAIRS // IA-10
    </text>
  </svg>
);

// 13. Surréalisme
export const SurrealismIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#c026d3" strokeWidth="2" opacity="0.7" />
    <path d="M50 80 Q100 40 150 70 Q140 130 100 120 Q60 140 50 80 Z" stroke="#e879f9" strokeWidth="2.5" fill="#4a044e" fillOpacity="0.6" />
    <ellipse cx="100" cy="90" rx="35" ry="20" stroke="#f0abfc" strokeWidth="2" fill="#701a75" />
    <circle cx="100" cy="90" r="10" fill="#fdf4ff" />
    <circle cx="102" cy="88" r="4" fill="#a21caf" />
    <path d="M120 110 C130 150 110 170 85 160" stroke="#f0abfc" strokeWidth="3" strokeLinecap="round" fill="none" />
    <text x="100" y="185" textAnchor="middle" fill="#f5d0fe" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SURREALISM // CECI N'EST PAS UN SCP
    </text>
  </svg>
);

// 14. Astrophysique
export const AstrophysicsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#6366f1" strokeWidth="2.5" opacity="0.8" />
    <circle cx="100" cy="100" r="45" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
    <ellipse cx="100" cy="100" rx="75" ry="25" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="150" cy="90" r="6" fill="#818cf8" />
    <circle cx="45" cy="110" r="4" fill="#c7d2fe" />
    <path d="M100 25 L100 45 M100 155 L100 175" stroke="#818cf8" strokeWidth="2" />
    <text x="100" y="188" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      ASTROPHYSICS // DEEP SPACE
    </text>
  </svg>
);

// 15. Médical
export const MedicalIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#0d9488" strokeWidth="2.5" opacity="0.7" />
    <rect x="85" y="40" width="30" height="120" rx="4" fill="#14b8a6" />
    <rect x="40" y="85" width="120" height="30" rx="4" fill="#14b8a6" />
    <circle cx="100" cy="100" r="18" fill="#042f2e" stroke="#5eead4" strokeWidth="2" />
    <path d="M90 100 L96 100 L99 92 L103 108 L106 97 L109 100 L114 100" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" fill="none" />
    <text x="100" y="185" textAnchor="middle" fill="#5eead4" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      MEDICAL // TRAUMA CARE
    </text>
  </svg>
);

// 16. Cryptographie
export const CryptographyIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="8" stroke="#7c3aed" strokeWidth="2.5" fill="#1e1b4b" />
    <circle cx="100" cy="85" r="28" stroke="#a78bfa" strokeWidth="2.5" fill="#2e1065" />
    <path d="M100 70 V85 M100 85 L112 95" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" />
    <rect x="55" y="130" width="90" height="24" rx="4" fill="#0f0b29" stroke="#8b5cf6" strokeWidth="1" />
    <text x="100" y="146" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="monospace" fontWeight="bold">
      01100011 01110010
    </text>
    <text x="100" y="188" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace" letterSpacing="1">
      QUANTUM CIPHER // DEP-14
    </text>
  </svg>
);

// ==========================================
// 2. CHERCHEURS & PERSONNELS CLÉS (16)
// ==========================================

// 1. Dr. Bright
export const BrightIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#f59e0b" strokeWidth="2" fill="#1c1917" />
    <circle cx="100" cy="85" r="38" stroke="#fbbf24" strokeWidth="3" fill="#78350f" fillOpacity="0.8" />
    <polygon points="100,55 125,75 120,105 100,120 80,105 75,75" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />
    <circle cx="100" cy="88" r="10" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="85" y1="20" x2="100" y2="52" stroke="#d97706" strokeWidth="2" />
    <line x1="115" y1="20" x2="100" y2="52" stroke="#d97706" strokeWidth="2" />
    <rect x="40" y="140" width="120" height="22" fill="#000000" stroke="#f59e0b" strokeWidth="1" />
    <text x="100" y="155" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. BRIGHT // SCP-963
    </text>
  </svg>
);

// 2. Dr. Clef
export const ClefIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#dc2626" strokeWidth="2" fill="#18181b" />
    <ellipse cx="100" cy="55" rx="55" ry="14" fill="#3f3f46" stroke="#71717a" strokeWidth="2" />
    <path d="M70 55 C70 30 130 30 130 55 Z" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
    <circle cx="100" cy="95" r="28" fill="#18181b" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
    <rect x="75" y="85" width="50" height="20" fill="#000000" stroke="#ef4444" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">
      [VISAGE BROUILLÉ]
    </text>
    <text x="100" y="165" textAnchor="middle" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. ALTO CLEF // SCI-KETER
    </text>
  </svg>
);

// 3. Dr. Gears
export const GearsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#0891b2" strokeWidth="2" fill="#0f172a" />
    <circle cx="100" cy="85" r="42" stroke="#22d3ee" strokeWidth="3" fill="#164e63" fillOpacity="0.5" />
    <circle cx="100" cy="85" r="22" stroke="#67e8f9" strokeWidth="2" fill="#083344" />
    <circle cx="100" cy="85" r="8" fill="#cffafe" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => (
      <rect key={i} x="96" y="38" width="8" height="12" rx="1" fill="#22d3ee" transform={`rotate(${ang} 100 85)`} />
    ))}
    <text x="100" y="162" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. GEARS // PURE LOGIC
    </text>
  </svg>
);

// 4. Dr. Kondraki
export const KondrakiIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#059669" strokeWidth="2" fill="#022c22" />
    <rect x="55" y="55" width="90" height="60" rx="6" stroke="#10b981" strokeWidth="2" fill="#064e3b" />
    <circle cx="100" cy="85" r="20" stroke="#34d399" strokeWidth="3" fill="#022c22" />
    <circle cx="100" cy="85" r="8" fill="#6ee7b7" />
    <path d="M100 70 Q120 45 135 60 Q125 75 100 75 Q75 75 65 60 Q80 45 100 70 Z" fill="#34d399" opacity="0.8" />
    <text x="100" y="155" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. KONDRAKI // SCP-408
    </text>
  </svg>
);

// 5. Dr. Scranton
export const ScrantonIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#ec4899" strokeWidth="2" fill="#180415" />
    <circle cx="100" cy="85" r="45" stroke="#f472b6" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
    <rect x="70" y="55" width="60" height="60" rx="4" stroke="#f43f5e" strokeWidth="2" fill="#4c0519" fillOpacity="0.8" />
    <circle cx="100" cy="85" r="14" fill="#881337" stroke="#fda4af" strokeWidth="2" />
    <circle cx="100" cy="85" r="3" fill="#f43f5e" />
    <rect x="45" y="130" width="110" height="14" fill="#000000" stroke="#f43f5e" strokeWidth="1" />
    <rect x="47" y="132" width="30" height="10" fill="#ec4899" />
    <text x="100" y="140" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">
      HUME: 0.05 // CRITICAL
    </text>
    <text x="100" y="165" textAnchor="middle" fill="#f472b6" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. SCRANTON // SRA-3001
    </text>
  </svg>
);

// 6. Directrice Marion Wheeler
export const WheelerIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#0d9488" strokeWidth="2" fill="#042f2e" />
    <circle cx="100" cy="80" r="35" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 2" />
    <path d="M100 55 V80 L115 90" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" />
    <rect x="80" y="115" width="40" height="12" rx="6" fill="#14b8a6" />
    <text x="100" y="124" textAnchor="middle" fill="#042f2e" fontSize="7" fontFamily="monospace" fontWeight="bold">CLASS-W</text>
    <text x="100" y="160" textAnchor="middle" fill="#5eead4" fontSize="8" fontFamily="monospace" fontWeight="bold">
      MARION WHEELER // ANTIMEMETICS
    </text>
  </svg>
);

// 7. Dr. Agatha Rights
export const RightsIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#ec4899" strokeWidth="2" fill="#2a081a" />
    <circle cx="100" cy="75" r="28" stroke="#f472b6" strokeWidth="2" fill="#831843" />
    <path d="M92 75 C92 70 96 66 100 70 C104 66 108 70 108 75 C108 82 100 88 100 88 C100 88 92 82 92 75 Z" fill="#fb7185" />
    <rect x="65" y="115" width="70" height="22" rx="3" stroke="#f472b6" strokeWidth="1" fill="#1f0614" />
    <text x="100" y="130" textAnchor="middle" fill="#fbcfe8" fontSize="7" fontFamily="monospace">HUMANOID ANALYST</text>
    <text x="100" y="162" textAnchor="middle" fill="#f472b6" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. AGATHA RIGHTS
    </text>
  </svg>
);

// 8. Le Conseil O5
export const O5CouncilIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#dc2626" strokeWidth="3" opacity="0.9" />
    <circle cx="100" cy="100" r="65" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <circle cx="100" cy="100" r="25" fill="#450a0a" stroke="#ffffff" strokeWidth="2" />
    <text x="100" y="106" textAnchor="middle" fill="#ffffff" fontSize="16" fontFamily="monospace" fontWeight="900">
      O5
    </text>
    {[0, 27.7, 55.4, 83.1, 110.8, 138.5, 166.2, 193.8, 221.5, 249.2, 276.9, 304.6, 332.3].map((deg, i) => (
      <circle key={i} cx="100" cy="35" r="4" fill="#ef4444" transform={`rotate(${deg} 100 100)`} />
    ))}
    <text x="100" y="182" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      O5 OVERSEER COUNCIL // XIII
    </text>
  </svg>
);

// 9. Dr. Everett Mann
export const MannIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#b91c1c" strokeWidth="2" fill="#1c0a0a" />
    <circle cx="100" cy="80" r="35" stroke="#ef4444" strokeWidth="2" fill="#3b0a0a" />
    <path d="M85 65 L115 95 M115 65 L85 95" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <rect x="70" y="125" width="60" height="15" rx="3" fill="#450a0a" stroke="#f87171" strokeWidth="1" />
    <text x="100" y="136" textAnchor="middle" fill="#fca5a5" fontSize="7" fontFamily="monospace">SURGEON-GENERAL</text>
    <text x="100" y="162" textAnchor="middle" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. EVERETT MANN
    </text>
  </svg>
);

// 10. Dr. Simon Glass
export const GlassIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#0284c7" strokeWidth="2" fill="#082f49" />
    <circle cx="100" cy="75" r="30" stroke="#38bdf8" strokeWidth="2" fill="#0c4a6e" />
    <ellipse cx="85" cy="75" rx="10" ry="10" stroke="#bae6fd" strokeWidth="2" fill="none" />
    <ellipse cx="115" cy="75" rx="10" ry="10" stroke="#bae6fd" strokeWidth="2" fill="none" />
    <line x1="95" y1="75" x2="105" y2="75" stroke="#bae6fd" strokeWidth="2" />
    <text x="100" y="135" textAnchor="middle" fill="#bae6fd" fontSize="7" fontFamily="monospace">PSYCHOLOGY HEAD</text>
    <text x="100" y="162" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. SIMON GLASS
    </text>
  </svg>
);

// 11. Dr. Sophia Light
export const LightIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#d97706" strokeWidth="2" fill="#291e0a" />
    <polygon points="100,50 125,95 75,95" stroke="#fbbf24" strokeWidth="2" fill="#78350f" />
    <circle cx="100" cy="80" r="6" fill="#fde68a" />
    <rect x="65" y="115" width="70" height="15" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
    <text x="100" y="126" textAnchor="middle" fill="#fde68a" fontSize="7" fontFamily="monospace">SITE-41 DIRECTOR</text>
    <text x="100" y="162" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. SOPHIA LIGHT
    </text>
  </svg>
);

// 12. Dr. Django Bridge
export const BridgeIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#ea580c" strokeWidth="2" fill="#2a1205" />
    <rect x="65" y="55" width="70" height="50" rx="4" stroke="#fb923c" strokeWidth="2" fill="#431407" />
    <line x1="75" y1="70" x2="125" y2="70" stroke="#fdba74" strokeWidth="2" />
    <line x1="75" y1="85" x2="115" y2="85" stroke="#fdba74" strokeWidth="2" />
    <text x="100" y="132" textAnchor="middle" fill="#fdba74" fontSize="7" fontFamily="monospace">CHIEF ARCHIVIST</text>
    <text x="100" y="162" textAnchor="middle" fill="#fb923c" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. DJANGO BRIDGE
    </text>
  </svg>
);

// 13. Dr. King (Pépins de pomme)
export const KingIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#65a30d" strokeWidth="2" fill="#142306" />
    <circle cx="90" cy="80" r="25" fill="#ef4444" opacity="0.8" />
    <circle cx="110" cy="80" r="25" fill="#ef4444" opacity="0.8" />
    {[85, 95, 105, 115].map((x, i) => (
      <ellipse key={i} cx={x} cy="80" rx="3" ry="5" fill="#451a03" stroke="#fef08a" strokeWidth="1" />
    ))}
    <text x="100" y="130" textAnchor="middle" fill="#bef264" fontSize="7" fontFamily="monospace">APPLE SEEDS // ONLY</text>
    <text x="100" y="162" textAnchor="middle" fill="#a3e635" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. KING // EXPERIMENT
    </text>
  </svg>
);

// 14. Dr. Iceberg
export const IcebergIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#06b6d4" strokeWidth="2" fill="#082f3a" />
    <polygon points="100,45 135,105 65,105" stroke="#67e8f9" strokeWidth="2" fill="#164e63" />
    <line x1="100" y1="45" x2="100" y2="105" stroke="#cffafe" strokeWidth="1.5" />
    <text x="100" y="130" textAnchor="middle" fill="#a5f3fc" fontSize="8" fontFamily="monospace" fontWeight="bold">-7°C CONSTANT</text>
    <text x="100" y="162" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. ICEBERG // DEMOLITION
    </text>
  </svg>
);

// 15. Dr. Dan (SCRAMBLE)
export const DanIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#e11d48" strokeWidth="2" fill="#2b0812" />
    <rect x="55" y="65" width="40" height="25" rx="3" stroke="#f43f5e" strokeWidth="2" fill="#000000" />
    <rect x="105" y="65" width="40" height="25" rx="3" stroke="#f43f5e" strokeWidth="2" fill="#000000" />
    <line x1="95" y1="77" x2="105" y2="77" stroke="#f43f5e" strokeWidth="2" />
    <text x="75" y="81" textAnchor="middle" fill="#f43f5e" fontSize="6" fontFamily="monospace">HUD</text>
    <text x="125" y="81" textAnchor="middle" fill="#f43f5e" fontSize="6" fontFamily="monospace">096</text>
    <text x="100" y="130" textAnchor="middle" fill="#fda4af" fontSize="7" fontFamily="monospace">PROJECT SCRAMBLE</text>
    <text x="100" y="162" textAnchor="middle" fill="#fb7185" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DR. DAN // TACTICIAN
    </text>
  </svg>
);

// 16. Agent Dmitri Strelnikov
export const StrelnikovIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="20" width="150" height="160" rx="6" stroke="#dc2626" strokeWidth="2" fill="#2b0a0a" />
    <polygon points="100,50 108,68 128,68 112,80 118,98 100,86 82,98 88,80 72,68 92,68" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
    <line x1="60" y1="115" x2="140" y2="115" stroke="#f87171" strokeWidth="2" />
    <text x="100" y="135" textAnchor="middle" fill="#fca5a5" fontSize="7" fontFamily="monospace">SECURITY CHIEF SITE-19</text>
    <text x="100" y="162" textAnchor="middle" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">
      DMITRI STRELNIKOV
    </text>
  </svg>
);

// ==========================================
// 3. GROUPES D'INTÉRÊT (16)
// ==========================================

// 1. GOC
export const GocIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#2563eb" strokeWidth="3" opacity="0.8" />
    <ellipse cx="100" cy="100" rx="60" ry="30" stroke="#60a5fa" strokeWidth="1.5" />
    <ellipse cx="100" cy="100" rx="30" ry="60" stroke="#60a5fa" strokeWidth="1.5" />
    <path d="M100 30 L100 170" stroke="#ffffff" strokeWidth="3" />
    <path d="M85 55 L100 35 L115 55" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
    <text x="100" y="185" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      GLOBAL OCCULT COALITION
    </text>
  </svg>
);

// 2. Insurrection du Chaos
export const ChaosIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#dc2626" strokeWidth="2.5" opacity="0.8" />
    <circle cx="100" cy="100" r="40" stroke="#ef4444" strokeWidth="3" fill="#450a0a" />
    {[0, 120, 240].map((ang, i) => (
      <g key={i} transform={`rotate(${ang} 100 100)`}>
        <path d="M100 60 L100 18" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
        <path d="M92 32 L100 16 L108 32" stroke="#f87171" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
      </g>
    ))}
    <polygon points="100,80 118,110 82,110" fill="#fca5a5" stroke="#ffffff" strokeWidth="1.5" />
    <text x="100" y="185" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      CHAOS INSURGENCY // DELTA
    </text>
  </svg>
);

// 3. Main du Serpent
export const SerpentsHandIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#10b981" strokeWidth="2" opacity="0.7" />
    <path d="M50 135 Q100 120 150 135 L155 85 Q100 70 45 85 Z" stroke="#34d399" strokeWidth="2" fill="#064e3b" />
    <path d="M100 35 C70 50 80 80 100 95 C120 110 110 140 85 145" stroke="#a7f3d0" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="102" cy="38" r="3" fill="#ffffff" />
    <text x="100" y="182" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      THE SERPENT'S HAND
    </text>
  </svg>
);

// 4. Dieu Brisé
export const BrokenGodIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#d97706" strokeWidth="2.5" opacity="0.8" />
    <circle cx="100" cy="100" r="65" stroke="#f59e0b" strokeWidth="4" fill="#451a03" />
    <circle cx="100" cy="100" r="35" stroke="#fbbf24" strokeWidth="2.5" fill="#78350f" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
      <rect key={i} x="94" y="28" width="12" height="15" rx="2" fill="#f59e0b" transform={`rotate(${deg} 100 100)`} />
    ))}
    <text x="100" y="185" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      CHURCH OF THE BROKEN GOD
    </text>
  </svg>
);

// 5. Sarkic
export const SarkicIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#991b1b" strokeWidth="2.5" opacity="0.8" />
    <path d="M100 30 C140 30 165 70 165 100 C165 140 130 165 100 165 C60 165 35 130 35 100 C35 60 70 30 100 30 Z" stroke="#dc2626" strokeWidth="3" fill="#450a0a" />
    <path d="M80 80 Q100 50 120 80 Q140 110 100 130 Q60 110 80 80 Z" fill="#b91c1c" stroke="#f87171" strokeWidth="2" />
    <circle cx="100" cy="100" r="10" fill="#fca5a5" />
    <text x="100" y="185" textAnchor="middle" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      SARKIC CULTS // ION
    </text>
  </svg>
);

// 6. MC&D
export const McdIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" stroke="#ca8a04" strokeWidth="2" fill="#1e1b4b" />
    <rect x="35" y="35" width="130" height="130" stroke="#eab308" strokeWidth="1" strokeDasharray="4 2" />
    <path d="M100 50 L130 80 V120 L100 145 L70 120 V80 Z" stroke="#facc15" strokeWidth="2" fill="#2e1065" />
    <circle cx="100" cy="85" r="14" stroke="#fde047" strokeWidth="2" fill="none" />
    <text x="100" y="184" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      MARSHALL, CARTER & DARK
    </text>
  </svg>
);

// 7. Wondertainment
export const WondertainmentIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#9333ea" strokeWidth="2.5" opacity="0.8" />
    <path d="M60 130 C40 90 70 50 100 70 C130 50 160 90 140 130 C120 160 80 160 60 130 Z" stroke="#c084fc" strokeWidth="3" fill="#581c87" />
    <circle cx="85" cy="95" r="8" fill="#f0abfc" />
    <circle cx="115" cy="95" r="8" fill="#f0abfc" />
    <path d="M85 120 Q100 135 115 120" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    <text x="100" y="185" textAnchor="middle" fill="#e9d5ff" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
      DR. WONDERTAINMENT
    </text>
  </svg>
);

// 8. La Fabrique
export const FactoryIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" stroke="#78716c" strokeWidth="2.5" fill="#1c1917" />
    <polygon points="40,150 40,90 70,110 70,70 100,90 100,50 130,70 130,150" stroke="#a8a29e" strokeWidth="2" fill="#292524" />
    <rect x="140" y="40" width="15" height="110" stroke="#d6d3d1" strokeWidth="1.5" fill="#44403c" />
    <circle cx="147" cy="30" r="10" stroke="#78716c" strokeWidth="1" strokeDasharray="2 2" fill="none" />
    <text x="100" y="185" textAnchor="middle" fill="#d6d3d1" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
      THE FACTORY // 001
    </text>
  </svg>
);

// 9. Gamers Against Weed
export const GawIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="8" stroke="#22c55e" strokeWidth="2" fill="#052e16" />
    <rect x="40" y="45" width="120" height="85" rx="4" fill="#021f0e" stroke="#16a34a" strokeWidth="1.5" />
    <text x="50" y="65" fill="#4ade80" fontSize="9" fontFamily="monospace">&gt; GAW_CHAT // ONLINE</text>
    <text x="50" y="80" fill="#86efac" fontSize="8" fontFamily="monospace">&gt; blunt_roller: lmao</text>
    <text x="50" y="95" fill="#86efac" fontSize="8" fontFamily="monospace">&gt; bones: SCP-420-J ?</text>
    <circle cx="100" cy="115" r="8" fill="#22c55e" />
    <text x="100" y="185" textAnchor="middle" fill="#86efac" fontSize="8" fontFamily="monospace" fontWeight="bold">
      GAMERS AGAINST WEED
    </text>
  </svg>
);

// 10. Prometheus Labs
export const PrometheusIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#f59e0b" strokeWidth="2" opacity="0.8" />
    <polygon points="100,35 155,145 45,145" stroke="#fbbf24" strokeWidth="2.5" fill="#451a03" />
    <path d="M100 65 Q115 95 100 120 Q85 95 100 65 Z" fill="#ef4444" stroke="#f59e0b" strokeWidth="1.5" />
    <circle cx="100" cy="95" r="6" fill="#fef08a" />
    <text x="100" y="185" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
      PROMETHEUS LABS // PARATECH
    </text>
  </svg>
);

// 11. Are We Cool Yet?
export const AwcyIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" stroke="#ec4899" strokeWidth="2" fill="#180415" />
    <path d="M40 140 L80 50 L120 140 L160 70" stroke="#f472b6" strokeWidth="3" fill="none" />
    <circle cx="80" cy="50" r="8" fill="#db2777" />
    <circle cx="160" cy="70" r="8" fill="#db2777" />
    <text x="100" y="115" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="900">
      ARE WE COOL YET?
    </text>
    <text x="100" y="185" textAnchor="middle" fill="#f472b6" fontSize="8" fontFamily="monospace">
      ANARCHO-ART // AESTHETIC
    </text>
  </svg>
);

// 12. Initiative Horizon
export const HorizonIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="100,25 170,55 170,120 100,175 30,120 30,55" stroke="#facc15" strokeWidth="2.5" fill="#422006" />
    <circle cx="100" cy="95" r="30" stroke="#fde047" strokeWidth="2" fill="#713f12" />
    <line x1="100" y1="75" x2="100" y2="115" stroke="#ffffff" strokeWidth="3" />
    <line x1="85" y1="88" x2="115" y2="88" stroke="#ffffff" strokeWidth="3" />
    <text x="100" y="185" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace" fontWeight="bold">
      THE HORIZON INITIATIVE
    </text>
  </svg>
);

// 13. Manna Charitable Foundation
export const MannaIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#10b981" strokeWidth="2.5" opacity="0.8" />
    <circle cx="100" cy="100" r="45" stroke="#34d399" strokeWidth="2" fill="#064e3b" />
    <path d="M75 125 C75 95 100 70 100 70 C100 70 125 95 125 125 Z" fill="#6ee7b7" />
    <circle cx="100" cy="65" r="6" fill="#ffffff" />
    <text x="100" y="185" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
      MANNA CHARITABLE FOUNDATION
    </text>
  </svg>
);

// 14. Anderson Robotics
export const AndersonIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="8" stroke="#06b6d4" strokeWidth="2" fill="#083344" />
    <circle cx="100" cy="85" r="35" stroke="#22d3ee" strokeWidth="2" fill="#164e63" />
    <rect x="80" y="78" width="12" height="6" rx="2" fill="#67e8f9" />
    <rect x="108" y="78" width="12" height="6" rx="2" fill="#67e8f9" />
    <line x1="100" y1="120" x2="100" y2="150" stroke="#06b6d4" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
      ANDERSON ROBOTICS // CYBER
    </text>
  </svg>
);

// 15. Herman Fuller
export const HermanFullerIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#a855f7" strokeWidth="2.5" opacity="0.8" />
    <polygon points="100,35 155,130 45,130" stroke="#c084fc" strokeWidth="2.5" fill="#3b0764" />
    <line x1="100" y1="35" x2="100" y2="130" stroke="#e9d5ff" strokeWidth="2" />
    <line x1="100" y1="35" x2="72" y2="130" stroke="#e9d5ff" strokeWidth="1.5" />
    <line x1="100" y1="35" x2="128" y2="130" stroke="#e9d5ff" strokeWidth="1.5" />
    <text x="100" y="185" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontFamily="monospace" fontWeight="bold">
      HERMAN FULLER'S CIRCUS
    </text>
  </svg>
);

// 16. GRU-P
export const GrupIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="92" stroke="#dc2626" strokeWidth="2.5" opacity="0.8" />
    <polygon points="100,30 118,75 165,75 128,105 142,150 100,122 58,150 72,105 35,75 82,75" stroke="#ef4444" strokeWidth="2.5" fill="#450a0a" />
    <circle cx="100" cy="95" r="14" fill="#991b1b" stroke="#ffffff" strokeWidth="1.5" />
    <text x="100" y="100" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">P</text>
    <text x="100" y="185" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
      GRU DIVISION 'P' // PSYCHOTRONIC
    </text>
  </svg>
);

// ==========================================
// 4. SITES DE CONFINEMENT (8)
// ==========================================

// 1. Site-19
export const Site19Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#dc2626" strokeWidth="2" fill="#18181b" />
    <rect x="40" y="45" width="120" height="70" stroke="#ef4444" strokeWidth="2" fill="#450a0a" />
    <line x1="40" y1="80" x2="160" y2="80" stroke="#f87171" strokeWidth="1.5" />
    <line x1="100" y1="45" x2="100" y2="115" stroke="#f87171" strokeWidth="1.5" />
    <rect x="60" y="130" width="80" height="20" rx="2" fill="#000000" stroke="#ef4444" strokeWidth="1" />
    <text x="100" y="143" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-19 // PRIMARY HUB
    </text>
    <text x="100" y="188" textAnchor="middle" fill="#fca5a5" fontSize="7" fontFamily="monospace">
      KETER & EUCLID MAXIMUM SECURITY
    </text>
  </svg>
);

// 2. Site-17
export const Site17Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#059669" strokeWidth="2" fill="#064e3b" />
    <circle cx="100" cy="85" r="40" stroke="#34d399" strokeWidth="2" fill="#022c22" />
    <circle cx="100" cy="85" r="15" stroke="#6ee7b7" strokeWidth="1.5" />
    <path d="M60 145 H140" stroke="#34d399" strokeWidth="3" />
    <text x="100" y="160" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-17 // HUMANOID HABITAT
    </text>
  </svg>
);

// 3. Site-81
export const Site81Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#0891b2" strokeWidth="2" fill="#083344" />
    <circle cx="100" cy="85" r="35" stroke="#22d3ee" strokeWidth="2" fill="#164e63" />
    <path d="M40 50 Q100 70 160 50" stroke="#06b6d4" strokeWidth="2" />
    <path d="M40 70 Q100 90 160 70" stroke="#06b6d4" strokeWidth="2" />
    <text x="100" y="150" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-81 // SUB-LAKE MONROE
    </text>
  </svg>
);

// 4. Site-01
export const Site01Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#dc2626" strokeWidth="3" fill="#180404" />
    <polygon points="100,45 150,125 50,125" stroke="#ef4444" strokeWidth="3" fill="#450a0a" />
    <circle cx="100" cy="95" r="14" fill="#ffffff" />
    <text x="100" y="100" textAnchor="middle" fill="#000000" fontSize="11" fontFamily="monospace" fontWeight="900">01</text>
    <text x="100" y="160" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-01 // SANCTUARY O5
    </text>
  </svg>
);

// 5. Site-43
export const Site43Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#2563eb" strokeWidth="2" fill="#0f172a" />
    <rect x="55" y="55" width="90" height="60" rx="6" stroke="#3b82f6" strokeWidth="2" fill="#1e3a8a" />
    <path d="M70 85 H130" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3 3" />
    <text x="100" y="150" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-43 // LAKE HURON PARACHEM
    </text>
  </svg>
);

// 6. Site-120
export const Site120Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#9333ea" strokeWidth="2" fill="#2e1065" />
    <polygon points="100,45 140,85 100,125 60,85" stroke="#c084fc" strokeWidth="2" fill="#581c87" />
    <circle cx="100" cy="85" r="10" fill="#f0abfc" />
    <text x="100" y="155" textAnchor="middle" fill="#e9d5ff" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-120 // POLAND THAUMATURGY
    </text>
  </svg>
);

// 7. Site-64
export const Site64Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#0d9488" strokeWidth="2" fill="#042f2e" />
    <polygon points="100,45 130,95 70,95" stroke="#14b8a6" strokeWidth="2" fill="#115e59" />
    <polygon points="100,80 140,125 60,125" stroke="#14b8a6" strokeWidth="2" fill="#115e59" />
    <text x="100" y="155" textAnchor="middle" fill="#5eead4" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-64 // OREGON PACIFIC
    </text>
  </svg>
);

// 8. Site-06-3
export const Site063Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#4f46e5" strokeWidth="2" fill="#1e1b4b" />
    <rect x="50" y="60" width="100" height="60" stroke="#818cf8" strokeWidth="2" fill="#312e81" />
    <circle cx="100" cy="90" r="15" stroke="#c7d2fe" strokeWidth="2" />
    <text x="100" y="155" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-06-3 // FRANCE VOSGES
    </text>
  </svg>
);


// 9. Site-15
export const Site15Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#06b6d4" strokeWidth="2" fill="#083344" />
    <path d="M40 50 H160 V150 H40 Z" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6 3" fill="#0e4459" />
    <circle cx="100" cy="90" r="22" stroke="#67e8f9" strokeWidth="2" fill="#155e75" />
    <path d="M90 90 L100 80 L110 90 L100 100 Z" fill="#a5f3fc" />
    <line x1="60" y1="90" x2="78" y2="90" stroke="#22d3ee" strokeWidth="2" />
    <line x1="122" y1="90" x2="140" y2="90" stroke="#22d3ee" strokeWidth="2" />
    <text x="100" y="140" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-15 // FARADAY CYBER
    </text>
  </svg>
);

// 10. Site-38
export const Site38Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#64748b" strokeWidth="2" fill="#0f172a" />
    <rect x="45" y="65" width="110" height="65" stroke="#94a3b8" strokeWidth="2" fill="#1e293b" />
    <line x1="45" y1="85" x2="155" y2="85" stroke="#475569" strokeWidth="1.5" />
    <line x1="45" y1="105" x2="155" y2="105" stroke="#475569" strokeWidth="1.5" />
    <circle cx="80" cy="75" r="4" fill="#38bdf8" />
    <circle cx="120" cy="75" r="4" fill="#a855f7" />
    <circle cx="95" cy="95" r="4" fill="#22c55e" />
    <text x="100" y="152" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-38 // SAFE INANIMATE
    </text>
  </svg>
);

// 11. Site-77
export const Site77Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#d97706" strokeWidth="2" fill="#451a03" />
    <polygon points="50,130 50,75 70,75 70,90 90,90 90,75 110,75 110,90 130,90 130,75 150,75 150,130" stroke="#f59e0b" strokeWidth="2" fill="#78350f" />
    <path d="M85 130 A15 15 0 0 1 115 130 Z" fill="#1c1917" stroke="#fbbf24" strokeWidth="1.5" />
    <text x="100" y="152" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-77 // CALABRIA FORTRESS
    </text>
  </svg>
);

// 12. Site-88
export const Site88Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#78716c" strokeWidth="2" fill="#1c1917" />
    <polygon points="50,50 70,105 85,50 115,50 130,110 150,50 150,145 50,145" stroke="#a8a29e" strokeWidth="2" fill="#292524" />
    <polygon points="75,145 90,110 105,145" fill="#44403c" stroke="#d6d3d1" />
    <polygon points="115,145 125,120 135,145" fill="#44403c" stroke="#d6d3d1" />
    <text x="100" y="162" textAnchor="middle" fill="#e7e5e4" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-88 // CAVERN COMPLEX
    </text>
  </svg>
);

// 13. Site-118
export const Site118Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#2563eb" strokeWidth="2" fill="#0f172a" />
    <circle cx="100" cy="90" r="45" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="100" cy="90" r="30" stroke="#3b82f6" strokeWidth="1.5" />
    <ellipse cx="100" cy="90" rx="22" ry="12" stroke="#60a5fa" strokeWidth="2" fill="#1e3a8a" />
    <circle cx="108" cy="90" r="3" fill="#93c5fd" />
    <line x1="100" y1="90" x2="135" y2="65" stroke="#60a5fa" strokeWidth="1.5" />
    <text x="100" y="155" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-118 // ABYSSAL DEEP
    </text>
  </svg>
);

// 14. Site-41
export const Site41Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#d97706" strokeWidth="2" fill="#292524" />
    <polygon points="40,140 70,60 100,110 130,55 160,140" stroke="#78716c" strokeWidth="2" fill="#1c1917" />
    <rect x="75" y="105" width="50" height="35" stroke="#f59e0b" strokeWidth="2" fill="#451a03" />
    <line x1="75" y1="122" x2="125" y2="122" stroke="#fbbf24" strokeWidth="1.5" />
    <circle cx="100" cy="114" r="3" fill="#ef4444" />
    <text x="100" y="160" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-41 // BREACH CRISIS QG
    </text>
  </svg>
);

// 15. Site-98
export const Site98Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#6366f1" strokeWidth="2" fill="#1e1b4b" />
    <circle cx="100" cy="90" r="40" stroke="#818cf8" strokeWidth="2" strokeDasharray="8 4" fill="#312e81" />
    <circle cx="100" cy="90" r="22" stroke="#c7d2fe" strokeWidth="1.5" />
    <circle cx="100" cy="90" r="6" fill="#e0e7ff" />
    <line x1="60" y1="90" x2="140" y2="90" stroke="#a5b4fc" strokeWidth="1" />
    <line x1="100" y1="50" x2="100" y2="130" stroke="#a5b4fc" strokeWidth="1" />
    <text x="100" y="152" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-98 // R&D ACCELERATOR
    </text>
  </svg>
);

// 16. Site-104
export const Site104Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#e11d48" strokeWidth="2" fill="#4c0519" />
    <path d="M55 130 A45 45 0 0 1 145 130 Z" stroke="#fb7185" strokeWidth="2" fill="#881337" />
    <circle cx="100" cy="100" r="14" stroke="#fda4af" strokeWidth="1.5" fill="#be123c" />
    <circle cx="100" cy="100" r="4" fill="#fff" />
    <text x="100" y="152" textAnchor="middle" fill="#fecdd3" fontSize="8" fontFamily="monospace" fontWeight="bold">
      SITE-104 // DESERT BIO-DOME
    </text>
  </svg>
);

// 17. Area-02
export const Area02Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#dc2626" strokeWidth="2" fill="#450a0a" />
    <polygon points="100,50 135,120 65,120" stroke="#ef4444" strokeWidth="2" fill="#7f1d1d" />
    <circle cx="100" cy="98" r="8" fill="#f87171" />
    <rect x="95" y="112" width="10" height="8" fill="#f87171" />
    <line x1="50" y1="135" x2="150" y2="135" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3" />
    <text x="100" y="155" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
      AREA-02 // SILO NUCLÉAIRE
    </text>
  </svg>
);

// 18. Area-14
export const Area14Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#ea580c" strokeWidth="2" fill="#431407" />
    <rect x="50" y="55" width="100" height="75" stroke="#f97316" strokeWidth="2" fill="#7c2d12" />
    <line x1="70" y1="55" x2="70" y2="130" stroke="#fb923c" strokeWidth="2" />
    <line x1="90" y1="55" x2="90" y2="130" stroke="#fb923c" strokeWidth="2" />
    <line x1="110" y1="55" x2="110" y2="130" stroke="#fb923c" strokeWidth="2" />
    <line x1="130" y1="55" x2="130" y2="130" stroke="#fb923c" strokeWidth="2" />
    <path d="M75 75 L125 110" stroke="#ef4444" strokeWidth="2.5" />
    <path d="M125 75 L75 110" stroke="#ef4444" strokeWidth="2.5" />
    <text x="100" y="152" textAnchor="middle" fill="#fdba74" fontSize="8" fontFamily="monospace" fontWeight="bold">
      AREA-14 // TITAN CAGE
    </text>
  </svg>
);

// 19. Area-27
export const Area27Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#ca8a04" strokeWidth="2" fill="#422006" />
    <path d="M60 135 C60 75 140 75 140 135 Z" stroke="#eab308" strokeWidth="2" fill="#713f12" />
    <path d="M100 70 L100 115 M85 85 L115 85" stroke="#fef08a" strokeWidth="2.5" />
    <circle cx="100" cy="115" r="5" stroke="#fde047" strokeWidth="1.5" />
    <text x="100" y="152" textAnchor="middle" fill="#fde047" fontSize="8" fontFamily="monospace" fontWeight="bold">
      AREA-27 // VATICAN CRYPT
    </text>
  </svg>
);

// 20. Lunar Area-32
export const Lunar32Illustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#0284c7" strokeWidth="2" fill="#082f49" />
    <circle cx="145" cy="55" r="14" fill="#38bdf8" stroke="#7dd3fc" strokeWidth="1" />
    <path d="M40 135 C70 120 130 120 160 135" stroke="#64748b" strokeWidth="2" fill="#0f172a" />
    <ellipse cx="100" cy="115" rx="35" ry="18" stroke="#38bdf8" strokeWidth="2" fill="#0c4a6e" />
    <line x1="100" y1="97" x2="100" y2="70" stroke="#7dd3fc" strokeWidth="2" />
    <circle cx="100" cy="68" r="3" fill="#e0f2fe" />
    <text x="100" y="155" textAnchor="middle" fill="#bae6fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
      LUNAR-32 // MOON BASE
    </text>
  </svg>
);

// Generic Fallback Site
export const SiteIllustration: React.FC<IllustrationProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="25" y="25" width="150" height="150" rx="4" stroke="#64748b" strokeWidth="2" fill="#0f172a" />
    <circle cx="100" cy="100" r="45" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
    <text x="100" y="104" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">SEC-FACILITY</text>
  </svg>
);

// ==========================================
// MASTER DISPATCHER: EntityIllustration
// ==========================================
export const EntityIllustration: React.FC<{ id: string; className?: string }> = ({ id, className = 'w-full h-full' }) => {
  switch (id) {
    // 1. Départements
    case 'pataphysics':
      return <PataphysicsIllustration className={className} />;
    case 'antimemetics':
      return <AntimemeticsIllustration className={className} />;
    case 'ethics':
      return <EthicsCommitteeIllustration className={className} />;
    case 'raisa':
      return <RaisaIllustration className={className} />;
    case 'alchemy':
      return <AlchemyIllustration className={className} />;
    case 'temporal':
      return <TemporalIllustration className={className} />;
    case 'disinformation':
      return <DisinformationIllustration className={className} />;
    case 'tactical':
      return <TacticalIllustration className={className} />;
    case 'theology':
      return <TacticalTheologyIllustration className={className} />;
    case 'memetics':
      return <MemeticsIllustration className={className} />;
    case 'decommissioning':
      return <DecommissioningIllustration className={className} />;
    case 'internal_affairs':
      return <InternalAffairsIllustration className={className} />;
    case 'surrealism':
      return <SurrealismIllustration className={className} />;
    case 'astrophysics':
      return <AstrophysicsIllustration className={className} />;
    case 'medical':
      return <MedicalIllustration className={className} />;
    case 'cryptography':
      return <CryptographyIllustration className={className} />;

    // 2. Chercheurs
    case 'bright':
      return <BrightIllustration className={className} />;
    case 'clef':
      return <ClefIllustration className={className} />;
    case 'gears':
      return <GearsIllustration className={className} />;
    case 'kondraki':
      return <KondrakiIllustration className={className} />;
    case 'scranton':
      return <ScrantonIllustration className={className} />;
    case 'wheeler':
      return <WheelerIllustration className={className} />;
    case 'rights':
      return <RightsIllustration className={className} />;
    case 'o5_council':
      return <O5CouncilIllustration className={className} />;
    case 'mann':
      return <MannIllustration className={className} />;
    case 'glass':
      return <GlassIllustration className={className} />;
    case 'light':
      return <LightIllustration className={className} />;
    case 'bridge':
      return <BridgeIllustration className={className} />;
    case 'king':
      return <KingIllustration className={className} />;
    case 'iceberg':
      return <IcebergIllustration className={className} />;
    case 'dan':
      return <DanIllustration className={className} />;
    case 'strelnikov':
      return <StrelnikovIllustration className={className} />;

    // 3. Groupes d'Intérêt
    case 'goc':
      return <GocIllustration className={className} />;
    case 'chaos_insurgency':
      return <ChaosIllustration className={className} />;
    case 'serpents_hand':
      return <SerpentsHandIllustration className={className} />;
    case 'broken_god':
      return <BrokenGodIllustration className={className} />;
    case 'sarkic':
      return <SarkicIllustration className={className} />;
    case 'mcd':
      return <McdIllustration className={className} />;
    case 'wondertainment':
      return <WondertainmentIllustration className={className} />;
    case 'factory':
      return <FactoryIllustration className={className} />;
    case 'gaw':
      return <GawIllustration className={className} />;
    case 'prometheus':
      return <PrometheusIllustration className={className} />;
    case 'awcy':
      return <AwcyIllustration className={className} />;
    case 'horizon':
      return <HorizonIllustration className={className} />;
    case 'manna':
      return <MannaIllustration className={className} />;
    case 'anderson':
      return <AndersonIllustration className={className} />;
    case 'herman_fuller':
      return <HermanFullerIllustration className={className} />;
    case 'gru_p':
      return <GrupIllustration className={className} />;

        // 4. Sites et Zones de Confinement (20 installations canoniques)
    case 'site_19':
      return <Site19Illustration className={className} />;
    case 'site_17':
      return <Site17Illustration className={className} />;
    case 'site_81':
      return <Site81Illustration className={className} />;
    case 'site_01':
      return <Site01Illustration className={className} />;
    case 'site_43':
      return <Site43Illustration className={className} />;
    case 'site_120':
      return <Site120Illustration className={className} />;
    case 'site_64':
      return <Site64Illustration className={className} />;
    case 'site_06_3':
      return <Site063Illustration className={className} />;
    case 'site_15':
      return <Site15Illustration className={className} />;
    case 'site_38':
      return <Site38Illustration className={className} />;
    case 'site_77':
      return <Site77Illustration className={className} />;
    case 'site_88':
      return <Site88Illustration className={className} />;
    case 'site_118':
      return <Site118Illustration className={className} />;
    case 'site_41':
      return <Site41Illustration className={className} />;
    case 'site_98':
      return <Site98Illustration className={className} />;
    case 'site_104':
      return <Site104Illustration className={className} />;
    case 'area_02':
      return <Area02Illustration className={className} />;
    case 'area_14':
      return <Area14Illustration className={className} />;
    case 'area_27':
      return <Area27Illustration className={className} />;
    case 'lunar_32':
      return <Lunar32Illustration className={className} />;

    default:
      return <SiteIllustration className={className} />;
  }
};
