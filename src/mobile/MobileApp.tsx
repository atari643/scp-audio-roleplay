import React, { useState, useEffect, useRef, useLayoutEffect, Suspense, lazy } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { MobileAudioSheet } from './components/MobileAudioSheet';
import { MobileScpCard } from './components/MobileScpCard';
import { metaDossier } from '../services/corpusFilters';
import { MobileSearchFilters } from './components/MobileSearchFilters';
import { MobileScpReader } from './components/MobileScpReader';
import { MobileBiometricScanner } from './components/MobileBiometricScanner';
import { MobileTacticalDrawer } from './components/MobileTacticalDrawer';
import { BootSequence } from '../components/BootSequence';
import { MemeticWarning } from '../components/MemeticWarning';
import { ContainmentAlert } from '../components/ContainmentAlert';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { IntercomAnnouncement } from '../components/IntercomAnnouncement';
import { dossiersDeLEntite, entiteParId, nomEntite } from '../services/entityService';
import { useScpApp } from '../shared/hooks/useScpApp';
import { DeviceMode } from '../shared/hooks/useDeviceMode';
import { sfx } from '../services/sfxService';
import { Loader2, Radio, BookOpen, AlertTriangle, Languages } from 'lucide-react';

/**
 * Écrans et fenêtres chargés à la demande.
 *
 * Aucun de ces cinq n'est visible au premier affichage, et à eux seuls ils
 * pesaient plus lourd que le catalogue : `EntityDetailModal` entraîne avec lui
 * les 73 Ko du calque éditorial des départements, `ScipnetExplorerModal` toute
 * la fenêtre d'exploration, `VoiceStudioModal` les douze voix et leurs
 * préréglages. Sur une connexion mobile, les faire attendre la première ouverture
 * est exactement le bon compromis : quelques dizaines de millisecondes au clic
 * contre autant de kilo-octets en moins avant la première liste de dossiers.
 */
const VoiceStudioModal = lazy(() =>
  import('../components/VoiceStudioModal').then(m => ({ default: m.VoiceStudioModal }))
);
const FavoritesModal = lazy(() =>
  import('../components/FavoritesModal').then(m => ({ default: m.FavoritesModal }))
);
const ScipnetExplorerModal = lazy(() =>
  import('../components/ScipnetExplorerModal').then(m => ({ default: m.ScipnetExplorerModal }))
);
const EntityDetailModal = lazy(() =>
  import('../components/EntityDetailModal').then(m => ({ default: m.EntityDetailModal }))
);
const RaisaTerminal = lazy(() =>
  import('../components/RaisaTerminal').then(m => ({ default: m.RaisaTerminal }))
);
const MobileEntitesScreen = lazy(() =>
  import('./components/MobileEntitesScreen').then(m => ({ default: m.MobileEntitesScreen }))
);

/** Attente discrète pendant l'arrivée d'un écran chargé à la demande. */
const ChargementEcran: React.FC = () => (
  <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
    <Loader2 className="w-6 h-6 animate-spin text-accent-texte" />
  </div>
);

interface MobileAppProps {
  /**
   * REQUIRED — see the note in DesktopApp. A local fallback instance would double the
   * app state and fight over the speechEngine singleton's single status callback,
   * freezing playerStatus (no audio player, no segment tracking).
   */
  app: ReturnType<typeof useScpApp>;
  /**
   * Also owned by App, for the same reason. A local useDeviceMode() would keep its own
   * `mode` state, so switching to desktop from the mobile drawer updated a copy App never
   * reads — and the view never actually switched.
   */
  toggleMode: () => void;
  setDeviceMode: (mode: DeviceMode) => void;
}

