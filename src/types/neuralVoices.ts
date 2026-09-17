import { CharacterRole } from './audioRoleplay';

export interface NeuralVoice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  locale: string;
  region: string;
  description: string;
  archetype: string;
  recommendedRole: CharacterRole;
  source: 'azure' | 'huggingface';
}

export interface VoiceLanguageStats {
  locale: string;
  langName: string;
  flag: string;
  totalVoices: number;
}

export const VOICE_LANGUAGE_STATS: Record<string, VoiceLanguageStats> = {
  fr: { locale: 'fr-FR', langName: 'Français', flag: '🇫🇷', totalVoices: 12 },
  en: { locale: 'en-US', langName: 'English', flag: '🇬🇧', totalVoices: 47 },
  es: { locale: 'es-ES', langName: 'Español', flag: '🇪🇸', totalVoices: 14 },
  de: { locale: 'de-DE', langName: 'Deutsch', flag: '🇩🇪', totalVoices: 11 },
  it: { locale: 'it-IT', langName: 'Italiano', flag: '🇮🇹', totalVoices: 9 },
  ru: { locale: 'ru-RU', langName: 'Русский', flag: '🇷🇺', totalVoices: 6 },
  ja: { locale: 'ja-JP', langName: '日本語', flag: '🇯🇵', totalVoices: 8 }
};

