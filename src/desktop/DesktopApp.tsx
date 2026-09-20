import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { ScpCard } from '../components/ScpCard';
import { metaDossier } from '../services/corpusFilters';
import { ScpReader } from '../components/ScpReader';
import { AudioPlayer } from '../components/AudioPlayer';
import { useT } from '../i18n';
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
  const t = useT();
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
    <div className={`min-h-screen bg-fond text-texte flex flex-col antialiased ${crtEnabled ? 'crt-screen' : ''}`}>

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
          <div className="mb-6 p-4 rounded bg-surface-2 border border-bordure border-l-[3px] border-l-accent-texte text-texte-second text-sm font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-texte shrink-0" />
            <div>{t('general.erreurArchive')}</div>
          </div>
        )}

        {/* View 1: Active Dossier Reader */}
        {activeSlug ? (
          isDetailLoading ? (
            <div className="text-center py-28 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent-texte" />
              <p className="text-sm font-mono text-texte-second">
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
            <div className="text-center py-20 bg-surface-1 border border-bordure rounded px-6">
              {englishFallback ? (
                <>
                  <Languages className="w-9 h-9 text-classe-euclid mx-auto mb-3" />
                  <p className="font-mono text-base text-texte font-semibold tracking-technique uppercase">
                    {t('accueil.pasTraduite')}
                  </p>
                  <p className="font-serif text-md text-texte-second mt-2 max-w-lecture mx-auto">
                    {activeSlug?.toUpperCase()} existe dans les archives anglophones mais n'a pas
                    encore de traduction française.
                  </p>
                  <p className="font-mono text-xs text-texte-attenue mt-2">
                    Titre original : « {englishFallback.title} »
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                    <button
                      onClick={readInEnglish}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded font-mono text-xs bg-accent hover:bg-accent-texte text-texte transition-colors"
                    >
                      {t('accueil.lireAnglais')}
                    </button>
                    <button
                      onClick={handleBackToCatalog}
                      className="font-mono text-xs text-texte-attenue hover:text-texte underline underline-offset-4"
                    >
                      {t('accueil.retourCatalogue')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-9 h-9 text-accent-texte mx-auto mb-3" />
                  <p className="font-mono text-sm text-texte-second">
                    {t('general.dossierIntrouvable')}
                  </p>
                  <button
                    onClick={handleBackToCatalog}
                    className="mt-4 font-mono text-xs text-texte-attenue hover:text-texte underline underline-offset-4"
                  >
                    {t('accueil.retourCatalogue')}
                  </button>
                </>
              )}
            </div>
          )
        ) : (
          /* View 2: Archive Catalog & Search */
          <div>
            {/* Note de service d'ouverture.
                L'ancienne version empilait un dégradé trois-tons, un tampon, des
                rayures de danger et trois puces clignotantes de trois couleurs :
                le bloc le plus chargé de l'application, juste au-dessus du
                catalogue qu'il était censé introduire. Ici, un filet d'accent, un
                titre, un paragraphe, et l'état du système en une ligne. */}
            <section className="bg-surface-1 border border-bordure rounded mb-6 overflow-hidden">
              <div className="h-0.5 bg-accent" aria-hidden="true" />

              <div className="px-4 sm:px-6 py-2 border-b border-bordure-faible flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-technique text-texte-attenue">
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('accueil.noeud')}
                </span>
                <span>{t('etat.diffusion')}</span>
              </div>

              <div className="px-4 sm:px-6 py-5">
                <h2 className="font-mono text-xl font-bold text-texte tracking-tight mb-2">
                  {t('accueil.centre')}
                </h2>

                <p className="font-serif text-md text-texte-second max-w-lecture">
                  {t('accueil.presentation')}
                </p>

                <dl className="mt-5 pt-4 border-t border-bordure-faible flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                    <dt className="text-texte-attenue uppercase tracking-technique">{t('etat.protocole')}</dt>
                    <dd className="text-systeme">{t('etat.connecte')}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-texte-attenue uppercase tracking-technique">{t('etat.synthese')}</dt>
                    <dd className="text-systeme">Edge Neural TTS</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-texte-attenue uppercase tracking-technique">{t('etat.isolation')}</dt>
                    <dd className="text-systeme">{t('etat.niveau4')}</dd>
                  </div>
                </dl>
              </div>
            </section>

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
                <Loader2 className="w-7 h-7 animate-spin text-accent-texte" />
                <p className="font-mono text-xs text-texte-attenue">
                  Recherche dans la branche {currentLanguage.name}...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-surface-1 border border-bordure rounded">
                <BookOpen className="w-9 h-9 text-texte-attenue mx-auto mb-3" />
                <p className="font-mono text-sm text-texte-second">{t('general.aucunResultat')}</p>
                <button
                  onClick={() => {
                    setSelectedClass('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 font-mono text-xs text-texte-attenue hover:text-texte underline underline-offset-4"
                >
                  {t('accueil.reinitialiser')}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3 font-mono text-xs uppercase tracking-technique text-texte-attenue">
                  <span className="tabular-nums">
                    {Math.min(displayLimit, filteredItems.length)} / {filteredItems.length} dossiers
                  </span>
                  <span>Branche · {currentLanguage.nativeName}</span>
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
                      className="inline-flex items-center gap-2 h-10 px-5 rounded bg-accent hover:bg-accent-texte text-texte font-mono text-xs font-semibold transition-colors"
                    >
                      <span className="tabular-nums">Charger 60 dossiers de plus ({Math.min(displayLimit, filteredItems.length)} / {filteredItems.length})</span>
                    </button>
                    <button
                      onClick={() => setDisplayLimit(filteredItems.length)}
                      className="inline-flex items-center h-10 px-4 rounded font-mono text-xs bg-surface-2 border border-bordure text-texte-second hover:bg-surface-3 hover:text-texte hover:border-bordure-forte transition-colors"
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
