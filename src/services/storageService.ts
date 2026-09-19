import { CharacterRole, VoiceProfile } from '../types/audioRoleplay';
import { ScpItemSummary } from '../types/scp';
import { WikiLink } from './linkExtractor';

const FAVORITES_KEY = 'scp_audio_favorites_v1';
const VOICE_PROFILES_KEY = 'scp_voice_profiles_v1';
const RECENT_HISTORY_KEY = 'scp_recent_history_v1';
const READING_QUEUE_KEY = 'scp_reading_queue_v1';

export const DEFAULT_ROLE_PROFILES: Record<CharacterRole, Omit<VoiceProfile, 'voiceURI'>> = {
  narrator: {
    role: 'narrator',
    label: 'Archiviste (Narrateur)',
    pitch: 0.95,
    rate: 1.0,
    volume: 1.0,
    color: '#3b82f6',
    badgeBg: 'bg-blue-950/60',
    badgeBorder: 'border-blue-700/60',
    badgeText: 'text-blue-400'
  },
  researcher: {
    role: 'researcher',
    label: 'Chercheur / Docteur',
    pitch: 1.05,
    rate: 1.05,
    volume: 1.0,
    color: '#10b981',
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-700/60',
    badgeText: 'text-emerald-400'
  },
  anomaly: {
    role: 'anomaly',
    label: 'Entité Anormale (SCP)',
    pitch: 0.75, // deeper, unnatural pitch
    rate: 0.9,
    volume: 1.0,
    color: '#dc2626',
    badgeBg: 'bg-red-950/60',
    badgeBorder: 'border-red-700/60',
    badgeText: 'text-red-400'
  },
  classD: {
    role: 'classD',
    label: 'Personnel Classe-D',
    pitch: 1.15, // slightly stressed / higher
    rate: 1.1,
    volume: 1.0,
    color: '#f59e0b',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-700/60',
    badgeText: 'text-amber-400'
  },
  agent: {
    role: 'agent',
    label: 'Agent de terrain / Garde',
    pitch: 0.9,
    rate: 1.05,
    volume: 1.0,
    color: '#06b6d4',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-700/60',
    badgeText: 'text-cyan-400'
  },
  commander: {
    role: 'commander',
    label: 'Conseil O5 / Commandement',
    pitch: 0.85,
    rate: 0.95,
    volume: 1.0,
    color: '#a855f7',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-700/60',
    badgeText: 'text-purple-400'
  },
  intercom: {
    role: 'intercom',
    label: 'Intercom / Enregistreur',
    pitch: 1.1,
    rate: 1.0,
    volume: 0.85,
    color: '#94a3b8',
    badgeBg: 'bg-slate-900/80',
    badgeBorder: 'border-slate-700/60',
    badgeText: 'text-slate-400'
  }
};

export const storageService = {
  getFavorites(): ScpItemSummary[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(slug: string): boolean {
    const favs = this.getFavorites();
    return favs.some(f => f.slug === slug);
  },

  toggleFavorite(item: ScpItemSummary): boolean {
    const favs = this.getFavorites();
    const index = favs.findIndex(f => f.slug === item.slug);
    let isNowFavorite = false;

    if (index >= 0) {
      favs.splice(index, 1);
      isNowFavorite = false;
    } else {
      favs.unshift(item);
      isNowFavorite = true;
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    } catch {}
    return isNowFavorite;
  },

  getRecentHistory(): ScpItemSummary[] {
    try {
      const data = localStorage.getItem(RECENT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToRecent(item: ScpItemSummary): void {
    const list = this.getRecentHistory().filter(i => i.slug !== item.slug);
    list.unshift(item);
    if (list.length > 20) list.pop();
    try {
      localStorage.setItem(RECENT_HISTORY_KEY, JSON.stringify(list));
    } catch {}
  },

  /** File « À SUIVRE » : les liens mis de côté pendant l'écoute d'un dossier. */
  getReadingQueue(): WikiLink[] {
    try {
      const data = localStorage.getItem(READING_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveReadingQueue(queue: WikiLink[]): void {
    try {
      localStorage.setItem(READING_QUEUE_KEY, JSON.stringify(queue.slice(0, 50)));
    } catch {}
  },

  getVoiceProfiles(): Record<CharacterRole, VoiceProfile> {
    try {
      const data = localStorage.getItem(VOICE_PROFILES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    // Default profiles with empty voiceURI (will be bound to best matching device voices)
    const defaults: Record<string, VoiceProfile> = {};
    for (const [key, val] of Object.entries(DEFAULT_ROLE_PROFILES)) {
      defaults[key] = {
        ...val,
        voiceURI: ''
      };
    }
    return defaults as Record<CharacterRole, VoiceProfile>;
  },

  saveVoiceProfiles(profiles: Record<CharacterRole, VoiceProfile>): void {
    try {
      localStorage.setItem(VOICE_PROFILES_KEY, JSON.stringify(profiles));
    } catch {}
  }
};
