import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, Sparkles, Check, Cpu, Radio, Award, Shield, Flame, Activity, Globe, Info, Database, Trash2 } from 'lucide-react';
import { CharacterRole, VoiceProfile } from '../types/audioRoleplay';
import { speechEngine, TtsEngineMode } from '../services/speechEngine';
import { DEFAULT_ROLE_PROFILES } from '../services/storageService';
import { DEFAULT_AI_ROLES_FR, NEURAL_VOICES_BY_LANG, VOICE_LANGUAGE_STATS } from '../types/neuralVoices';
import { sfx } from '../services/sfxService';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageCode: string;
}

const SAMPLE_TEXTS: Record<CharacterRole, string> = {
  narrator: "Objet : SCP-049. Classe d'objet : Euclide. Procédures de confinement spéciales en vigueur au Secteur de recherche 02.",
  researcher: "Bonjour SCP-049. Veuillez vous asseoir. Nous aimerions comprendre la véritable nature de votre traitement.",
  anomaly: "Ne vous moquez pas de moi, docteur ! Mon remède est le plus efficace contre le Fléau.",
  classD: "Attendez, pourquoi vous fermez la porte derrière moi ?! Qu'est-ce qu'il y a là-dedans ?!",
  agent: "Équipe Bravo en position. Contact visuel confirmé sur l'entité anormale. Périmètre sécurisé.",
  commander: "Rapport validé par le Conseil O5. Autorisation d'expérimentation de classe 4 accordée.",
  intercom: "Début de l'enregistrement audio. Date : quatorze mars. Site dix-neuf."
};

