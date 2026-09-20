import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Sparkles, Check, Cpu, Radio, Award, Shield, Flame, Activity, Globe, Info, Database, Trash2 } from 'lucide-react';
import { CharacterRole, VoiceProfile } from '../types/audioRoleplay';
import { speechEngine, TtsEngineMode } from '../services/speechEngine';
import { DEFAULT_ROLE_PROFILES } from '../services/storageService';
import { DEFAULT_AI_ROLES_FR, NEURAL_VOICES_BY_LANG, VOICE_LANGUAGE_STATS } from '../types/neuralVoices';
import { sfx } from '../services/sfxService';
import { FenetreScipnet } from './FenetreScipnet';
import { CleTraduction, useT } from '../i18n';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageCode: string;
}

/**
 * Les répliques d'essai, par clé.
 *
 * On stocke la clé et non le texte : ce module est évalué une fois, avant que
 * la langue ne soit connue, et surtout ces phrases sont **lues à voix haute**
 * pour comparer les timbres — une voix anglaise lisant du français ne dit rien
 * de ce qu'elle vaut.
 */
const REPLIQUES_ESSAI: Record<CharacterRole, CleTraduction> = {
  narrator: 'replique.narrateur',
  researcher: 'replique.chercheur',
  anomaly: 'replique.anomalie',
  classD: 'replique.classeD',
  agent: 'replique.agent',
  commander: 'replique.commandement',
  intercom: 'replique.intercom'
};

