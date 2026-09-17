import React, { useState, useEffect } from 'react';
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
import { VoiceStudioModal } from '../components/VoiceStudioModal';
import { FavoritesModal } from '../components/FavoritesModal';
import { ScipnetExplorerModal } from '../components/ScipnetExplorerModal';
import { dossiersDeLEntite, entiteParId, nomEntite } from '../services/entityService';
import { versScpEntity } from '../data/entityPresentation';
import { MobileEntitesScreen } from './components/MobileEntitesScreen';
import { EntityDetailModal } from '../components/EntityDetailModal';
import { RaisaTerminal } from '../components/RaisaTerminal';
import { useScpApp } from '../shared/hooks/useScpApp';
import { DeviceMode } from '../shared/hooks/useDeviceMode';
import { sfx } from '../services/sfxService';
import { Loader2, Radio, BookOpen, AlertTriangle, Languages } from 'lucide-react';

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
  const [displayLimit, setDisplayLimit] = useState(40);

  useEffect(() => {
    setDisplayLimit(40);
  }, [selectedSeries, selectedSubRange, selectedClass, searchQuery]);

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
    <div className={`min-h-screen bg-scp-bg text-scp-text flex flex-col antialiased selection:bg-red-900 selection:text-white ${crtEnabled ? 'crt-screen' : ''}`}>

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
      <main className="flex-1 w-full px-3 py-3 overflow-y-auto">
        {/* Error notification */}
        {(searchError || detailError) && (
          <div className="mb-3 p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Erreur de communication SCiPNET.</span>
          </div>
        )}

        {/* TAB 1: ARCHIVE CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-3 pb-24">
            {/* Compact Mobile Briefing Banner */}
            <div className="rounded-xl p-3.5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-red-950/40 border border-red-900/50 shadow-lg relative overflow-hidden">
              <div className="hazard-stripes h-1 -mx-3.5 -mt-3.5 mb-2.5 opacity-70"></div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 font-bold mb-1">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                <span>TERMINAL TACTIQUE SITE-19 // AUDIO AI</span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-snug">
                Accès direct aux transcriptions audio multi-voix (chercheurs ♂/♀, narrateurs, Classe-D).
              </p>
            </div>

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
                <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                <p className="text-xs font-mono text-slate-400">
                  Recherche SCiPNET {currentLanguage.name}...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">Aucun dossier trouvé.</p>
                <button
                  onClick={() => {
                    setSelectedClass('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-mono text-red-400 underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span>
                    AFFICHAGE : {Math.min(displayLimit, filteredItems.length)} / {filteredItems.length} DOSSIERS
                  </span>
                  <span className="text-slate-500">{currentLanguage.nativeName.toUpperCase()}</span>
                </div>

                {filteredItems.slice(0, displayLimit).map((item) => (
                  <MobileScpCard
                    key={item.slug}
                    item={item}
                    isFavorite={favorites.some(f => f.slug === item.slug)}
                    meta={metaDossier(item.slug, indexCorpus)}
                    onSelect={(selected) => handleSelectScp(selected.slug)}
                    onToggleFavorite={(selected) => handleToggleFavorite(selected)}
                  />
                ))}

                {filteredItems.length > displayLimit && (
                  <div className="pt-2 pb-4 text-center">
                    <button
                      onClick={() => setDisplayLimit((prev: number) => prev + 40)}
                      className="w-full py-2.5 bg-cyan-950/80 border border-cyan-700/60 rounded-xl text-xs font-mono font-bold text-cyan-200 active:scale-95 transition-transform shadow"
                    >
                      ⚡ AFFICHER LES 40 SUIVANTS ({Math.min(displayLimit, filteredItems.length)} / {filteredItems.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE DOSSIER READER */}
        {activeTab === 'reader' && (
          <div>
            {isDetailLoading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs font-mono text-slate-300">
                  Déclassification du dossier {activeSlug?.toUpperCase()}...
                </p>
              </div>
            ) : activeScpDetail ? (
              <MobileScpReader
                scp={activeScpDetail}
                languageCode={currentLanguage.code}
                onOuvrirEntite={(id) => {
                  // Circulation dossier -> entité : on rouvre la même fiche que
                  // l'explorateur, avec la vraie liste de dossiers de l'index.
                  const entite = entiteParId(id);
                  if (!entite) return;
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
              <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                {englishFallback ? (
                  <>
                    <Languages className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-mono text-amber-300 font-bold tracking-wide">
                      PAGE PAS ENCORE TRADUITE
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-2 leading-relaxed">
                      {activeSlug?.toUpperCase()} existe dans les archives anglophones mais n'a pas
                      encore de traduction française.
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      « {englishFallback.title} »
                    </p>
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={readInEnglish}
                        className="px-4 py-2.5 rounded-xl bg-amber-950/80 border border-amber-600/70 text-xs font-mono text-amber-200"
                      >
                        Lire la version anglaise →
                      </button>
                      <button
                        onClick={() => setActiveTab('catalog')}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
                      >
                        Retourner aux archives
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-mono text-slate-300 mb-3">
                      {activeSlug
                        ? 'Dossier introuvable dans les archives.'
                        : "Aucun dossier SCP n'est actuellement ouvert."}
                    </p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 rounded-xl bg-red-950 border border-red-800 text-xs font-mono text-red-300"
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
          <MobileEntitesScreen
            languageCode={currentLanguage.code}
            onSelectScpSlug={(slug) => {
              handleSelectScp(slug);
              setActiveTab('reader');
            }}
          />
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

      {/* Shared Modals */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        languageCode={currentLanguage.code}
      />

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

      {selectedEntity && (
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
      )}

      {/* Mobile Raisa Terminal */}
      {showRaisaModal && (
        <div className="fixed inset-0 z-50 bg-black/90 p-2 flex flex-col justify-end">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setShowRaisaModal(false)}
              className="text-xs font-mono px-3 py-1 bg-red-950 border border-red-700 text-red-300 rounded"
            >
              FERMER CONSOLE [X]
            </button>
          </div>
          <div className="h-[75vh]">
            <RaisaTerminal
              playerStatus={playerStatus}
              activeScpNumber={activeScpDetail?.scpNumber ?? null}
              activeObjectClass={activeScpDetail?.objectClass ?? null}
              hasActivePlayer={playerStatus.totalSegments > 0}
            />
          </div>
        </div>
      )}
    </div>
  );
};
