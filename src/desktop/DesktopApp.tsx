import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { ScpCard } from '../components/ScpCard';
import { metaDossier } from '../services/corpusFilters';
import { ScpReader } from '../components/ScpReader';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceStudioModal } from '../components/VoiceStudioModal';
import { FavoritesModal } from '../components/FavoritesModal';
import { BootSequence } from '../components/BootSequence';
import { MemeticWarning } from '../components/MemeticWarning';
import { BiometricScanner } from '../components/BiometricScanner';
import { DeclassifiedStamp } from '../components/DecryptStamp';
import { IntercomAnnouncement } from '../components/IntercomAnnouncement';
import { ContainmentAlert } from '../components/ContainmentAlert';
import { AgentBadge } from '../components/AgentBadge';
import { GlitchOverlay } from '../components/GlitchOverlay';
import { RaisaTerminal } from '../components/RaisaTerminal';
import { ScipnetExplorerModal } from '../components/ScipnetExplorerModal';
import { dossiersDeLEntite, entiteParId, nomEntite } from '../services/entityService';
import { versScpEntity } from '../data/entityPresentation';
import { EntityDetailModal } from '../components/EntityDetailModal';
import { useScpApp } from '../shared/hooks/useScpApp';
import { sfx } from '../services/sfxService';
import { Loader2, Radio, BookOpen, AlertTriangle, Languages } from 'lucide-react';

interface DesktopAppProps {
  /**
   * REQUIRED. App owns the single useScpApp() instance and passes it down.
   *
   * This must never fall back to a locally-created instance: hooks cannot be called
   * conditionally, so a `propApp || useScpApp()` pattern builds a SECOND full copy of the
   * app state on every render. Both copies subscribe to the `speechEngine` singleton,
   * which holds exactly one status callback — the last subscriber wins while the UI keeps
   * rendering the other one's state. The result is a frozen playerStatus: the audio player
   * never appears (it hides itself at totalSegments === 0) and segment tracking never moves.
   */
  app: ReturnType<typeof useScpApp>;
}

