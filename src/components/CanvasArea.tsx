import { useRef, useState, type DragEvent } from 'react'
import useElementSize from '../hooks/useElementSize'
import useGpxImport from '../hooks/useGpxImport'
import { useActiveSlide, useHasPhotos, useHasRoute, useManualFlags, usePanorama, usePhotoBackground } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { FORMATS, FORMAT_ORDER } from '../core/formats/registry'
import { gradientPresetName } from '../utils/gradients'
import { layoutDef } from '../utils/layouts'
import { hasManualLayout } from '../utils/reflow'
import type { AspectKey, SelectOption } from '../types'
import { canvasControls, workspaceFor } from '../core/canvas/chrome'
import CanvasStage from './CanvasStage'
import CenterViewSwitch from './CenterViewSwitch'
import GpxErrorCard from './GpxErrorCard'
import PhotoPicker from './PhotoPicker'
import SlideStrip from './SlideStrip'
import PhotoSlidesDialog from './PhotoSlidesDialog'
import Segmented from './ui/Segmented'
import { IconImage, IconMove, IconReset, IconRoute, IconSafeZone, IconUpload } from './icons'
import Button from './ui/Button'
import FileButton from './ui/FileButton'
import StatusCard from './ui/StatusCard'
import Toast from './ui/Toast'

const VIEWPORT_PADDING = 24

type FrameMode = 'single' | 'carousel'
const FORMAT_OPTIONS: SelectOption<AspectKey>[] = FORMAT_ORDER.map((value) => ({ value, label: FORMATS[value].label }))

const MODE_OPTIONS: SelectOption<FrameMode>[] = [
  { value: 'single', label: 'Kadr' },
  { value: 'carousel', label: 'Karuzela' },
]

function CanvasToolbar() {
  const hasWorkspace = useAppStore((s) => workspaceFor(s) != null)
  const hasRoute = useHasRoute()
  const collage = useAppStore((s) => s.mode === 'collage')
  const aspectKey = useAppStore((s) => s.aspectKey)
  const routeEditable = useAppStore((s) => s.routeEditable)
  const setRouteEditable = useAppStore((s) => s.setRouteEditable)
  const transform = useAppStore((s) => s.routeTransform)
  const resetRouteTransform = useAppStore((s) => s.resetRouteTransform)
  const adding = useAppStore((s) => s.addingWaypoint)
  const slideCount = useAppStore((s) => s.slides.length)
  const parkedSlides = useAppStore((s) => s.parkedSlides.length)
  const setCarousel = useAppStore((s) => s.setCarousel)
  const setAspectKey = useAppStore((s) => s.setAspectKey)
  const customLayout = hasManualLayout(useManualFlags())
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isTransformed =
    transform.x !== 0 || transform.y !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || transform.rotation !== 0

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Narzędzia podglądu">
      {hasWorkspace && <CenterViewSwitch />}
      {FORMATS[aspectKey].carousel && (
        <Segmented
          label="Tryb kadru"
          value={slideCount > 1 ? 'carousel' : 'single'}
          options={MODE_OPTIONS}
          onChange={(mode) => setCarousel(mode === 'carousel')}
        />
      )}
      {!collage && (
        <Button
          size="sm"
          variant="ghost"
          icon={<IconMove />}
          pressed={routeEditable}
          disabled={!hasRoute}
          onClick={() => setRouteEditable(!routeEditable)}
          title="Przesuwaj, skaluj i obracaj trasę (Esc kończy)"
        >
          Edytuj trasę
        </Button>
      )}
      {isTransformed && (
        <Button size="sm" variant="ghost" icon={<IconReset />} onClick={resetRouteTransform}>
          Resetuj położenie
        </Button>
      )}
      <select className="toolbar-select" aria-label="Format kadru" title={useFrameSummary()} value={aspectKey} onChange={(e) => setAspectKey(e.target.value as AspectKey)}>
        {FORMAT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {customLayout && <span className="tag-custom">własny układ</span>}
      {parkedSlides > 0 && (
        <span className="toolbar-hint" role="status">
          Ten format ma jeden kadr. Pozostałe slajdy ({parkedSlides}) wrócą po przejściu na format Instagrama.
        </span>
      )}
      {adding && (
        <span className="toolbar-hint" role="status">
          Kliknij na trasie, aby dodać miejscowość ·{' '}
          <button type="button" className="link-btn" onClick={() => setAddingWaypoint(false)}>
            Anuluj (Esc)
          </button>
        </span>
      )}
    </div>
  )
}


// What gets exported, for the format picker's tooltip: mode, format, background and pixel size.
function useFrameSummary() {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const collage = useAppStore((s) => s.collage)
  const { w, h } = FORMATS[aspectKey]

  const photoBackground = usePhotoBackground()
  const mode = slideCount > 1 ? `Karuzela ${slideCount} × ${aspectKey}` : `Kadr ${aspectKey}`
  const preset = gradientPresetName(collage.gradient)
  const background = photoBackground
    ? 'zdjęcie'
    : collage.bgKind === 'gradient'
      ? preset
        ? `gradient „${preset}”`
        : 'gradient własny'
      : collage.bgKind === 'color'
        ? `kolor ${collage.bgColor.toUpperCase()}`
        : 'przezroczyste'

  return `${mode} · tło: ${background} · ${w}×${h} px`
}

