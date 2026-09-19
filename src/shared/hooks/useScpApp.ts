import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LanguageBranch, ObjectClass, ScpItemSummary, SUPPORTED_LANGUAGES } from '../../types/scp';
import { PlayerStatus, SpeechSegment } from '../../types/audioRoleplay';
// `import type` et non `import` : seul le type est utilisé ici, et un import de
// valeur tirerait les 73 Ko du calque éditorial dans le paquet d'entrée, que la
// vue soit affichée ou non.
import type { ScpEntity } from '../../data/departmentsData';
import { SCP_SERIES } from '../../data/seriesData';
import { cromApi } from '../../services/cromApi';
import { chargerEntites, dossiersDeLEntite, entiteParId } from '../../services/entityService';
import { scpDataApi } from '../../services/scpDataApi';
import { parseScpDossier } from '../../services/scriptParser';
import { WikiLink } from '../../services/linkExtractor';
import { speechEngine } from '../../services/speechEngine';
import { storageService } from '../../services/storageService';
import {
  appliquerFiltres,
  chargerIndex,
  compter,
  filtresActifs,
  FILTRES_VIDES,
  type FiltresEcoute
} from '../../services/corpusFilters';
import type { IndexCorpus } from '../../services/corpusIndex';
import { sfx } from '../../services/sfxService';
import { useIntercomAnnouncements } from '../../components/IntercomAnnouncement';

/**
 * Dev-only guard. This hook drives the `speechEngine` singleton, which keeps exactly one
 * status callback — so a second live instance silently steals the subscription and freezes
 * the UI's playerStatus. App must be the only caller; views receive it as a prop.
 */
let liveInstances = 0;

