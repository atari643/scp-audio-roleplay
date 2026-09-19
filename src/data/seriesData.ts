export interface ScpSubRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface ScpSeriesInfo {
  id: string;
  name: string;
  range: string;
  hubSlug: string;
  prefix: string;
  description: string;
  iconicSamples: string[];
  totalEstimate: string;
  badgeColor: string;
  minNumber?: number;
  maxNumber?: number;
  subRanges?: ScpSubRange[];
}

function generateSubRanges(start: number, end: number, suffix: string = ''): ScpSubRange[] {
  const ranges: ScpSubRange[] = [];
  const firstMax = start === 1 ? 99 : start + 99;
  ranges.push({
    id: `${start}-${firstMax}`,
    label: `${start < 100 ? String(start).padStart(3, '0') : start}-${firstMax < 100 ? String(firstMax).padStart(3, '0') : firstMax}${suffix ? ' ' + suffix : ''}`,
    min: start,
    max: firstMax
  });

  const nextStep = start === 1 ? 100 : start + 100;
  for (let i = nextStep; i <= end; i += 100) {
    const rangeMax = Math.min(i + 99, end);
    const pad = (n: number) => (n < 100 ? String(n).padStart(3, '0') : String(n));
    ranges.push({
      id: `${i}-${rangeMax}`,
      label: `${pad(i)}-${pad(rangeMax)}${suffix ? ' ' + suffix : ''}`,
      min: i,
      max: rangeMax
    });
  }
  return ranges;
}