// Platform UI overlays, toggled from a corner of the preview; they never reach the export.
function SafeZoneToggle() {
  const shown = useAppStore((s) => s.showSafeZones)
  const setShown = useAppStore((s) => s.setShowSafeZones)
  return (
    <Button
      size="icon"
      variant="ghost"
      className="canvas-corner-btn"
      icon={<IconSafeZone />}
      pressed={shown}
      aria-label="Strefy bezpieczne"
      title="Strefy bezpieczne: obszary zasłaniane przez interfejs platformy (nie trafiają do eksportu)"
      onClick={() => setShown(!shown)}
    />
  )
}

function EmptyState({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  const collage = useAppStore((s) => s.mode === 'collage')
  if (collage) {
    return (
      <StatusCard
        icon={<IconImage />}
        title="Kolaż czeka na zdjęcia"
        actions={
          <FileButton accept="image/*" multiple onFiles={onFiles} variant="primary" icon={<IconUpload />}>
            Dodaj zdjęcia
          </FileButton>
        }
      >
        Przeciągnij tutaj zdjęcia albo wybierz je z dysku. Podział kadru i przycinanie ustawisz w zakładce Układ.
      </StatusCard>
    )
  }
  return (
    <StatusCard
      icon={<IconRoute />}
      title="Zacznij od zdjęć lub trasy"
      actions={
        <div className="button-row">
          <FileButton accept="image/*" multiple onFiles={onFiles} variant="primary" icon={<IconUpload />}>
            Dodaj zdjęcia
          </FileButton>
          <FileButton accept=".gpx,application/gpx+xml" onFiles={onFiles} icon={<IconUpload />}>
            Wgraj GPX
          </FileButton>
        </div>
      }
    >
      Przeciągnij tutaj zdjęcia albo plik .gpx z Garmina, Stravy lub Komoot. Trasa jest opcjonalna — możesz pracować na samych zdjęciach.
    </StatusCard>
  )
}

// The frame at a size that fits the box: the live preview a workspace shows in its corner.
function FramePreview({ width, height }: { width: number; height: number }) {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const { w, h } = FORMATS[aspectKey]
  return <CanvasStage previewScale={Math.min(width / (w * slideCount), height / h)} />
}

export default function CanvasArea() {
  const workspace = useAppStore((s) => (s.centerView === 'map' ? workspaceFor(s) : undefined))
  if (workspace) {
    return (
      <div className="canvas-area">
        <workspace.Component preview={(box) => <FramePreview {...box} />} />
        <Toast />
      </div>
    )
  }
  return <FrameArea />
}

function FrameArea() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(viewportRef)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const gpxError = useAppStore((s) => s.gpxError)
  const collage = useAppStore((s) => s.mode === 'collage')
  const exporting = useAppStore((s) => s.exporting)
  const hasRoute = useHasRoute()
  const hasPhotos = useHasPhotos()
  const slideCount = useAppStore((s) => s.slides.length)
  const panorama = usePanorama()
  const activeSlide = useActiveSlide()
  const cellCount = useAppStore((s) => layoutDef(s.slides[0].layoutKey).cells.length)
  const select = useAppStore((s) => s.select)
  const { importFiles } = useGpxImport()
  const [dragging, setDragging] = useState(false)

  const { w, h, safeZone } = FORMATS[aspectKey]
  // A tall frame leaves room at its side: the slides go on a rail there instead of under it.
  const rail = h > w
  // A series shows the selected slide; a panorama is one picture, so it shows whole.
  const series = !panorama && slideCount > 1
  const shown = series ? 1 : slideCount
  const previewScale =
    width > 0 && height > 0 ? Math.min((width - VIEWPORT_PADDING * 2) / (w * shown), (height - VIEWPORT_PADDING * 2) / h, 1) : 0
  const stage = previewScale > 0 && <CanvasStage previewScale={previewScale} />

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    importFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="canvas-area"
      onDragOver={(e) => {
        e.preventDefault()
        // Only files from outside get the drop hint; a photo dragged from the pool doesn't.
        setDragging(e.dataTransfer.types.includes('Files'))
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDropCapture={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <CanvasToolbar />
      <div className={rail ? 'canvas-body rail' : 'canvas-body'}>
        {rail && !panorama && <SlideStrip vertical />}
        <div
          className="canvas-viewport"
          ref={viewportRef}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) select(null)
          }}
        >
          {series ? (
            <div className="slide-window" style={{ width: w * previewScale, height: h * previewScale }}>
              <div style={{ transform: `translateX(${-activeSlide * w * previewScale}px)` }}>{stage}</div>
            </div>
          ) : (
            stage
          )}
          {!hasRoute && !hasPhotos && cellCount <= 1 && slideCount === 1 && (
            <div className="canvas-overlay">
              {gpxError ? <GpxErrorCard /> : <EmptyState onFiles={importFiles} />}
            </div>
          )}
          {exporting && (
            <div className="export-cover" role="status">
              Przygotowuję pliki…
            </div>
          )}
          {dragging && (
            <div className="drop-indicator" aria-hidden="true">
              {collage ? 'Upuść zdjęcia' : 'Upuść plik GPX lub zdjęcie'}
            </div>
          )}
          {safeZone && <SafeZoneToggle />}
        </div>
      </div>
      {canvasControls().map((Controls, i) => (
        <Controls key={i} />
      ))}
      {!rail && !panorama && <SlideStrip vertical={false} />}
      <PhotoSlidesDialog />
      <PhotoPicker />
      <Toast />
    </div>
  )
}