export const NEURAL_VOICES_BY_LANG: Record<string, NeuralVoice[]> = {
  // Uniquement la génération « Multilingual » de Microsoft. Les voix Neural de première
  // génération (Henri, Denise, Eloise, Antoine, Gerard, Jean, Thierry, Charline, Sylvie,
  // Fabrice, Ariane) ont été retirées : elles sonnent nettement plus synthétiques.
  //
  // Une voix Multilingual n'est pas limitée à sa locale — elle lit le français quelle que
  // soit son origine. Les deux voix fr-FR portent les rôles les plus entendus (narrateur,
  // intercom) car ce sont les seules nativement françaises ; les autres apportent des
  // timbres distincts, avec une possible coloration d'accent — un atout pour une anomalie,
  // un défaut pour un narrateur.
  fr: [
    {
      id: 'fr-FR-RemyMultilingualNeural',
      name: 'Rémy (France, multilingue)',
      gender: 'Male',
      locale: 'fr-FR',
      region: 'France',
      description: 'Naturel, éloquent, posé et scientifique',
      archetype: 'Archiviste en chef / Narrateur protocolaire',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'fr-FR-VivienneMultilingualNeural',
      name: 'Vivienne (France, multilingue)',
      gender: 'Female',
      locale: 'fr-FR',
      region: 'France',
      description: 'Enveloppante, nette et experte',
      archetype: 'Voix de site / Intercom RAISA',
      recommendedRole: 'intercom',
      source: 'azure'
    },
    {
      id: 'en-US-AndrewMultilingualNeural',
      name: 'Andrew (multilingue)',
      gender: 'Male',
      locale: 'en-US',
      region: 'Multilingue',
      description: 'Curieux, engagé et analytique',
      archetype: 'Chercheur de terrain',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'en-US-BrianMultilingualNeural',
      name: 'Brian (multilingue)',
      gender: 'Male',
      locale: 'en-US',
      region: 'Multilingue',
      description: 'Chaleureux, assuré et posé',
      archetype: 'Superviseur de confinement',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'en-AU-WilliamMultilingualNeural',
      name: 'William (multilingue)',
      gender: 'Male',
      locale: 'en-AU',
      region: 'Multilingue',
      description: 'Rugueux, direct et tendu',
      archetype: 'Personnel Classe-D',
      recommendedRole: 'classD',
      source: 'azure'
    },
    {
      id: 'de-DE-FlorianMultilingualNeural',
      name: 'Florian (multilingue)',
      gender: 'Male',
      locale: 'de-DE',
      region: 'Multilingue',
      description: 'Grave, ferme et autoritaire',
      archetype: 'Commandement O5',
      recommendedRole: 'commander',
      source: 'azure'
    },
    {
      id: 'it-IT-GiuseppeMultilingualNeural',
      name: 'Giuseppe (multilingue)',
      gender: 'Male',
      locale: 'it-IT',
      region: 'Multilingue',
      description: 'Sec, tactique et nerveux',
      archetype: 'Agent de terrain / FIM',
      recommendedRole: 'agent',
      source: 'azure'
    },
    {
      id: 'ko-KR-HyunsuMultilingualNeural',
      name: 'Hyunsu (multilingue)',
      gender: 'Male',
      locale: 'ko-KR',
      region: 'Multilingue',
      description: 'Timbre inhabituel, détaché et inquiétant',
      archetype: 'Entité anormale',
      recommendedRole: 'anomaly',
      source: 'azure'
    },
    {
      id: 'en-US-AvaMultilingualNeural',
      name: 'Ava (multilingue)',
      gender: 'Female',
      locale: 'en-US',
      region: 'Multilingue',
      description: 'Calculée, froide et méthodique',
      archetype: 'Chercheuse senior',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'en-US-EmmaMultilingualNeural',
      name: 'Emma (multilingue)',
      gender: 'Female',
      locale: 'en-US',
      region: 'Multilingue',
      description: 'Observatrice, claire et clinique',
      archetype: 'Analyste d’anomalie',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'de-DE-SeraphinaMultilingualNeural',
      name: 'Seraphina (multilingue)',
      gender: 'Female',
      locale: 'de-DE',
      region: 'Multilingue',
      description: 'Posée, grave et protocolaire',
      archetype: 'Directrice de site',
      recommendedRole: 'commander',
      source: 'azure'
    },
    {
      id: 'pt-BR-ThalitaMultilingualNeural',
      name: 'Thalita (multilingue)',
      gender: 'Female',
      locale: 'pt-BR',
      region: 'Multilingue',
      description: 'Vive, expressive et dynamique',
      archetype: 'Chercheuse de terrain',
      recommendedRole: 'researcher',
      source: 'azure'
    }
  ],
  en: [
    {
      id: 'en-US-ChristopherNeural',
      name: 'Christopher (US)',
      gender: 'Male',
      locale: 'en-US',
      region: 'USA',
      description: 'Deep, authoritative, classified documentary tone',
      archetype: 'Lead Archivist & Chief Narrator',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'en-US-GuyNeural',
      name: 'Guy (US)',
      gender: 'Male',
      locale: 'en-US',
      region: 'USA',
      description: 'Articulate, calm, clinical scientific delivery',
      archetype: 'Senior Researcher (Dr. Hamm, Dr. Sherman)',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'en-US-BrianMultilingualNeural',
      name: 'Brian (US Multilingual)',
      gender: 'Male',
      locale: 'en-US',
      region: 'USA',
      description: 'Eerie, ominous, dramatic resonance',
      archetype: 'SCP Anomaly (SCP-049, SCP-682, SCP-106)',
      recommendedRole: 'anomaly',
      source: 'azure'
    },
    {
      id: 'en-US-AndrewMultilingualNeural',
      name: 'Andrew (US Multilingual)',
      gender: 'Male',
      locale: 'en-US',
      region: 'USA',
      description: 'Agitated, hurried, breathless delivery',
      archetype: 'Panicked D-Class Personnel (D-9341)',
      recommendedRole: 'classD',
      source: 'azure'
    },
    {
      id: 'en-US-EricNeural',
      name: 'Eric (US)',
      gender: 'Male',
      locale: 'en-US',
      region: 'USA',
      description: 'Gruff, disciplined, tactical military tone',
      archetype: 'MTF Commander (Nine-Tailed Fox / Zulu 9-A)',
      recommendedRole: 'agent',
      source: 'azure'
    },
    {
      id: 'en-US-JennyNeural',
      name: 'Jenny (US)',
      gender: 'Female',
      locale: 'en-US',
      region: 'USA',
      description: 'Cold, clear, synthetic PA announcement tone',
      archetype: 'Site-19 Automated Intercom & Dispatcher',
      recommendedRole: 'intercom',
      source: 'azure'
    },
    {
      id: 'en-US-AvaNeural',
      name: 'Ava (US)',
      gender: 'Female',
      locale: 'en-US',
      region: 'USA',
      description: 'Stern, calculated executive authority',
      archetype: 'O5 Council Member / Site Director',
      recommendedRole: 'commander',
      source: 'azure'
    },
    {
      id: 'en-GB-RyanNeural',
      name: 'Ryan (UK)',
      gender: 'Male',
      locale: 'en-GB',
      region: 'UK',
      description: 'Proper, somber, British containment officer',
      archetype: 'Field Agent / Overseas Supervisor',
      recommendedRole: 'agent',
      source: 'azure'
    }
  ],
  es: [
    {
      id: 'es-ES-AlvaroNeural',
      name: 'Álvaro (España)',
      gender: 'Male',
      locale: 'es-ES',
      region: 'España',
      description: 'Solemne y documental',
      archetype: 'Archivista Principal',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'es-ES-ElviraNeural',
      name: 'Elvira (España)',
      gender: 'Female',
      locale: 'es-ES',
      region: 'España',
      description: 'Clara, protocolaria y formal',
      archetype: 'Investigadora de Contención',
      recommendedRole: 'researcher',
      source: 'azure'
    },
    {
      id: 'es-MX-JorgeNeural',
      name: 'Jorge (México)',
      gender: 'Male',
      locale: 'es-MX',
      region: 'México',
      description: 'Grave y tenso',
      archetype: 'Agente MTF / Personal Clase D',
      recommendedRole: 'classD',
      source: 'azure'
    }
  ],
  de: [
    {
      id: 'de-DE-KillianNeural',
      name: 'Killian (Deutschland)',
      gender: 'Male',
      locale: 'de-DE',
      region: 'Deutschland',
      description: 'Klar, sachlich und präzise',
      archetype: 'Hauptarchivar',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'de-DE-KatjaNeural',
      name: 'Katja (Deutschland)',
      gender: 'Female',
      locale: 'de-DE',
      region: 'Deutschland',
      description: 'Ruhig und analytisch',
      archetype: 'Wissenschaftlerin',
      recommendedRole: 'researcher',
      source: 'azure'
    }
  ],
  ru: [
    {
      id: 'ru-RU-DmitryNeural',
      name: 'Dmitry (Россия)',
      gender: 'Male',
      locale: 'ru-RU',
      region: 'Россия',
      description: 'Глубокий, низкий и авторитетный',
      archetype: 'Архивариус Фонда',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'ru-RU-SvetlanaNeural',
      name: 'Svetlana (Россия)',
      gender: 'Female',
      locale: 'ru-RU',
      region: 'Россия',
      description: 'Строгая и официальная',
      archetype: 'Сотрудник зоны содержания',
      recommendedRole: 'researcher',
      source: 'azure'
    }
  ],
  ja: [
    {
      id: 'ja-JP-KeitaNeural',
      name: 'Keita (日本)',
      gender: 'Male',
      locale: 'ja-JP',
      region: '日本',
      description: '落ち着いたドキュメンタリー調',
      archetype: '財団記録アーキビスト',
      recommendedRole: 'narrator',
      source: 'azure'
    },
    {
      id: 'ja-JP-NanamiNeural',
      name: 'Nanami (日本)',
      gender: 'Female',
      locale: 'ja-JP',
      region: '日本',
      description: '正確でクリアなアナウンス調',
      archetype: 'サイト指令放送',
      recommendedRole: 'intercom',
      source: 'azure'
    }
  ]
};

