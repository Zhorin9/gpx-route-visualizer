import { useRef, useState, type DragEvent } from 'react'
import useElementSize from '../hooks/useElementSize'
import useGpxImport from '../hooks/useGpxImport'
import { useHasRoute } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS } from '../utils/aspects'
import CanvasStage from './CanvasStage'
import { IconMove, IconReset, IconRoute, IconSafeZone, IconUpload } from './icons'
import Button from './ui/Button'
import FileButton from './ui/FileButton'
import Toast from './ui/Toast'

const VIEWPORT_PADDING = 24

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
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isTransformed =
    transform.x !== 0 || transform.y !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || transform.rotation !== 0

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Narzędzia podglądu">
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
      {aspectKey === '9:16' && (
        <Button
          size="sm"
          variant="ghost"
          icon={<IconSafeZone />}
          pressed={showSafeZones}
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Pokaż obszary zasłaniane przez interfejs Instagrama (nie trafiają do eksportu)"
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
    </div>
  )
}

function EmptyState({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IconRoute width={28} height={28} />
      </div>
      <h2>Zacznij od pliku GPX</h2>
      <p>Przeciągnij tutaj plik .gpx z Garmina, Stravy lub Komoot — opcjonalnie razem ze zdjęciem tła.</p>
      <FileButton accept=".gpx,application/gpx+xml" onFiles={onFiles} variant="primary" icon={<IconUpload />}>
        Wybierz plik GPX
      </FileButton>
    </div>
  )
}

export default function CanvasArea() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(viewportRef)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const gpxError = useAppStore((s) => s.gpxError)
  const hasRoute = useHasRoute()
  const { importFiles } = useGpxImport()
  const [dragging, setDragging] = useState(false)

  const { w, h } = ASPECTS[aspectKey]
  const previewScale =
    width > 0 && height > 0 ? Math.min((width - VIEWPORT_PADDING * 2) / w, (height - VIEWPORT_PADDING * 2) / h, 1) : 0

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
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={handleDrop}
    >
      <CanvasToolbar />
      <div className="canvas-viewport" ref={viewportRef}>
        {previewScale > 0 && <CanvasStage previewScale={previewScale} />}
        {!hasRoute && (
          <div className="canvas-overlay">
            <EmptyState onFiles={importFiles} />
            {gpxError && (
              <p className="error" role="alert">
                {gpxError}
              </p>
            )}
          </div>
        )}
        {dragging && (
          <div className="drop-indicator" aria-hidden="true">
            Upuść plik GPX lub zdjęcie
          </div>
        )}
      </div>
      <Toast />
    </div>
  )
}