/** Taille de cache lisible d'un coup d'œil (« 12,3 Mo », « 480 Ko »). */
const formatTailleOctets = (octets: number): string =>
  octets >= 1024 * 1024
    ? `${(octets / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;

const ROLE_IMMERSION_TAGS: Record<CharacterRole, { cle: CleTraduction; color: string }> = {
  narrator: { cle: 'timbre.narrateur', color: 'text-role-narrateur bg-surface-3/60 border-role-narrateur/60' },
  researcher: { cle: 'timbre.chercheur', color: 'text-classe-safe bg-surface-3/60 border-classe-safe/60' },
  anomaly: { cle: 'timbre.anomalie', color: 'text-accent-texte bg-surface-3/60 border-accent-texte/60' },
  classD: { cle: 'timbre.classeD', color: 'text-classe-euclid bg-surface-3/60 border-classe-euclid/60' },
  agent: { cle: 'timbre.agent', color: 'text-role-agent bg-surface-3/60 border-role-agent/60' },
  commander: { cle: 'timbre.commandement', color: 'text-classe-thaumiel bg-surface-3/60 border-classe-thaumiel/60' },
  intercom: { cle: 'timbre.intercom', color: 'text-texte-second bg-surface-2 border-bordure-forte' }
};

const SCP_PRESETS = [
  {
    id: 'site-19',
    nomCle: 'prereglage.standard' as CleTraduction,
    descCle: 'studio.equilibre' as CleTraduction,
    assignments: DEFAULT_AI_ROLES_FR
  },
  {
    id: 'keter-tension',
    nomCle: 'prereglage.keter' as CleTraduction,
    descCle: 'studio.anomalieInquietante' as CleTraduction,
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
    nomCle: 'prereglage.o5' as CleTraduction,
    descCle: 'studio.voixFeminines' as CleTraduction,
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
  const t = useT();
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
    const text = t(REPLIQUES_ESSAI[activeTab] ?? 'studio.testRole');
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
    <FenetreScipnet
      isOpen={isOpen}
      onClose={onClose}
      titre={t('studio.titre')}
      classification={`${stats.totalVoices} voix · ${stats.langName}`}
      icone={<Sparkles className="w-4 h-4" />}
      largeur="max-w-3xl"
    >
      <div className="flex flex-col">
        <div className="px-4 sm:px-5 py-3 border-b border-bordure-faible flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-serif text-sm text-texte-second max-w-lecture">
            {t('studio.sousTitre')}
          </p>

          <div className="flex items-center gap-2">
            {/* Engine Switcher */}
            <div className="flex items-center bg-surface-1/80 p-1 rounded-xl border border-scp-border">
              <button
                onClick={() => handleToggleEngine('neural')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  engineMode === 'neural'
                    ? 'bg-accent text-texte font-bold shadow'
                    : 'text-texte-attenue hover:text-texte'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{t('studio.packNeural')}</span>
              </button>
              <button
                onClick={() => handleToggleEngine('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  engineMode === 'system'
                    ? 'bg-surface-3 text-texte font-bold shadow'
                    : 'text-texte-attenue hover:text-texte'
                }`}
              >
                <span>{t('studio.navigateur')}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Presets & HuggingFace Info Bar */}
        <div className="px-5 py-2 bg-surface-1/70 border-b border-scp-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-mono text-texte-attenue shrink-0">{t('studio.prereglages')}</span>
            {SCP_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.assignments)}
                className="px-2.5 py-1 rounded-lg bg-scp-card hover:bg-scp-cardHover border border-scp-border text-xs font-mono text-texte-second hover:text-texte transition-colors shrink-0"
              >
                {t(preset.nomCle)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-classe-safe bg-surface-3/40 px-2 py-0.5 rounded border border-classe-safe/40">
            <Globe className="w-3 h-3" />
            <span>{t('studio.packsIntegres')}</span>
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
                      ? 'bg-surface-3/60 text-texte border border-accent-texte/70 font-bold shadow'
                      : 'text-texte-attenue hover:text-texte hover:bg-scp-surface/60'
                  }`}
                >
                  <span className="truncate">{prof.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent-texte shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Column: Customization Controls */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-mono font-bold text-texte">
                  {currentProfile.label}
                </h3>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${ROLE_IMMERSION_TAGS[activeTab].color}`}>
                  {t(ROLE_IMMERSION_TAGS[activeTab].cle)}
                </span>
              </div>
              <p className="text-xs text-texte-second italic bg-scp-card/70 p-3 rounded-xl border border-scp-border">
                "{t(REPLIQUES_ESSAI[activeTab])}"
              </p>
            </div>

            {/* Neural AI Voices Selection (when in Neural mode) */}
            {engineMode === 'neural' ? (
              <div className="space-y-2">
                {/* Region Filter Buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-texte-second">
                    Sélectionner la Voix ({filteredVoices.length}/{neuralVoices.length} voix) :
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedRegion('all')}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                        selectedRegion === 'all'
                          ? 'bg-accent text-texte font-bold'
                          : 'bg-scp-card border border-scp-border text-texte-attenue hover:text-texte'
                      }`}
                    >
                      {t('studio.toutes')}
                    </button>
                    {availableRegions.map(reg => (
                      <button
                        key={reg}
                        onClick={() => setSelectedRegion(reg)}
                        className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                          selectedRegion === reg
                            ? 'bg-accent text-texte font-bold'
                            : 'bg-scp-card border border-scp-border text-texte-attenue hover:text-texte'
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
                            ? 'bg-surface-3/80 border-accent-texte ring-1 ring-accent-texte/50 text-texte shadow'
                            : 'bg-scp-card border-scp-border hover:border-bordure-forte text-texte-second'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold truncate mr-1">{v.name}</span>
                          <span className="text-xs text-texte-attenue font-mono bg-surface-1/80 px-1.5 py-0.5 rounded shrink-0">
                            {v.region}
                          </span>
                        </div>
                        <p className="text-xs text-accent-texte/90 font-mono font-medium leading-tight mb-1">
                          {v.archetype}
                        </p>
                        <p className="text-xs text-texte-attenue leading-snug line-clamp-1">
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
                <label className="block text-xs font-mono text-texte-second">
                  Voix de votre appareil ({systemVoices.length} détectées) :
                </label>
                <select
                  value={currentProfile.voiceURI}
                  onChange={(e) => handleUpdateProfile({ voiceURI: e.target.value })}
                  className="w-full bg-scp-card border border-scp-border rounded-xl px-3 py-2 text-xs text-texte font-sans focus:outline-none focus:border-accent-texte"
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
              <div className="flex justify-between text-xs font-mono text-texte-second">
                <span>{t('studio.tonalite')}</span>
                <span className="text-accent-texte font-bold">
                  {t(currentProfile.pitch < 0.9 ? 'studio.grave' : currentProfile.pitch > 1.1 ? 'studio.aigu' : 'studio.neutre')}
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={currentProfile.pitch}
                onChange={(e) => handleUpdateProfile({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-accent-texte"
              />
            </div>

            {/* Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-texte-second">
                <span>{t('studio.rythme')}</span>
                <span className="text-accent-texte font-bold">{currentProfile.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={currentProfile.rate}
                onChange={(e) => handleUpdateProfile({ rate: parseFloat(e.target.value) })}
                className="w-full accent-accent-texte"
              />
            </div>

            {/* Actions: Test & Reset */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTestVoice}
                disabled={isPlayingPreview}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent disabled:opacity-50 text-texte font-mono text-xs font-semibold py-2.5 px-4 rounded-xl shadow transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isPlayingPreview ? t('studio.ecouteEnCours') : t('studio.tester')}</span>
              </button>

              <button
                onClick={handleReset}
                title={t('studio.retablirInfo')}
                className="flex items-center gap-1.5 bg-scp-card hover:bg-scp-cardHover border border-scp-border text-texte-second text-xs font-mono py-2.5 px-3 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('studio.retablir')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-scp-card px-5 py-3 border-t border-scp-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-classe-safe">
            <Award className="w-3.5 h-3.5" />
            <span>{t('studio.voixCalibrees', { n: String(stats.totalVoices) })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono text-texte-attenue">
              <Database className="w-3.5 h-3.5" />
              <span>{t('studio.cache', { taille: cacheLabel })}</span>
            </span>
            <button
              onClick={handlePurgeCache}
              title={purgeArme ? t('studio.confirmerPurge') : t('studio.videCache')}
              className={`flex items-center gap-1.5 text-xs font-mono py-2.5 px-3 rounded-xl border transition-colors ${
                purgeArme
                  ? 'bg-surface-3/70 border-accent-texte text-texte'
                  : 'bg-scp-card hover:bg-scp-cardHover border-scp-border text-texte-second hover:text-texte'
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
            className="bg-surface-2 hover:bg-surface-3 text-texte text-xs font-mono font-medium px-4 py-2 rounded-xl transition-colors"
          >
            {t('studio.appliquer')}
          </button>
        </div>
      </div>
    </FenetreScipnet>
  );
};
