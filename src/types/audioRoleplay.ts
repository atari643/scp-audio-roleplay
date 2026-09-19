import { WikiLink } from '../services/linkExtractor';
export type CharacterRole = 
  | 'narrator' 
  | 'researcher' 
  | 'anomaly' 
  | 'classD' 
  | 'agent' 
  | 'commander' 
  | 'intercom';

export interface SpeechSegment {
  id: number;
  speaker: string;
  role: CharacterRole;
  text: string;
  rawText: string;
  gender?: 'male' | 'female';
  voiceSignature?: {
    voiceId: string;
    pitch: string;
    rate: string;
  };
  stageDirections?: string[];
  isHeader?: boolean;
  isLogMarker?: boolean;
  /**
   * A footnote lifted out of the trailing "Notes de bas de page" block and re-inserted at
   * the position of its marker in the body, so it is read where the author placed it
   * instead of as a detached wall of text at the end.
   */
  isFootnote?: boolean;
  /** 1-based footnote number, for display ("Note 3"). */
  footnoteNumber?: number;
  /** Index of the fragment page this segment came from (0 = main page). */
  fragmentIndex?: number;
  /**
   * Wiki links whose label appears in this segment. Pure metadata: `text` is never altered,
   * so the narration is identical whether or not links were resolved.
   */
  links?: WikiLink[];
}

export interface VoiceProfile {
  role: CharacterRole;
  label: string;
  voiceURI: string;
  pitch: number;
  rate: number;
  volume: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface PlayerStatus {
  isPlaying: boolean;
  isPaused: boolean;
  currentSegmentIndex: number;
  totalSegments: number;
  currentSpeaker: string;
  currentRole: CharacterRole;
  globalSpeed: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  /**
   * Vrai quand on parle avec le moteur du navigateur au lieu des voix neurales —
   * soit par choix, soit parce que le point d'accès de synthèse est hors d'atteinte
   * (cas du miroir statique). L'interface le signale discrètement plutôt que de
   * laisser l'auditeur croire que c'est le rendu normal.
   */
  voixDegradee?: boolean;
}