export const MobileApp: React.FC<MobileAppProps> = ({ app, toggleMode, setDeviceMode }) => {

  const {
    currentLanguage,
    filtrerParEntite,
    entiteFiltreObjet,
    setCurrentLanguage,
    selectedClass,
    setSelectedClass,
    searchQuery,
    setSearchQuery,
    filteredItems,
    indexCorpus,
    isSearchLoading,
    englishFallback,
    readInEnglish,
    readingQueue,
    enqueueLink,
    removeFromQueue,
    clearQueue,
    openLink,
    availableSeries,
    selectedSeries,
    setSelectedSeries,
    selectedSubRange,
    setSelectedSubRange,
    searchError,
    activeSlug,
    setActiveSlug,
    activeScpDetail,
    isDetailLoading,
    detailError,
    activeSegments,
    playerStatus,
    activeWord,
    ambienceActive,
    toggleAmbience,
    speechEngine,
    favorites,
    isVoiceStudioOpen,
    setIsVoiceStudioOpen,
    isFavoritesOpen,
    setIsFavoritesOpen,
    isExplorerOpen,
    setIsExplorerOpen,
    selectedEntity,
    setSelectedEntity,
    sfxEnabled,
    toggleSfx,
    crtEnabled,
    toggleCrt,
    bootDone,
    setBootDone,
    memeticDone,
    setMemeticDone,
    showBiometric,
    pendingSlug,
    showAlert,
    setShowAlert,
    intercomTrigger,
    handleSelectScp,
    handleBiometricGranted,
    handleRandomScp,
    handleToggleFavorite,
    handleBackToCatalog
  } = app;

  const [activeTab, setActiveTab] = useState<MobileTab>('catalog');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRaisaModal, setShowRaisaModal] = useState(false);

  /**
   * Catalogue virtualisé.
   *
   * Le catalogue affichait 40 cartes puis un bouton « Afficher les 40 suivants » : sur
   * téléphone, chaque appui empilait quarante cartes de plus dans le DOM et le défilement
   * s'alourdissait à mesure qu'on avançait. On rend maintenant la fenêtre visible et elle
   * seule, quel que soit le nombre de dossiers.
   *
   * La subtilité est la `scrollMargin` : la liste n'est pas en tête du conteneur qui défile,
   * elle est précédée du bandeau et des filtres, dont la hauteur varie (filtres dépliés,
   * bandeau de repli anglais…). On la mesure donc au lieu de la supposer, et on la remesure
   * quand ce qui précède change de taille.
   */
  const refDefilement = useRef<HTMLElement | null>(null);
  const refListe = useRef<HTMLDivElement | null>(null);
  const [margeListe, setMargeListe] = useState(0);

  useLayoutEffect(() => {
    const liste = refListe.current;
    const zone = refDefilement.current;
    if (!liste || !zone) return;

    const mesurer = () => {
      const haut = liste.getBoundingClientRect().top - zone.getBoundingClientRect().top;
      setMargeListe(Math.max(0, Math.round(haut + zone.scrollTop)));
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(zone);
    // Tous les ancêtres jusqu'au conteneur qui défile : c'est le dépliage des
    // filtres, deux niveaux plus haut, qui déplace la liste, et un observateur
    // posé sur la liste seule ne le verrait jamais.
    for (let noeud = liste.parentElement; noeud && noeud !== zone; noeud = noeud.parentElement) {
      observateur.observe(noeud);
    }
    return () => observateur.disconnect();
  }, [activeTab, filteredItems.length, isSearchLoading]);

  // Un changement de filtre repart du haut : sans ça, on reste au milieu d'une liste
  // qui n'a plus rien à voir avec celle qu'on parcourait.
  useEffect(() => {
    refDefilement.current?.scrollTo({ top: 0 });
  }, [selectedSeries, selectedSubRange, selectedClass, searchQuery]);

  const virtualiseur = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => refDefilement.current,
    // Hauteur d'une carte + l'espace de 10 px de `space-y-2.5` ; affinée par mesure réelle.
    estimateSize: () => 138,
    overscan: 5,
    scrollMargin: margeListe,
    getItemKey: (index) => filteredItems[index]?.slug ?? index
  });

  // Automatically jump to reader tab when a dossier is loaded
  useEffect(() => {
    if (activeSlug && activeScpDetail) {
      setActiveTab('reader');
    }
  }, [activeSlug, activeScpDetail]);

  // L'onglet SCiPNET affiche désormais `MobileEntitesScreen`, pas la fenêtre
  // Windows 2000 du desktop : celle-ci fait 1152 px de large et un arbre de 256 px,
  // ce qui déborde de tout téléphone. L'explorateur desktop reste monté plus bas,
  // atteignable depuis le tiroir, pour qui veut l'arborescence complète.

  // If user opens settings tab, open the tactical drawer
  useEffect(() => {
    if (activeTab === 'settings') {
      setIsDrawerOpen(true);
    }
  }, [activeTab]);

  // ===== ROLEPLAY EFFECT 1: Boot Sequence =====
  if (!bootDone) {
    return <BootSequence onComplete={() => setBootDone(true)} />;
  }

  // ===== ROLEPLAY EFFECT 2: Memetic Warning =====
  if (!memeticDone) {
    return <MemeticWarning onComplete={() => setMemeticDone(true)} />;
  }

  return (
    <div className={`min-h-screen bg-scp-bg text-scp-text flex flex-col antialiased selection:bg-surface-3 selection:text-texte ${crtEnabled ? 'crt-screen' : ''}`}>

      {/* ===== ROLEPLAY EFFECT 3: Mobile Biometric Scanner ===== */}
      {showBiometric && pendingSlug && (
        <MobileBiometricScanner
          scpTitle={`DOSSIER ${pendingSlug.toUpperCase()}`}
          onGranted={handleBiometricGranted}
        />
      )}

      {/* ===== ROLEPLAY EFFECT 5: Intercom PA Announcement ===== */}
      <IntercomAnnouncement trigger={intercomTrigger} />

      {/* ===== ROLEPLAY EFFECT 6: Containment Alert ===== */}
      {activeScpDetail && showAlert && (
        <ContainmentAlert
          objectClass={activeScpDetail.objectClass}
          scpNumber={activeScpDetail.scpNumber}
          show={showAlert}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      {/* ===== ROLEPLAY EFFECT 9: Glitch Overlay ===== */}
      <GlitchOverlay
        objectClass={activeScpDetail?.objectClass ?? null}
        isActive={!!activeSlug && !!activeScpDetail}
      />

      {/* Mobile Tactical Top Header */}
      <MobileHeader
        currentLanguage={currentLanguage}
        onLanguageChange={(newLang) => {
          sfx.playTerminalBeep();
          setCurrentLanguage(newLang);
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onRandomScp={handleRandomScp}
        sfxEnabled={sfxEnabled}
        onToggleSfx={toggleSfx}
      />

      {/* Main Viewport */}
      <main ref={refDefilement} className="flex-1 w-full px-3 py-3 overflow-y-auto">
        {/* Error notification */}
        {(searchError || detailError) && (
          <div className="mb-3 p-3 rounded-xl bg-surface-3/70 border border-accent-texte text-accent-texte text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-texte shrink-0" />
            <span>Erreur de communication SCiPNET.</span>
          </div>
        )}

        {/* TAB 1: ARCHIVE CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-3 pb-24">
            {/* Compact Mobile Briefing Banner */}
            <section className="rounded border border-bordure bg-surface-1 overflow-hidden">
              <div className="h-0.5 bg-accent" aria-hidden="true" />
              <div className="px-3.5 py-3">
                <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-technique text-texte-attenue mb-1.5">
                  <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                  Terminal Site-19 · lecture audio
                </p>
                <p className="font-serif text-sm text-texte-second leading-relaxed">
                  Accès direct aux transcriptions audio multi-voix : narrateur, chercheurs,
                  officiers FIM et sujets Classe-D.
                </p>
              </div>
            </section>

            {/* Mobile Search & Filters */}
            <MobileSearchFilters
              onFiltrerParEntite={filtrerParEntite}
              entiteFiltreNom={
                entiteFiltreObjet ? nomEntite(entiteFiltreObjet, currentLanguage.code) : null
              }
              onSearch={(q) => setSearchQuery(q)}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
              isLoading={isSearchLoading}
              activeQuery={searchQuery}
              availableSeries={availableSeries}
              selectedSeries={selectedSeries}
              onSelectSeries={setSelectedSeries}
              selectedSubRange={selectedSubRange}
              onSelectSubRange={setSelectedSubRange}
              languageCode={currentLanguage.code}
            />

            {/* Catalog List */}
            {isSearchLoading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-accent-texte" />
                <p className="text-xs font-mono text-texte-attenue">
                  Recherche SCiPNET {currentLanguage.name}...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-surface-1/60 border border-bordure rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-texte-attenue mx-auto mb-2" />
                <p className="text-xs font-mono text-texte-attenue">Aucun dossier trouvé.</p>
                <button
                  onClick={() => {
                    setSelectedClass('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-mono text-accent-texte underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-texte-attenue px-1 mb-2.5">
                  <span>{filteredItems.length} DOSSIERS</span>
                  <span className="text-texte-attenue">{currentLanguage.nativeName.toUpperCase()}</span>
                </div>

                {/* Fenêtre virtuelle : seules les cartes visibles existent dans le DOM. */}
                <div
                  ref={refListe}
                  className="relative w-full"
                  style={{ height: virtualiseur.getTotalSize() }}
                >
                  {virtualiseur.getVirtualItems().map((ligne) => {
                    const item = filteredItems[ligne.index];
                    if (!item) return null;
                    return (
                      <div
                        key={ligne.key}
                        data-index={ligne.index}
                        ref={virtualiseur.measureElement}
                        className="absolute left-0 top-0 w-full pb-2.5"
                        style={{
                          transform: `translateY(${ligne.start - virtualiseur.options.scrollMargin}px)`
                        }}
                      >
                        <MobileScpCard
                          item={item}
                          isFavorite={favorites.some(f => f.slug === item.slug)}
                          meta={metaDossier(item.slug, indexCorpus)}
                          onSelect={(selected) => handleSelectScp(selected.slug)}
                          onToggleFavorite={(selected) => handleToggleFavorite(selected)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE DOSSIER READER */}
        {activeTab === 'reader' && (
          <div>
            {isDetailLoading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent-texte" />
                <p className="text-xs font-mono text-texte-second">
                  Déclassification du dossier {activeSlug?.toUpperCase()}...
                </p>
              </div>
            ) : activeScpDetail ? (
              <MobileScpReader
                scp={activeScpDetail}
                languageCode={currentLanguage.code}
                onOuvrirEntite={async (id) => {
                  // Circulation dossier -> entité : on rouvre la même fiche que
                  // l'explorateur, avec la vraie liste de dossiers de l'index.
                  //
                  // L'adaptateur est chargé ici et non en tête de fichier : il
                  // entraîne avec lui le calque éditorial des départements, et
                  // celui-ci n'a aucune raison d'être téléchargé avant qu'on
                  // demande la fiche d'une entité.
                  const entite = entiteParId(id);
                  if (!entite) return;
                  const { versScpEntity } = await import('../data/entityPresentation');
                  setSelectedEntity(
                    versScpEntity(entite, currentLanguage.code, dossiersDeLEntite(id, currentLanguage.code))
                  );
                }}
                segments={activeSegments}
                currentSegmentIndex={playerStatus.currentSegmentIndex}
                isPlaying={playerStatus.isPlaying}
                activeWordIndex={
                  activeWord.segmentIndex === playerStatus.currentSegmentIndex
                    ? activeWord.wordIndex
                    : -1
                }
                onBack={() => {
                  handleBackToCatalog();
                  setActiveTab('catalog');
                }}
                isFavorite={favorites.some(f => f.slug === activeScpDetail.slug)}
                onToggleFavorite={() => handleToggleFavorite(activeScpDetail)}
                onPlaySegment={(idx) => {
                  speechEngine.jumpToSegment(idx);
                  if (!playerStatus.isPlaying) {
                    speechEngine.play();
                  }
                }}
                readingQueue={readingQueue}
                onEnqueueLink={enqueueLink}
                onOpenLink={openLink}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
              />
            ) : (
              <div className="text-center py-16 bg-surface-1/60 border border-bordure rounded-xl p-4">
                {englishFallback ? (
                  <>
                    <Languages className="w-8 h-8 text-classe-euclid mx-auto mb-2" />
                    <p className="text-sm font-mono text-classe-euclid font-bold tracking-wide">
                      PAGE PAS ENCORE TRADUITE
                    </p>
                    <p className="text-xs font-mono text-texte-attenue mt-2 leading-relaxed">
                      {activeSlug?.toUpperCase()} existe dans les archives anglophones mais n'a pas
                      encore de traduction française.
                    </p>
                    <p className="text-xs font-mono text-texte-attenue mt-1">
                      « {englishFallback.title} »
                    </p>
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={readInEnglish}
                        className="px-4 py-2.5 rounded-xl bg-surface-3/80 border border-classe-euclid/70 text-xs font-mono text-classe-euclid"
                      >
                        Lire la version anglaise
                      </button>
                      <button
                        onClick={() => setActiveTab('catalog')}
                        className="px-4 py-2.5 rounded-xl bg-surface-1 border border-bordure text-xs font-mono text-texte-second"
                      >
                        Retourner aux archives
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-8 h-8 text-texte-attenue mx-auto mb-2" />
                    <p className="text-xs font-mono text-texte-second mb-3">
                      {activeSlug
                        ? 'Dossier introuvable dans les archives.'
                        : "Aucun dossier SCP n'est actuellement ouvert."}
                    </p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 rounded-xl bg-surface-3 border border-accent-texte text-xs font-mono text-accent-texte"
                    >
                      Ouvrir les archives
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FULL SCREEN AUDIO SHEET */}
        {activeTab === 'scipnet' && (
          <Suspense fallback={<ChargementEcran />}>
            <MobileEntitesScreen
              languageCode={currentLanguage.code}
              onSelectScpSlug={(slug) => {
                handleSelectScp(slug);
                setActiveTab('reader');
              }}
            />
          </Suspense>
        )}

        {activeTab === 'audio' && (
          <MobileAudioSheet
            status={playerStatus}
            segments={activeSegments}
            currentTextPreview={activeSegments[playerStatus.currentSegmentIndex]?.text}
            ambienceActive={ambienceActive}
            onToggleAmbience={toggleAmbience}
            onPlay={() => speechEngine.play()}
            onPause={() => speechEngine.pause()}
            onStop={() => speechEngine.stop()}
            onNext={() => speechEngine.next()}
            onPrevious={() => speechEngine.previous()}
            onSeek={(idx) => speechEngine.jumpToSegment(idx)}
            onSeekTime={(sec) => speechEngine.seekTime(sec)}
            onSpeedChange={(sp) => speechEngine.setGlobalSpeed(sp)}
            onToggleMute={() => speechEngine.toggleMute()}
            onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
            onClose={() => setActiveTab(activeScpDetail ? 'reader' : 'catalog')}
          />
        )}
      </main>

      {/* Floating Mini Player (only when not in audio tab and player has audio loaded) */}
      {activeTab !== 'audio' && (
        <MobileMiniPlayer
          status={playerStatus}
          currentTextPreview={activeSegments[playerStatus.currentSegmentIndex]?.text}
          onPlay={() => speechEngine.play()}
          onPause={() => speechEngine.pause()}
          onNext={() => speechEngine.next()}
          onExpand={() => setActiveTab('audio')}
        />
      )}

      {/* Thumb-friendly Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsDrawerOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        hasActiveDossier={!!activeScpDetail}
        isPlaying={playerStatus.isPlaying}
        hasAudioLoaded={playerStatus.totalSegments > 0}
      />

      {/* Mobile Tactical Slide-over Drawer */}
      <MobileTacticalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        favoritesCount={favorites.length}
        sfxEnabled={sfxEnabled}
        onToggleSfx={toggleSfx}
        crtEnabled={crtEnabled}
        onToggleCrt={toggleCrt}
        ambienceActive={ambienceActive}
        onToggleAmbience={toggleAmbience}
        onOpenRaisa={() => setShowRaisaModal(true)}
        currentLanguage={currentLanguage}
        onLanguageChange={(lang) => {
          setCurrentLanguage(lang);
        }}
        onSwitchToDesktop={() => {
          setDeviceMode('desktop');
        }}
      />

      {/* Fenêtres partagées — montées seulement à l'ouverture, cf. les `lazy` en tête. */}
      {isVoiceStudioOpen && (
        <Suspense fallback={null}>
          <VoiceStudioModal
            isOpen={isVoiceStudioOpen}
            onClose={() => setIsVoiceStudioOpen(false)}
            languageCode={currentLanguage.code}
          />
        </Suspense>
      )}

      {isFavoritesOpen && (
        <Suspense fallback={null}>
          <FavoritesModal
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            favorites={favorites}
            onSelectScp={(item) => {
              handleSelectScp(item.slug);
              setIsFavoritesOpen(false);
              setActiveTab('reader');
            }}
            onRemoveFavorite={(item) => handleToggleFavorite(item)}
          />
        </Suspense>
      )}

      {isExplorerOpen && (
      <Suspense fallback={null}>
      <ScipnetExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        languageCode={currentLanguage.code}
        onSelectEntity={(entity) => setSelectedEntity(entity)}
        onSelectSeries={(seriesId) => {
          setSelectedSeries(seriesId);
          setSearchQuery('');
          setActiveSlug(null);
          setIsExplorerOpen(false);
          setActiveTab('catalog');
        }}
        onSelectSeriesFilter={(prefix) => {
          setSearchQuery(prefix);
          setActiveSlug(null);
          setIsExplorerOpen(false);
          setActiveTab('catalog');
        }}
        onSelectScpSlug={(slug) => {
          handleSelectScp(slug);
          setIsExplorerOpen(false);
          setActiveTab('reader');
        }}
      />
      </Suspense>
      )}

      {selectedEntity && (
        <Suspense fallback={null}>
        <EntityDetailModal
          entity={selectedEntity}
          isOpen={!!selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onFiltrerParEntite={(id) => {
            filtrerParEntite(id);
            setSelectedEntity(null);
          }}
          onFilterScps={(query) => {
            setSearchQuery(query);
            setActiveSlug(null);
            setSelectedEntity(null);
            setIsExplorerOpen(false);
            setActiveTab('catalog');
          }}
          onSelectScpSlug={(slug) => {
            handleSelectScp(slug);
            setSelectedEntity(null);
            setIsExplorerOpen(false);
            setActiveTab('reader');
          }}
        />
        </Suspense>
      )}

      {/* Mobile Raisa Terminal */}
      {showRaisaModal && (
        <div className="fixed inset-0 z-50 bg-black/90 p-2 flex flex-col justify-end">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setShowRaisaModal(false)}
              className="text-xs font-mono px-3 py-1 bg-surface-3 border border-accent-texte text-accent-texte rounded"
            >
              FERMER CONSOLE [X]
            </button>
          </div>
          <div className="h-[75vh]">
            <Suspense fallback={<ChargementEcran />}>
              <RaisaTerminal
                playerStatus={playerStatus}
                activeScpNumber={activeScpDetail?.scpNumber ?? null}
                activeObjectClass={activeScpDetail?.objectClass ?? null}
                hasActivePlayer={playerStatus.totalSegments > 0}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};