/** Taille de cache lisible d'un coup d'œil (« 12,3 Mo », « 480 Ko »). */
const formatTailleOctets = (octets: number): string =>
  octets >= 1024 * 1024
    ? `${(octets / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;

const ROLE_IMMERSION_TAGS: Record<CharacterRole, { tag: string; color: string }> = {
  narrator: { tag: '📜 Archiviste Clinique Solennel', color: 'text-blue-400 bg-blue-950/60 border-blue-800/60' },
  researcher: { tag: '🔬 Scientifique & Analytique', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
  anomaly: { tag: '👁️ Timbre Sombre Inquiétant (-18Hz)', color: 'text-red-400 bg-red-950/60 border-red-800/60' },
  classD: { tag: '⚡ Débit Stressé Accéléré (+10%)', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
  agent: { tag: '📡 Émetteur Radio Tactique', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' },
  commander: { tag: '⚖️ Autorité Directe O5', color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' },
  intercom: { tag: '🔊 Bip Carillon & Haut-Parleur', color: 'text-slate-300 bg-slate-800 border-slate-600' }
};

const SCP_PRESETS = [
  {
    id: 'site-19',
    name: 'Site-19 Standard',
    desc: 'Équilibre officiel de la Fondation',
    assignments: DEFAULT_AI_ROLES_FR
  },
  {
    id: 'keter-tension',
    name: 'Confinement Keter / Euclid',
    desc: 'Anomalie inquiétante et personnel sous tension',
    assignments: {
      narrator: 'fr-FR-RemyMultilingualNeural',
      researcher: 'en-US-BrianMultilingualNeural',
      anomaly: 'en-US-AndrewMultilingualNeural',
      classD: 'en-AU-WilliamMultilingualNeural',
      agent: 'en-US-EmmaMultilingualNeural',
      commander: 'de-DE-FlorianMultilingualNeural',
      intercom: 'fr-FR-VivienneMultilingualNeural'
    }
  },
  {
    id: 'investigation-o5',
    name: 'Interrogatoire O5 / Médical',
    desc: 'Voix féminines au commandement et à la recherche',
    assignments: {
      narrator: 'fr-FR-RemyMultilingualNeural',
      researcher: 'en-US-AvaMultilingualNeural',
      anomaly: 'en-US-BrianMultilingualNeural',
      classD: 'en-AU-WilliamMultilingualNeural',
      agent: 'en-US-EmmaMultilingualNeural',
      commander: 'de-DE-SeraphinaMultilingualNeural',
      intercom: 'fr-FR-VivienneMultilingualNeural'
    }
  }
];

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  languageCode
}) => {
  const [engineMode, setEngineMode] = useState<TtsEngineMode>(speechEngine.getEngineMode());
  const [profiles, setProfiles] = useState<Record<CharacterRole, VoiceProfile>>(speechEngine.getVoiceProfiles());
  const [aiAssignments, setAiAssignments] = useState<Record<CharacterRole, string>>(speechEngine.getAiVoiceAssignments());
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeTab, setActiveTab] = useState<CharacterRole>('narrator');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [cacheLabel, setCacheLabel] = useState<string>('…');
  const [purgeArme, setPurgeArme] = useState<boolean>(false);

  const neuralVoices = NEURAL_VOICES_BY_LANG[languageCode] || NEURAL_VOICES_BY_LANG.fr;
  const stats = VOICE_LANGUAGE_STATS[languageCode] || VOICE_LANGUAGE_STATS.fr;

  // Extract unique regions for current language
  const availableRegions = Array.from(new Set(neuralVoices.map(v => v.region)));

  const filteredVoices = selectedRegion === 'all'
    ? neuralVoices
    : neuralVoices.filter(v => v.region === selectedRegion);

  /** Relecture de la taille du cache persistant (IndexedDB) pour l'afficher dans le pied. */
  const rafraichirTailleCache = async (): Promise<void> => {
    try {
      const { entries, bytes } = await speechEngine.getStoredAudioSize();
      setCacheLabel(`${entries} audios · ${formatTailleOctets(bytes)}`);
    } catch {
      setCacheLabel('indisponible');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSystemVoices(speechEngine.getAvailableSystemVoices(languageCode));
      setProfiles(speechEngine.getVoiceProfiles());
      setAiAssignments(speechEngine.getAiVoiceAssignments());
      setEngineMode(speechEngine.getEngineMode());
      setPurgeArme(false);
      void rafraichirTailleCache();
    }
  }, [isOpen, languageCode]);

  if (!isOpen) return null;

  const roles: CharacterRole[] = ['narrator', 'researcher', 'anomaly', 'classD', 'agent', 'commander', 'intercom'];
  const currentProfile = profiles[activeTab];
  const currentAiVoiceId = aiAssignments[activeTab] || neuralVoices[0]?.id;

  const handleUpdateProfile = (updates: Partial<VoiceProfile>) => {
    const updated = { ...currentProfile, ...updates };
    const newProfiles = { ...profiles, [activeTab]: updated };
    setProfiles(newProfiles);
    speechEngine.updateVoiceProfile(activeTab, updates);
  };

  const handleAiVoiceSelect = (voiceId: string) => {
    sfx.playTerminalBeep();
    const updated = { ...aiAssignments, [activeTab]: voiceId };
    setAiAssignments(updated);
    speechEngine.setAiVoiceAssignment(activeTab, voiceId);
  };

  const handleApplyPreset = (assignments: Record<CharacterRole, string>) => {
    sfx.playTerminalBeep();
    setAiAssignments(assignments);
    for (const [role, voiceId] of Object.entries(assignments)) {
      speechEngine.setAiVoiceAssignment(role as CharacterRole, voiceId);
    }
  };

  const handleToggleEngine = (mode: TtsEngineMode) => {
    sfx.playTerminalBeep();
    setEngineMode(mode);
    speechEngine.setEngineMode(mode);
  };

  const handleTestVoice = async () => {
    sfx.playTerminalBeep();
    setIsPlayingPreview(true);
    const text = SAMPLE_TEXTS[activeTab] || "Test de voix pour le rôle attribué.";
    await speechEngine.previewVoice(activeTab, text);
    setTimeout(() => setIsPlayingPreview(false), 3000);
  };

  const handleReset = () => {
    const def = DEFAULT_ROLE_PROFILES[activeTab];
    handleUpdateProfile({
      pitch: def.pitch,
      rate: def.rate,
      volume: def.volume
    });
  };

  /**
   * Purge du cache persistant en deux temps : le premier clic arme la confirmation, le
   * second vide IndexedDB puis rafraîchit la taille affichée. Le cache mémoire (blobs) est
   * libéré en quittant le dossier — on ne coupe pas une lecture en cours.
   */
  const handlePurgeCache = async (): Promise<void> => {
    sfx.playTerminalBeep();
    if (!purgeArme) {
      setPurgeArme(true);
      return;
    }
    setPurgeArme(false);
    await speechEngine.purgeStoredAudio();
    void rafraichirTailleCache();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-scp-surface border-2 border-red-800/70 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Modal Header with Engine Mode Selector */}
        <div className="bg-scp-card px-5 py-3.5 border-b border-scp-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-mono text-white">
                  STUDIO DES VOIX IA & ROLEPLAY
                </h2>
                <span className="text-[10px] bg-red-950 text-red-300 font-mono px-2 py-0.5 rounded border border-red-800/60 font-bold">
                  {stats.flag} {stats.totalVoices} VOIX {stats.langName.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Attribution des voix par personnage (Archiviste, Chercheurs, Anomalies, FIM) • 322 Voix Mondiales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine Switcher */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-scp-border">
              <button
                onClick={() => handleToggleEngine('neural')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  engineMode === 'neural'
                    ? 'bg-red-700 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Pack IA Neural</span>
              </button>
              <button
                onClick={() => handleToggleEngine('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  engineMode === 'system'
                    ? 'bg-slate-700 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Navigateur</span>
              </button>
            </div>

            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-scp-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presets & HuggingFace Info Bar */}
        <div className="px-5 py-2 bg-slate-900/70 border-b border-scp-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Préréglages SCP :</span>
            {SCP_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.assignments)}
                className="px-2.5 py-1 rounded-lg bg-scp-card hover:bg-scp-cardHover border border-scp-border text-[11px] font-mono text-slate-300 hover:text-white transition-colors shrink-0"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <Globe className="w-3 h-3" />
            <span>Packs Hugging Face & GitHub intégrés</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left Column: Role Selector */}
          <div className="sm:w-56 bg-scp-card/40 border-b sm:border-b-0 sm:border-r border-scp-border p-2 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto no-scrollbar">
            {roles.map((role) => {
              const prof = profiles[role];
              const isSelected = activeTab === role;
              return (
                <button
                  key={role}
                  onClick={() => {
                    sfx.playTerminalBeep();
                    setActiveTab(role);
                  }}
                  className={`px-3 py-2 rounded-xl text-left font-mono text-xs whitespace-nowrap sm:whitespace-normal transition-all flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-red-900/60 text-white border border-red-600/70 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-scp-surface/60'
                  }`}
                >
                  <span className="truncate">{prof.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Column: Customization Controls */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-mono font-bold text-slate-100">
                  {currentProfile.label}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${ROLE_IMMERSION_TAGS[activeTab].color}`}>
                  {ROLE_IMMERSION_TAGS[activeTab].tag}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic bg-scp-card/70 p-3 rounded-xl border border-scp-border">
                "{SAMPLE_TEXTS[activeTab]}"
              </p>
            </div>

            {/* Neural AI Voices Selection (when in Neural mode) */}
            {engineMode === 'neural' ? (
              <div className="space-y-2">
                {/* Region Filter Buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300">
                    Sélectionner la Voix ({filteredVoices.length}/{neuralVoices.length} voix) :
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedRegion('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        selectedRegion === 'all'
                          ? 'bg-red-700 text-white font-bold'
                          : 'bg-scp-card border border-scp-border text-slate-400 hover:text-white'
                      }`}
                    >
                      Toutes
                    </button>
                    {availableRegions.map(reg => (
                      <button
                        key={reg}
                        onClick={() => setSelectedRegion(reg)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          selectedRegion === reg
                            ? 'bg-red-700 text-white font-bold'
                            : 'bg-scp-card border border-scp-border text-slate-400 hover:text-white'
                        }`}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredVoices.map((v) => {
                    const isPicked = currentAiVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleAiVoiceSelect(v.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isPicked
                            ? 'bg-red-950/80 border-red-500 ring-1 ring-red-500/50 text-white shadow'
                            : 'bg-scp-card border-scp-border hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold truncate mr-1">{v.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-1.5 py-0.2 rounded shrink-0">
                            {v.region}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-300/90 font-mono font-medium leading-tight mb-1">
                          {v.archetype}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-1">
                          {v.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* System Browser Voices (Fallback mode) */
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Voix de votre appareil ({systemVoices.length} détectées) :
                </label>
                <select
                  value={currentProfile.voiceURI}
                  onChange={(e) => handleUpdateProfile({ voiceURI: e.target.value })}
                  className="w-full bg-scp-card border border-scp-border rounded-xl px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-red-600"
                >
                  {systemVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pitch Modulation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Modulation de Tonalité (Pitch) :</span>
                <span className="text-red-400 font-bold">
                  {currentProfile.pitch < 0.9 ? 'Grave / Sombre' : currentProfile.pitch > 1.1 ? 'Aigu / Dynamique' : 'Neutre'}
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={currentProfile.pitch}
                onChange={(e) => handleUpdateProfile({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Rythme de diction :</span>
                <span className="text-red-400 font-bold">{currentProfile.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={currentProfile.rate}
                onChange={(e) => handleUpdateProfile({ rate: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Actions: Test & Reset */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTestVoice}
                disabled={isPlayingPreview}
                className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-mono text-xs font-semibold py-2.5 px-4 rounded-xl shadow transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isPlayingPreview ? 'Écoute en cours...' : 'Tester la Réplique Roleplay'}</span>
              </button>

              <button
                onClick={handleReset}
                title="Rétablir les paramètres d'origine"
                className="flex items-center gap-1.5 bg-scp-card hover:bg-scp-cardHover border border-scp-border text-slate-300 text-xs font-mono py-2.5 px-3 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rétablir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-scp-card px-5 py-3 border-t border-scp-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <Award className="w-3.5 h-3.5" />
            <span>{stats.totalVoices} voix calibrées pour le jeu d'acteur SCP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <Database className="w-3.5 h-3.5" />
              <span>Cache : {cacheLabel}</span>
            </span>
            <button
              onClick={handlePurgeCache}
              title={purgeArme ? 'Cliquer à nouveau pour confirmer la purge' : 'Vide le cache audio persistant de cet appareil'}
              className={`flex items-center gap-1.5 text-xs font-mono py-2.5 px-3 rounded-xl border transition-colors ${
                purgeArme
                  ? 'bg-red-900/70 border-red-500 text-white'
                  : 'bg-scp-card hover:bg-scp-cardHover border-scp-border text-slate-300 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{purgeArme ? 'Confirmer ?' : 'Vider'}</span>
            </button>
          </div>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onClose();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-mono font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Appliquer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