export const SCP_SERIES: ScpSeriesInfo[] = [
  {
    id: 'series_1',
    name: 'Série I',
    range: 'SCP-001 à SCP-999',
    hubSlug: 'scp-series',
    prefix: 'scp-0',
    minNumber: 1,
    maxNumber: 999,
    subRanges: generateSubRanges(1, 999),
    description: 'Les anomalies originelles de la Fondation. Comprend les dossiers fondateurs SCP-173, SCP-049, SCP-096, SCP-682, SCP-087 et SCP-001.',
    iconicSamples: ['SCP-001', 'SCP-049', 'SCP-073', 'SCP-076', 'SCP-079', 'SCP-087', 'SCP-096', 'SCP-105', 'SCP-106', 'SCP-173', 'SCP-500', 'SCP-682', 'SCP-914', 'SCP-999'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-red-600/70 text-red-300 bg-red-950/80'
  },
  {
    id: 'series_2',
    name: 'Série II',
    range: 'SCP-1000 à SCP-1999',
    hubSlug: 'scp-series-2',
    prefix: 'scp-1',
    minNumber: 1000,
    maxNumber: 1999,
    subRanges: generateSubRanges(1000, 1999),
    description: "L'expansion des anomalies historiques, des civilisations perdues et du Projet 1000 (Bigfoot).",
    iconicSamples: ['SCP-1000', 'SCP-1048', 'SCP-1057', 'SCP-1360', 'SCP-1425', 'SCP-1471', 'SCP-1609', 'SCP-1730', 'SCP-1867', 'SCP-1983'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-amber-600/70 text-amber-300 bg-amber-950/80'
  },
  {
    id: 'series_3',
    name: 'Série III',
    range: 'SCP-2000 à SCP-2999',
    hubSlug: 'scp-series-3',
    prefix: 'scp-2',
    minNumber: 2000,
    maxNumber: 2999,
    subRanges: generateSubRanges(2000, 2999),
    description: "L'ère des technologies thaumielles de salut mondial (SCP-2000) et des dévoreurs de mondes apollyon (SCP-2317).",
    iconicSamples: ['SCP-2000', 'SCP-2317', 'SCP-2399', 'SCP-2521', 'SCP-2747', 'SCP-2845', 'SCP-2935'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-yellow-600/70 text-yellow-300 bg-yellow-950/80'
  },
  {
    id: 'series_4',
    name: 'Série IV',
    range: 'SCP-3000 à SCP-3999',
    hubSlug: 'scp-series-4',
    prefix: 'scp-3',
    minNumber: 3000,
    maxNumber: 3999,
    subRanges: generateSubRanges(3000, 3999),
    description: "Exploration des abysses de la conscience, de la Réalité Rouge de Scranton (SCP-3001), d'Anantashesha (SCP-3000) et de l'IKEA infini (SCP-3008).",
    iconicSamples: ['SCP-3000', 'SCP-3001', 'SCP-3008', 'SCP-3125', 'SCP-3309', 'SCP-3812', 'SCP-3999'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-emerald-600/70 text-emerald-300 bg-emerald-950/80'
  },
  {
    id: 'series_5',
    name: 'Série V',
    range: 'SCP-4000 à SCP-4999',
    hubSlug: 'scp-series-5',
    prefix: 'scp-4',
    minNumber: 4000,
    maxNumber: 4999,
    subRanges: generateSubRanges(4000, 4999),
    description: "L'histoire, les fées et les récits narratifs profonds. Notamment Tabou (SCP-4000) et Quelqu'un pour veiller sur nous (SCP-4999).",
    iconicSamples: ['SCP-4000', 'SCP-4231', 'SCP-4456', 'SCP-4778', 'SCP-4999'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-cyan-600/70 text-cyan-300 bg-cyan-950/80'
  },
  {
    id: 'series_6',
    name: 'Série VI',
    range: 'SCP-5000 à SCP-5999',
    hubSlug: 'scp-series-6',
    prefix: 'scp-5',
    minNumber: 5000,
    maxNumber: 5999,
    subRanges: generateSubRanges(5000, 5999),
    description: "Le grand mystère du dossier 'Pourquoi ?' (SCP-5000), les conspirations temporelles et le tombeau mémétique (SCP-5999).",
    iconicSamples: ['SCP-5000', 'SCP-5236', 'SCP-5281', 'SCP-5500', 'SCP-5520', 'SCP-5999'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-blue-600/70 text-blue-300 bg-blue-950/80'
  },
  {
    id: 'series_7',
    name: 'Série VII',
    range: 'SCP-6000 à SCP-6999',
    hubSlug: 'scp-series-7',
    prefix: 'scp-6',
    minNumber: 6000,
    maxNumber: 6999,
    subRanges: generateSubRanges(6000, 6999),
    description: "La nature, la Bibliothèque des Vagabonds et l'expansion cosmique (SCP-6000, SCP-6599, SCP-6747).",
    iconicSamples: ['SCP-6000', 'SCP-6599', 'SCP-6747'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-indigo-600/70 text-indigo-300 bg-indigo-950/80'
  },
  {
    id: 'series_8',
    name: 'Série VIII',
    range: 'SCP-7000 à SCP-7999',
    hubSlug: 'scp-series-8',
    prefix: 'scp-7',
    minNumber: 7000,
    maxNumber: 7999,
    subRanges: generateSubRanges(7000, 7999),
    description: "L'anomalie de la chance pure (SCP-7000 'Le Perdant') et les recherches contemporaines de la Fondation.",
    iconicSamples: ['SCP-7000'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-purple-600/70 text-purple-300 bg-purple-950/80'
  },
  {
    id: 'series_9',
    name: 'Série IX',
    range: 'SCP-8000 à SCP-8999',
    hubSlug: 'scp-series-9',
    prefix: 'scp-8',
    minNumber: 8000,
    maxNumber: 8999,
    subRanges: generateSubRanges(8000, 8999),
    description: 'Les anomalies explorant la théorie des récits, la métaphysique moderne et les technologies quantiques avancées.',
    iconicSamples: ['SCP-8000', 'SCP-8001'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-fuchsia-600/70 text-fuchsia-300 bg-fuchsia-950/80'
  },
  {
    id: 'series_10',
    name: 'Série X',
    range: 'SCP-9000 à SCP-9999',
    hubSlug: 'scp-series-10',
    prefix: 'scp-9',
    minNumber: 9000,
    maxNumber: 9999,
    subRanges: generateSubRanges(9000, 9999),
    description: 'La toute dernière frontière du Registre SCiPNET, englobant les anomalies les plus récentes et les futurs possibles.',
    iconicSamples: ['SCP-9000', 'SCP-9999'],
    totalEstimate: '1 000 dossiers',
    badgeColor: 'border-teal-600/70 text-teal-300 bg-teal-950/80'
  },
  {
    id: 'series_fr',
    name: 'Branche Francophone (-FR)',
    range: 'SCP-001-FR à SCP-899-FR',
    hubSlug: 'liste-fr',
    prefix: 'scp-0',
    minNumber: 1,
    maxNumber: 899,
    subRanges: generateSubRanges(1, 899, 'FR'),
    description: "L'ensemble des anomalies originaires du secteur francophone, confinées par la branche française au Site-06-3 et dans les zones d'Europe de l'Ouest.",
    iconicSamples: ['SCP-001-FR', 'SCP-049-FR', 'SCP-140-FR', 'SCP-200-FR'],
    totalEstimate: '900 dossiers',
    badgeColor: 'border-sky-500/70 text-sky-200 bg-sky-950/90'
  },
  {
    id: 'series_ex',
    name: 'Dossiers Expliqués (-EX)',
    range: 'SCP-EX',
    hubSlug: 'scp-ex',
    prefix: 'scp-',
    description: "Anomalies autrefois classifiées dont les propriétés ont été entièrement expliquées par la science moderne ou incorporées à la normalité civile.",
    iconicSamples: ['SCP-8900-EX', 'SCP-001-EX', 'SCP-711-EX'],
    totalEstimate: '60+ dossiers',
    badgeColor: 'border-slate-500/70 text-slate-300 bg-slate-900/90'
  },
  {
    id: 'series_j',
    name: 'Archives Humoristiques (-J)',
    range: 'SCP-J',
    hubSlug: 'joke-scps',
    prefix: 'scp-',
    description: "Incidents cocasses, blagues internes de chercheurs et rapports satiriques conservés dans les terminaux déclassifiés du personnel.",
    iconicSamples: ['SCP-049-J', 'SCP-420-J', 'SCP-069-J', 'SCP-729-J'],
    totalEstimate: '380 dossiers',
    badgeColor: 'border-pink-600/70 text-pink-300 bg-pink-950/80'
  },
  {
    id: 'series_int',
    name: 'Archives Internationales (-INT)',
    range: 'SCP-INT',
    hubSlug: 'scp-international',
    prefix: 'scp-',
    description: "Anomalies issues des différentes branches linguistiques internationales de la Fondation (Espagne, Italie, Allemagne, Russie, Japon, Chine...).",
    iconicSamples: ['SCP-001-IT', 'SCP-001-DE', 'SCP-001-ES'],
    totalEstimate: '350 dossiers',
    badgeColor: 'border-emerald-500/70 text-emerald-300 bg-emerald-950/80'
  }
];

export function getSeriesById(id: string): ScpSeriesInfo | undefined {
  return SCP_SERIES.find(s => s.id === id);
}