/**
 * Uniquement des voix « Multilingual ». Les deux voix nativement françaises sont attribuées
 * aux rôles les plus entendus : sur SCP-6172, 276 segments sur 414 sont narrés — c'est le
 * narrateur qu'on écoute les trois quarts du temps, il lui faut la voix la plus sûre.
 * Les voix d'autres locales lisent le français mais peuvent le colorer d'un accent, parfois
 * jusqu'au code-switching (quelques mots qui basculent dans leur langue d'origine). On ne
 * confie donc les rôles qu'aux meilleures lectrices de français : la différenciation des
 * personnages vient du profil (pitch, débit), pas de l'accent.
 */
export const DEFAULT_AI_ROLES_FR: Record<CharacterRole, string> = {
  narrator: 'fr-FR-RemyMultilingualNeural',
  researcher: 'en-US-AndrewMultilingualNeural',
  anomaly: 'en-US-BrianMultilingualNeural',
  classD: 'en-AU-WilliamMultilingualNeural',
  agent: 'en-US-EmmaMultilingualNeural',
  commander: 'de-DE-FlorianMultilingualNeural',
  intercom: 'fr-FR-VivienneMultilingualNeural'
};

export const DEFAULT_AI_ROLES_EN: Record<CharacterRole, string> = {
  narrator: 'en-US-ChristopherNeural',
  researcher: 'en-US-GuyNeural',
  anomaly: 'en-US-BrianMultilingualNeural',
  classD: 'en-US-AndrewMultilingualNeural',
  agent: 'en-US-EricNeural',
  commander: 'en-US-AvaNeural',
  intercom: 'en-US-JennyNeural'
};