export const DesktopApp: React.FC<DesktopAppProps> = ({ app }) => {
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
    searchError,
    availableSeries,
    selectedSeries,
    setSelectedSeries,
    selectedSubRange,
    setSelectedSubRange,
    activeSlug,
    setActiveSlug,
    activeScpDetail,
    isDetailLoading,
    detailError,
    englishFallback,
    readInEnglish,
    readingQueue,
    enqueueLink,
    removeFromQueue,
    clearQueue,
    openLink,
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
    showStamp,
    setShowStamp,
    showAlert,
    setShowAlert,
    intercomTrigger,
    handleSelectScp,
    handleBiometricGranted,
    handleRandomScp,
    handleToggleFavorite,
    handleBackToCatalog
  } = app;

  const [displayLimit, setDisplayLimit] = useState(60);

  useEffect(() => {
    setDisplayLimit(60);
  }, [selectedSeries, selectedSubRange, selectedClass, searchQuery]);

  // Global Keyboard Shortcuts for Desktop Playback (Space, ArrowLeft, ArrowRight, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space') {
        if (playerStatus.totalSegments > 0) {
          e.preventDefault();
          if (playerStatus.isPlaying) {
            speechEngine.pause();
          } else {
            speechEngine.play();
          }
        }
      } else if (e.code === 'ArrowLeft') {
        if (playerStatus.totalSegments > 0 && playerStatus.currentSegmentIndex > 0) {
          e.preventDefault();
          sfx.playTerminalBeep();
          speechEngine.previous();
        }
      } else if (e.code === 'ArrowRight') {
        if (playerStatus.totalSegments > 0 && playerStatus.currentSegmentIndex < playerStatus.totalSegments - 1) {
          e.preventDefault();
          sfx.playTerminalBeep();
          speechEngine.next();
        }
      } else if (e.code === 'KeyM') {
        if (playerStatus.totalSegments > 0) {
          e.preventDefault();
          sfx.playTerminalBeep();
          speechEngine.toggleMute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerStatus.totalSegments, playerStatus.isPlaying, playerStatus.currentSegmentIndex, speechEngine]);

  // ===== ROLEPLAY EFFECT 1: Boot Sequence (Full-screen retro terminal) =====
  if (!bootDone) {
    return <BootSequence onComplete={() => setBootDone(true)} />;
  }

  // ===== ROLEPLAY EFFECT 2: Memetic Inoculation (100% Pure Black Screen) =====
  if (!memeticDone) {
    return <MemeticWarning onComplete={() => setMemeticDone(true)} />;
  }

  return (
    <div className={`min-h-screen bg-scp-bg text-scp-text flex flex-col antialiased selection:bg-red-900 selection:text-white ${crtEnabled ? 'crt-screen' : ''}`}>

      {/* ===== ROLEPLAY EFFECT 3: Biometric Scanner ===== */}
      {showBiometric && pendingSlug && (
        <BiometricScanner
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

      {/* ===== ROLEPLAY EFFECT 7: Agent Badge (persistent, bottom-right) ===== */}
      {memeticDone && <AgentBadge hasActivePlayer={playerStatus.totalSegments > 0} />}

      {/* ===== ROLEPLAY EFFECT 9: Glitch Overlay (class-based intensity) ===== */}
      <GlitchOverlay
        objectClass={activeScpDetail?.objectClass ?? null}
        isActive={!!activeSlug && !!activeScpDetail}
      />

      {/* Classified Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={(newLang) => {
          sfx.playTerminalBeep();
          setCurrentLanguage(newLang);
        }}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onRandomScp={handleRandomScp}
        favoritesCount={favorites.length}
        sfxEnabled={sfxEnabled}
        onToggleSfx={toggleSfx}
        crtEnabled={crtEnabled}
        onToggleCrt={toggleCrt}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 pb-28">
        {/* Error notification */}
        {(searchError || detailError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-700/60 text-red-200 text-xs sm:text-sm font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>Une erreur est survenue lors de la communication avec l'archive SCP.</div>
          </div>
        )}

        {/* View 1: Active Dossier Reader */}
        {activeSlug ? (
          isDetailLoading ? (
            <div className="text-center py-28 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 animate-spin text-red-500" />
              <p className="text-sm font-mono text-slate-300">
                Déclassification et analyse roleplay de {activeSlug.toUpperCase()}...
              </p>
            </div>
          ) : activeScpDetail ? (
            <div className="relative">
              {/* ===== ROLEPLAY EFFECT 4: Declassified Stamp ===== */}
              <DeclassifiedStamp show={showStamp} objectClass={activeScpDetail.objectClass} />
              <ScpReader
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
                onBack={handleBackToCatalog}
                isFavorite={storageServiceIsFav(activeScpDetail.slug, favorites)}
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
            </div>
          ) : (
            <div className="text-center py-20 bg-scp-surface border border-scp-border rounded-2xl px-6">
              {englishFallback ? (
                <>
                  <Languages className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-base font-mono text-amber-300 font-bold tracking-wide">
                    PAGE PAS ENCORE TRADUITE
                  </p>
                  <p className="text-sm font-mono text-slate-400 mt-2">
                    {activeSlug?.toUpperCase()} existe dans les archives anglophones mais n'a pas
                    encore de traduction française.
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Titre original : « {englishFallback.title} »
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                    <button
                      onClick={readInEnglish}
                      className="text-xs font-mono px-4 py-2 rounded-lg bg-amber-950/80 text-amber-200 border border-amber-600/70 hover:border-amber-400 transition-colors"
                    >
                      Lire la version anglaise →
                    </button>
                    <button
                      onClick={handleBackToCatalog}
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 hover:underline"
                    >
                      Retourner au catalogue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-sm font-mono text-slate-300">
                    Dossier introuvable dans les archives.
                  </p>
                  <button
                    onClick={handleBackToCatalog}
                    className="mt-4 text-xs font-mono text-red-400 hover:underline"
                  >
                    Retourner au catalogue
                  </button>
                </>
              )}
            </div>
          )
        ) : (
          /* View 2: Archive Catalog & Search */
          <div>
            {/* SCiPNET Classified Terminal Briefing Banner */}
            <div className="scipnet-box p-5 sm:p-7 mb-6 shadow-2xl relative overflow-hidden bg-gradient-to-r from-scp-surface via-slate-900/90 to-red-950/40 border border-red-900/40">
              {/* Rubber Stamp */}
              <div className="absolute top-4 right-4 hidden md:block">
                <span className="classified-stamp stamp-restricted">RESTREINT CL-4</span>
              </div>

              {/* Hazard Stripes mini bar at the top */}
              <div className="hazard-stripes h-1 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 mb-4 opacity-75"></div>

              <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-red-400 font-semibold mb-2.5">
                  <div className="flex items-center gap-1.5 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>SCiPNET DIRECT AUDIO NODE // SITE-19</span>
                  </div>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">DIFFUSION TACTIQUE MULTI-VOIX AI</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mb-2 tracking-tight flex items-center gap-2">
                  <span>CENTRE D'ÉCOUTE ET D'ARCHIVES CLASSIFIÉES</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
                  Accès direct aux transcriptions audio et interrogatoires d'anomalies. Le système SCiPNET Neural
                  analyse dynamiquement la composition des dialogues et assigne des fréquences vocales uniques aux
                  chercheurs (détection de genre ♂/♀), narrateurs, officiers FIM et sujets Classe-D.
                </p>

                {/* Telemetry Chips */}
                <div className="mt-4 pt-3 border-t border-scp-border/80 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 bg-scp-card px-2 py-1 rounded border border-scp-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-300">PROTOCOLE CROM V1.2 : CONNECTÉ</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-scp-card px-2 py-1 rounded border border-scp-border">
                    <span className="text-amber-400">⚡</span>
                    <span className="text-slate-300">EDGE NEURAL TTS + PROFILAGE SCIENTIFIQUE</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-scp-card px-2 py-1 rounded border border-scp-border">
                    <span className="text-red-400">☣</span>
                    <span className="text-slate-300">ISOLATION MÉMÉTIQUE NIVEAU 4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <SearchAndFilters
              onFiltrerParEntite={filtrerParEntite}
              entiteFiltreNom={
                entiteFiltreObjet ? nomEntite(entiteFiltreObjet, currentLanguage.code) : null
              }
              onSearch={(q) => setSearchQuery(q)}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
              isLoading={isSearchLoading}
              activeQuery={searchQuery}
              onOpenExplorer={() => setIsExplorerOpen(true)}
              onSelectEntity={(entity) => setSelectedEntity(entity)}
              availableSeries={availableSeries}
              selectedSeries={selectedSeries}
              onSelectSeries={setSelectedSeries}
              selectedSubRange={selectedSubRange}
              onSelectSubRange={setSelectedSubRange}
              languageCode={currentLanguage.code}
            />

            {/* Catalog Grid */}
            {isSearchLoading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs font-mono text-slate-400">
                  Recherche dans la branche {currentLanguage.name}...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-scp-surface border border-scp-border rounded-2xl">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-mono text-slate-400">Aucun dossier ne correspond à vos filtres.</p>
                <button
                  onClick={() => {
                    setSelectedClass('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs font-mono text-red-400 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                  <span>
                    AFFICHAGE : {Math.min(displayLimit, filteredItems.length)} / {filteredItems.length} DOSSIERS DISPONIBLES
                  </span>
                  <span className="text-slate-500">BRANCHE : {currentLanguage.nativeName.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.slice(0, displayLimit).map((item) => (
                    <ScpCard
                      key={item.slug}
                      item={item}
                      isFavorite={storageServiceIsFav(item.slug, favorites)}
                      languageCode={currentLanguage.code}
                      meta={metaDossier(item.slug, indexCorpus)}
                      onSelect={(selected) => handleSelectScp(selected.slug)}
                      onToggleFavorite={(selected) => handleToggleFavorite(selected)}
                    />
                  ))}
                </div>

                {filteredItems.length > displayLimit && (
                  <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setDisplayLimit((prev: number) => prev + 60)}
                      className="win2k-btn px-5 py-2 font-mono text-xs font-bold text-amber-300 hover:text-white flex items-center gap-2 shadow-lg"
                    >
                      <span>⚡ CHARGER LES 60 SUIVANTS ({Math.min(displayLimit, filteredItems.length)} / {filteredItems.length})</span>
                    </button>
                    <button
                      onClick={() => setDisplayLimit(filteredItems.length)}
                      className="px-4 py-2 font-mono text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:border-slate-500 transition-all"
                    >
                      Tout afficher ({filteredItems.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Audio Player */}
      <AudioPlayer
        status={playerStatus}
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
        onSeekPercent={(pct) => speechEngine.seekPercent(pct)}
        onVolumeChange={(vol) => speechEngine.setVolume(vol)}
        onToggleMute={() => speechEngine.toggleMute()}
        onSpeedChange={(sp) => speechEngine.setGlobalSpeed(sp)}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
      />

      {/* Voice Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        languageCode={currentLanguage.code}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onSelectScp={(item) => handleSelectScp(item.slug)}
        onRemoveFavorite={(item) => handleToggleFavorite(item)}
      />

      {/* SCiPNET Explorer */}
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
        }}
        onSelectSeriesFilter={(prefix) => {
          setSearchQuery(prefix);
          setActiveSlug(null);
          setIsExplorerOpen(false);
        }}
        onSelectScpSlug={(slug) => {
          handleSelectScp(slug);
          setIsExplorerOpen(false);
        }}
      />

      {/* Entity Detail Dossier Modal */}
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
          }}
          onSelectScpSlug={(slug) => {
            handleSelectScp(slug);
            setSelectedEntity(null);
            setIsExplorerOpen(false);
          }}
        />
      )}

      {/* ===== ROLEPLAY EFFECT 10: RAISA Terminal (dockable console) ===== */}
      {memeticDone && (
        <RaisaTerminal
          playerStatus={playerStatus}
          activeScpNumber={activeScpDetail?.scpNumber ?? null}
          activeObjectClass={activeScpDetail?.objectClass ?? null}
          hasActivePlayer={playerStatus.totalSegments > 0}
        />
      )}
    </div>
  );
};

function storageServiceIsFav(slug: string, favorites: Array<{ slug: string }>): boolean {
  return favorites.some(f => f.slug === slug);
}
