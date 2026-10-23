import { useRef, useState, type DragEvent } from 'react'
import useElementSize from '../hooks/useElementSize'
import useGpxImport from '../hooks/useGpxImport'
import { useHasPhotos, useHasRoute, useManualFlags, usePhotoBackground } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { FORMATS, FORMAT_ORDER } from '../core/formats/registry'
import { gradientPresetName } from '../utils/gradients'
import { layoutDef } from '../utils/layouts'
import { hasManualLayout } from '../utils/reflow'
import type { AspectKey, SelectOption } from '../types'
import { canvasControls } from '../core/canvas/chrome'
import CanvasStage from './CanvasStage'
import GpxErrorCard from './GpxErrorCard'
import PhotoPicker from './PhotoPicker'
import PhotoTape from './PhotoTape'
import SlideStrip from './SlideStrip'
import Segmented from './ui/Segmented'
import { IconMove, IconReset, IconRoute, IconSafeZone, IconUpload } from './icons'
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
  const hasRoute = useHasRoute()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const routeEditable = useAppStore((s) => s.routeEditable)
  const setRouteEditable = useAppStore((s) => s.setRouteEditable)
  const transform = useAppStore((s) => s.routeTransform)
  const resetRouteTransform = useAppStore((s) => s.resetRouteTransform)
  const showSafeZones = useAppStore((s) => s.showSafeZones)
  const setShowSafeZones = useAppStore((s) => s.setShowSafeZones)
  const adding = useAppStore((s) => s.addingWaypoint)
  const slideCount = useAppStore((s) => s.slides.length)
  const setCarousel = useAppStore((s) => s.setCarousel)
  const setAspectKey = useAppStore((s) => s.setAspectKey)
  const customLayout = hasManualLayout(useManualFlags())
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isTransformed =
    transform.x !== 0 || transform.y !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || transform.rotation !== 0

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Narzędzia podglądu">
      <Segmented
        label="Tryb kadru"
        value={slideCount > 1 ? 'carousel' : 'single'}
        options={MODE_OPTIONS}
        onChange={(mode) => setCarousel(mode === 'carousel')}
      />
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
      {isTransformed && (
        <Button size="sm" variant="ghost" icon={<IconReset />} onClick={resetRouteTransform}>
          Resetuj położenie
        </Button>
      )}
      <Segmented label="Format kadru" value={aspectKey} options={FORMAT_OPTIONS} onChange={setAspectKey} />
      {customLayout && <span className="tag-custom">własny układ</span>}
      {FORMATS[aspectKey].safeZone && (
        <Button
          size="sm"
          variant="ghost"
          icon={<IconSafeZone />}
          pressed={showSafeZones}
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Pokaż obszary zasłaniane przez interfejs platformy (nie trafiają do eksportu)"
        >
          Strefy bezpieczne
        </Button>
      )}
      {adding && (
        <span className="toolbar-hint" role="status">
          Kliknij na trasie, aby dodać miejscowość ·{' '}
          <button type="button" className="link-btn" onClick={() => setAddingWaypoint(false)}>
            Anuluj (Esc)
          </button>
        </span>
      )}
      <FrameStatus />
    </div>
  )
}


// Read-only summary of what gets exported: mode, format, background and pixel size.
function FrameStatus() {
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

  return (
    <span className="frame-status" role="status">
      {mode} · tło: {background} · {w}×{h} px
    </span>
  )
}

function EmptyState({ onFiles }: { onFiles: (files: FileList | null) => void }) {
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

export default function CanvasArea() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(viewportRef)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const gpxError = useAppStore((s) => s.gpxError)
  const exporting = useAppStore((s) => s.exporting)
  const hasRoute = useHasRoute()
  const hasPhotos = useHasPhotos()
  const slideCount = useAppStore((s) => s.slides.length)
  const carouselKind = useAppStore((s) => s.carouselKind)
  const cellCount = useAppStore((s) => layoutDef(s.slides[0].layoutKey).cells.length)
  const select = useAppStore((s) => s.select)
  const { importFiles } = useGpxImport()
  const [dragging, setDragging] = useState(false)

  const { w, h } = FORMATS[aspectKey]
  const previewScale =
    width > 0 && height > 0 ? Math.min((width - VIEWPORT_PADDING * 2) / (w * slideCount), (height - VIEWPORT_PADDING * 2) / h, 1) : 0

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
        // Only files from outside get the drop hint; a photo dragged from the tape doesn't.
        setDragging(e.dataTransfer.types.includes('Files'))
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDropCapture={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <CanvasToolbar />
      <div
        className="canvas-viewport"
        ref={viewportRef}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) select(null)
        }}
      >
        {previewScale > 0 && <CanvasStage previewScale={previewScale} />}
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
            Upuść plik GPX lub zdjęcie
          </div>
        )}
      </div>
      {canvasControls().map((Controls, i) => (
        <Controls key={i} />
      ))}
      {slideCount > 1 && carouselKind === 'slides' && <SlideStrip />}
      <PhotoTape />
      <PhotoPicker />
      <Toast />
    </div>
  )
}