export function useScpApp() {
  useEffect(() => {
    liveInstances++;
    if (import.meta.env.DEV && liveInstances > 1) {
      console.error(
        `[useScpApp] ${liveInstances} instances actives. Ce hook doit être appelé UNIQUEMENT ` +
          `dans App.tsx et transmis en prop : plusieurs instances se disputent le callback ` +
          `unique de speechEngine, ce qui fige le lecteur audio et le suivi des segments.`
      );
    }
    return () => {
      liveInstances--;
    };
  }, []);

  const [currentLanguage, setCurrentLanguage] = useState<LanguageBranch>(SUPPORTED_LANGUAGES[0]);
  const [selectedClass, setSelectedClass] = useState<ObjectClass | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedSubRange, setSelectedSubRange] = useState<string | null>(null);

  // Filtres d'écoute (durée, théâtre, ambiance, notoriété) — ils s'appuient sur l'index
  // de corpus, pas sur Crom, qui ne sait filtrer aucun des quatre.
  const [filtresEcoute, setFiltresEcoute] = useState<FiltresEcoute>(FILTRES_VIDES);
  const [indexCorpus, setIndexCorpus] = useState<IndexCorpus | null>(null);

  const handleSetSelectedSeries = useCallback((seriesId: string | null) => {
    setSelectedSeries(seriesId);
    setSelectedSubRange(null);
  }, []);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Audio speech & player state
  const [activeSegments, setActiveSegments] = useState<SpeechSegment[]>([]);
  /** Mot en cours de lecture, pour le suivi à l'écran. `wordIndex` vaut -1 hors lecture. */
  const [activeWord, setActiveWord] = useState<{ segmentIndex: number; wordIndex: number }>({
    segmentIndex: -1,
    wordIndex: -1
  });
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlaying: false,
    isPaused: false,
    currentSegmentIndex: 0,
    totalSegments: 0,
    currentSpeaker: 'Narrateur',
    currentRole: 'narrator',
    globalSpeed: 1.0,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false
  });

  // Modals & favorites
  const [favorites, setFavorites] = useState<ScpItemSummary[]>(storageService.getFavorites());
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState<boolean>(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<ScpEntity | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [ambienceActive, setAmbienceActive] = useState<boolean>(false);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);

  // Roleplay immersion state
  const [bootDone, setBootDone] = useState<boolean>(false);
  const [memeticDone, setMemeticDone] = useState<boolean>(false);
  const [showBiometric, setShowBiometric] = useState<boolean>(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const intercomTrigger = useIntercomAnnouncements(bootDone && memeticDone);
  const stampTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation entre dossiers liés : pile pour revenir en arrière, file « À SUIVRE » pour
  // mettre un lien de côté sans interrompre l'écoute en cours.
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

  /**
   * Le filtre d'entité : « montre-moi les dossiers de la Main du Serpent ».
   *
   * Il remplace le détour par la recherche plein texte sur un mot-clé, qui était le
   * seul chemin jusqu'ici (`onSearch(entity.queryKeywords[0])`) et qui ne rendait pas
   * les dossiers de l'entité mais ceux dont le TEXTE contient le mot.
   */
  const [entiteFiltre, setEntiteFiltre] = useState<string | null>(null);
  const [readingQueue, setReadingQueue] = useState<WikiLink[]>(storageService.getReadingQueue());

  // TanStack Query 1: Search query with automatic caching and deduping
  const { 
    data: searchData, 
    isLoading: isSearchLoading,
    error: searchError 
  } = useQuery({
    queryKey: ['scp-search', searchQuery, currentLanguage.code],
    queryFn: () => {
      const q = searchQuery.trim();
      if (/^scp-\d$/i.test(q) || q === '-fr' || q === '-ex' || q === '-j') {
        return cromApi.fetchByPrefix(q, currentLanguage.code, 48);
      }
      return cromApi.searchScp(q, currentLanguage.code);
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 15 // 15 minutes
  });

  // TanStack Query 1b: Browse a whole series (SCP-000→999, 1000→1999, …) from Crom.
  // Without this the catalogue could only ever show the 64 hand-picked dossiers in
  // scpDataApi, which is why most of the corpus looked "missing".
  const activeSeries = SCP_SERIES.find(s => s.id === selectedSeries) || null;
  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    error: seriesError
  } = useQuery({
    queryKey: ['scp-series', activeSeries?.id, currentLanguage.code],
    queryFn: () => cromApi.fetchSeries(activeSeries!.id, currentLanguage.code),
    enabled: !!activeSeries && searchQuery.trim().length === 0,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // TanStack Query 1c : les dossiers d'une entité. Les slugs viennent de l'index local
  // (déjà chargé), seuls les résumés demandent le réseau.
  const {
    data: entiteData,
    isLoading: isEntiteLoading
  } = useQuery({
    queryKey: ['scp-entite', entiteFiltre, currentLanguage.code],
    queryFn: async () => {
      await chargerEntites(currentLanguage.code);
      const slugs = dossiersDeLEntite(entiteFiltre!, currentLanguage.code).slice(0, 120);
      return cromApi.fetchBySlugs(slugs, currentLanguage.code);
    },
    enabled: !!entiteFiltre && searchQuery.trim().length === 0,
    staleTime: 1000 * 60 * 30
  });

  // TanStack Query 2: Active SCP Dossier full text & metadata
  const { 
    data: activeScpDetail, 
    isLoading: isDetailLoading,
    error: detailError 
  } = useQuery({
    queryKey: ['scp-detail', activeSlug, currentLanguage.code],
    queryFn: () => cromApi.fetchScpDetail(activeSlug!, currentLanguage.code),
    enabled: !!activeSlug,
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  // TanStack Query 3: only when the dossier is missing from the current branch — is it
  // untranslated (exists in English) or a genuine dead link? Drives the user-facing message.
  const detailMissing = !!activeSlug && !isDetailLoading && !activeScpDetail;
  const { data: englishFallback } = useQuery({
    queryKey: ['scp-en-fallback', activeSlug],
    queryFn: () => cromApi.findEnglishFallback(activeSlug!),
    enabled: detailMissing && currentLanguage.code !== 'en',
    staleTime: 1000 * 60 * 60
  });

  // Subscribe to the engine FIRST, before any effect that can call setScript(). Effects
  // run in declaration order, so registering later would drop the initial status emit.
  // `onStatusChange` holds a single callback slot and re-emits on registration.
  useEffect(() => {
    speechEngine.onStatusChange(setPlayerStatus);
    // Suivi de lecture mot à mot. Volontairement séparé de `playerStatus` : le mot change
    // plusieurs fois par seconde, et le faire passer par l'état du lecteur redessinerait
    // tout l'arbre à chaque syllabe.
    speechEngine.onWordChange((segmentIndex, wordIndex) =>
      setActiveWord({ segmentIndex, wordIndex })
    );
  }, []);

  // Parse script whenever activeScpDetail changes
  useEffect(() => {
    if (activeScpDetail) {
      // Paginated dossiers arrive as a main page plus fragments; each is parsed separately
      // so its own footnote block resolves correctly.
      const parsed = parseScpDossier(
        [activeScpDetail.textContent, ...(activeScpDetail.fragments || [])],
        activeScpDetail.title,
        currentLanguage.code,
        activeScpDetail.source
      );
      setActiveSegments(parsed);
      speechEngine.setScript(
        parsed, 
        `${activeScpDetail.scpNumber} - ${activeScpDetail.alternateTitle || activeScpDetail.title}`
      );
      storageService.addToRecent(activeScpDetail);
    }
  }, [activeScpDetail, currentLanguage.code]);

  useEffect(() => {
    speechEngine.setLanguage(currentLanguage.code);
  }, [currentLanguage]);

  // L'index de la branche est chargé à la demande (morceau séparé, ~69 Ko gzip en FR).
  // Toutes les branches n'en ont pas : sans index, les filtres d'écoute restent inertes
  // plutôt que de masquer des dossiers dont on ignore la durée.
  useEffect(() => {
    let annule = false;
    chargerIndex(currentLanguage.code).then(index => {
      if (!annule) setIndexCorpus(index);
    });
    return () => { annule = true; };
  }, [currentLanguage]);

  // Changer de branche invalide les filtres : le vocabulaire de tags et les seuils de
  // cohorte sont propres à chaque corpus.
  useEffect(() => {
    setFiltresEcoute(FILTRES_VIDES);
  }, [currentLanguage]);

  // Release cached audio blob URLs and pending timers when the app unmounts.
  useEffect(() => {
    return () => {
      if (stampTimer.current) clearTimeout(stampTimer.current);
      speechEngine.stop();
      speechEngine.clearAudioCache();
    };
  }, []);

  // Determine items to display: an active search wins, then a browsed series, then the
  // curated iconic list as the instant-render default.
  const isSearching = searchQuery.trim().length > 0;
  const rawItems: ScpItemSummary[] = isSearching
    ? (searchData || [])
    : entiteFiltre
      ? (entiteData || [])
      : activeSeries
        ? (seriesData || [])
        : scpDataApi.getIconicScps();

  const currentSubRange = activeSeries?.subRanges?.find(r => r.id === selectedSubRange);

  const itemsFiltresClasse = rawItems.filter((item) => {
    // Sub-range filter when browsing a series without global search
    if (!isSearching && currentSubRange) {
      const numMatch = item.scpNumber.match(/SCP-(\d+)/i);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num < currentSubRange.min || num > currentSubRange.max) {
          return false;
        }
      }
    }

    if (selectedClass === 'ALL') return true;
    return item.objectClass === selectedClass;
  });

  // Puis les filtres d'écoute, qui ne peuvent s'appliquer qu'ici : la durée et la part de
  // dialogue viennent de l'index, pas de la réponse de Crom.
  const filteredItems = appliquerFiltres(itemsFiltresClasse, filtresEcoute, indexCorpus);

  // Compteurs par facette, pour afficher « 🎭 Théâtre (67) » avant même le clic.
  const compteursEcoute = compter(itemsFiltresClasse, indexCorpus);
  const nbFiltresEcoute = filtresActifs(filtresEcoute);
  const ecouteFilterHidEverything =
    nbFiltresEcoute > 0 && itemsFiltresClasse.length > 0 && filteredItems.length === 0;

  // The class filter is applied client-side to whatever page of results is loaded — Crom
  // cannot filter by object class server-side. Surfacing this lets the UI explain an empty
  // grid instead of looking broken.
  const classFilterHidEverything =
    selectedClass !== 'ALL' && rawItems.length > 0 && filteredItems.length === 0;

  // SCP selection through biometric scanner
  const handleSelectScp = useCallback((slugOrNumber: string) => {
    sfx.playTerminalBeep();
    setPendingSlug(slugOrNumber);
    setShowBiometric(true);
    setShowStamp(false);
    setShowAlert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Called when biometric access is granted
  const handleBiometricGranted = useCallback(() => {
    setShowBiometric(false);
    if (pendingSlug) {
      setActiveSlug(pendingSlug);
      setPendingSlug(null);
      if (stampTimer.current) clearTimeout(stampTimer.current);
      stampTimer.current = setTimeout(() => setShowStamp(true), 600);
    }
  }, [pendingSlug]);

  // Show containment alert when a Keter/Apollyon dossier opens
  useEffect(() => {
    if (!activeScpDetail) return;
    const cls = activeScpDetail.objectClass;
    if (cls !== 'Keter' && cls !== 'Apollyon' && cls !== 'Thaumiel') return;

    // Cleared on unmount / dossier change, otherwise the alarm fires for a dossier the
    // user already left.
    const timer = setTimeout(() => {
      setShowAlert(true);
      sfx.playBreachAlarm(1.5);
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeScpDetail]);

  const handleRandomScp = useCallback(() => {
    const iconic = scpDataApi.getIconicScps();
    const randomPick = iconic[Math.floor(Math.random() * iconic.length)];
    handleSelectScp(randomPick.slug);
  }, [handleSelectScp]);

  const handleToggleFavorite = useCallback((item: ScpItemSummary) => {
    storageService.toggleFavorite(item);
    setFavorites(storageService.getFavorites());
  }, []);

  /** Mettre un lien de côté sans interrompre la lecture. */
  const enqueueLink = useCallback((link: WikiLink) => {
    sfx.playTerminalBeep();
    setReadingQueue(prev => {
      if (prev.some(l => l.target === link.target)) return prev;
      const next = [...prev, link];
      storageService.saveReadingQueue(next);
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((target: string) => {
    setReadingQueue(prev => {
      const next = prev.filter(l => l.target !== target);
      storageService.saveReadingQueue(next);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setReadingQueue([]);
    storageService.saveReadingQueue([]);
  }, []);

  /**
   * Ouvrir un lien tout de suite. Les liens externes sortent vers le navigateur ; tout le
   * reste (SCP, contes, hubs, formats GdI) se charge dans l'app — vérifié : `fetchScpDetail`
   * sait déjà résoudre ces slugs.
   */
  const openLink = useCallback((link: WikiLink) => {
    if (link.kind === 'external') {
      window.open(link.url || link.target, '_blank', 'noopener,noreferrer');
      return;
    }
    setNavigationStack(prev => (activeSlug ? [...prev, activeSlug] : prev));
    removeFromQueue(link.target);
    handleSelectScp(link.target);
  }, [activeSlug, handleSelectScp, removeFromQueue]);

  /** Revenir au dossier depuis lequel on a suivi un lien. */
  const handleGoBack = useCallback(() => {
    setNavigationStack(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      speechEngine.stop();
      setActiveSlug(previous);
      return prev.slice(0, -1);
    });
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setNavigationStack([]);
    speechEngine.stop();
    setActiveSlug(null);
    setShowStamp(false);
    setShowAlert(false);
  }, []);

  const toggleSfx = useCallback(() => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    sfx.enabled = next;
  }, [sfxEnabled]);

  const toggleAmbience = useCallback(() => {
    const active = sfx.toggleContainmentAmbience();
    setAmbienceActive(active);
  }, []);

  const toggleCrt = useCallback(() => {
    setCrtEnabled(prev => !prev);
  }, []);

  return {
    // Language & Search & Filters
    currentLanguage,
    setCurrentLanguage,
    selectedClass,
    setSelectedClass,
    searchQuery,
    setSearchQuery,
    filteredItems,
    isSearchLoading: isSearchLoading || isSeriesLoading || isEntiteLoading,
    searchError: searchError || seriesError,
    classFilterHidEverything,

    // Filtre d'entité : département, chercheur, faction, site, zone, FIM.
    entiteFiltre,
    /** L'entité filtrée, pour l'afficher ; `null` si le répertoire n'est pas chargé. */
    entiteFiltreObjet: entiteFiltre ? entiteParId(entiteFiltre) ?? null : null,
    filtrerParEntite: (id: string | null) => {
      // Une entité et une recherche se contredisent : la seconde gagne, on efface
      // l'autre plutôt que d'afficher une liste dont on ne sait plus d'où elle sort.
      setSearchQuery('');
      setSelectedSeries(null);
      setSelectedSubRange(null);
      setActiveSlug(null);
      setEntiteFiltre(id);
    },

    // Filtres d'écoute (index de corpus)
    filtresEcoute,
    setFiltresEcoute,
    indexCorpus,
    compteursEcoute,
    nbFiltresEcoute,
    ecouteFilterHidEverything,

    // Series browsing (full corpus, not just the curated list)
    availableSeries: SCP_SERIES,
    selectedSeries,
    setSelectedSeries: handleSetSelectedSeries,
    activeSeries,
    selectedSubRange,
    setSelectedSubRange,
    availableSubRanges: activeSeries?.subRanges ?? [],
    
    // Active Dossier & Detail
    activeSlug,
    setActiveSlug,
    activeScpDetail,
    isDetailLoading,
    detailError,
    /** Set when the dossier is absent locally but exists in English — "pas encore traduite". */
    englishFallback: englishFallback ?? null,
    /** Jump to the English branch keeping the same dossier open. */
    readInEnglish: () => {
      const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
      if (en) setCurrentLanguage(en);
    },
    activeSegments,
    
    // Audio Player State & Engine
    playerStatus,
    activeWord,
    ambienceActive,
    toggleAmbience,
    speechEngine,
    
    // Modals & Entity
    favorites,
    isVoiceStudioOpen,
    setIsVoiceStudioOpen,
    isFavoritesOpen,
    setIsFavoritesOpen,
    isExplorerOpen,
    setIsExplorerOpen,
    selectedEntity,
    setSelectedEntity,
    
    // Audio FX & Visual Filters
    sfxEnabled,
    toggleSfx,
    crtEnabled,
    toggleCrt,
    
    // Roleplay Immersion
    bootDone,
    setBootDone,
    memeticDone,
    setMemeticDone,
    showBiometric,
    setShowBiometric,
    pendingSlug,
    showStamp,
    setShowStamp,
    showAlert,
    setShowAlert,
    intercomTrigger,
    
    // Handlers
    // Liens inter-dossiers
    readingQueue,
    enqueueLink,
    removeFromQueue,
    clearQueue,
    openLink,
    handleGoBack,
    canGoBack: navigationStack.length > 0,

    handleSelectScp,
    handleBiometricGranted,
    handleRandomScp,
    handleToggleFavorite,
    handleBackToCatalog
  };
}
