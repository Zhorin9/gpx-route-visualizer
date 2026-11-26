import { useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import useElementSize from '../hooks/useElementSize'
import useMediaQuery, { PHONE_QUERY } from '../hooks/useMediaQuery'
import useGpxImport, { GPX_ACCEPT } from '../hooks/useGpxImport'
import { useActiveSlide, useHasPhotos, useHasRoute, useManualFlags, usePanorama, usePhotoBackground } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { FORMATS, FORMAT_ORDER } from '../core/formats/registry'
import { gradientPresetName } from '../utils/gradients'
import { layoutDef } from '../utils/layouts'
import { hasManualLayout } from '../utils/reflow'
import type { AspectKey } from '../types'
import { canvasControls, workspaceFor } from '../core/canvas/chrome'
import CanvasStage from './CanvasStage'
import CenterViewSwitch from './CenterViewSwitch'
import GpxErrorCard from './GpxErrorCard'
import PhotoPicker from './PhotoPicker'
import SlideStrip from './SlideStrip'
import PhotoSlidesDialog from './PhotoSlidesDialog'
import Segmented from './ui/Segmented'
import { IconFit, IconImage, IconMinus, IconMove, IconPlus, IconReset, IconRoute, IconSafeZone, IconSlides, IconUpload } from './icons'
import { useMapNavigable } from '../hooks/useMapNavigation'
import { zoomedAround } from '../core/route/view'
import Button from './ui/Button'
import FileButton from './ui/FileButton'
import StatusCard from './ui/StatusCard'
import Toast from './ui/Toast'
import TransparentNote from './TransparentNote'

const VIEWPORT_PADDING = 24
const PHONE_VIEWPORT_PADDING = 10
const RAIL_MIN_AREA_WIDTH = 480

function CanvasToolbar() {
  const { t } = useTranslation()
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
  const seriesOfSlides = !usePanorama() && slideCount > 1
  const wholeCarousel = useAppStore((s) => s.wholeCarousel)
  const setWholeCarousel = useAppStore((s) => s.setWholeCarousel)

  const isTransformed =
    transform.x !== 0 || transform.y !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || transform.rotation !== 0

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label={t('canvasArea.toolbar')}>
      {hasWorkspace && <CenterViewSwitch />}
      {FORMATS[aspectKey].carousel && (
        <Segmented
          label={t('canvasArea.frameMode')}
          value={slideCount > 1 ? 'carousel' : 'single'}
          options={[
            { value: 'single', label: t('canvasArea.single') },
            { value: 'carousel', label: t('canvasArea.carousel') },
          ]}
          onChange={(mode) => setCarousel(mode === 'carousel')}
        />
      )}
      {seriesOfSlides && (
        <Button size="sm" variant="ghost" icon={<IconSlides />} pressed={wholeCarousel} onClick={() => setWholeCarousel(!wholeCarousel)} title={t('canvasArea.wholeCarouselTitle')}>
          <span className="toolbar-btn-label">{t('canvasArea.wholeCarousel')}</span>
        </Button>
      )}
      {!collage && (
        <Button
          size="sm"
          variant="ghost"
          icon={<IconMove />}
          pressed={routeEditable}
          disabled={!hasRoute}
          onClick={() => setRouteEditable(!routeEditable)}
          title={t('canvasArea.editRouteTitle')}
        >
          <span className="toolbar-btn-label">{t('canvasArea.editRoute')}</span>
        </Button>
      )}
      {isTransformed && (
        <Button size="sm" variant="ghost" icon={<IconReset />} onClick={resetRouteTransform}>
          <span className="toolbar-btn-label">{t('canvasArea.resetPosition')}</span>
        </Button>
      )}
      <select className="toolbar-select" aria-label={t('canvasArea.format')} title={useFrameSummary()} value={aspectKey} onChange={(e) => setAspectKey(e.target.value as AspectKey)}>
        {FORMAT_ORDER.map((key) => (
          <option key={key} value={key}>
            {t(FORMATS[key].label)}
          </option>
        ))}
      </select>
      {customLayout && <span className="tag-custom">{t('canvasArea.movedManually')}</span>}
      {parkedSlides > 0 && (
        <span className="toolbar-hint" role="status">
          {t('canvasArea.parkedSlides', { count: parkedSlides })}
        </span>
      )}
      {adding && (
        <span className="toolbar-hint" role="status">
          {t('canvasArea.clickToAddPlace')} ·{' '}
          <button type="button" className="link-btn" onClick={() => setAddingWaypoint(false)}>
            {t('canvasArea.cancelEsc')}
          </button>
        </span>
      )}
    </div>
  )
}


function useFrameSummary() {
  const { t } = useTranslation()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const collage = useAppStore((s) => s.collage)
  const { w, h } = FORMATS[aspectKey]

  const photoBackground = usePhotoBackground()
  const mode = slideCount > 1 ? t('canvasArea.summaryCarousel', { count: slideCount, aspect: aspectKey }) : t('canvasArea.summaryFrame', { aspect: aspectKey })
  const preset = gradientPresetName(collage.gradient)
  const background = photoBackground
    ? t('canvasArea.bgPhoto')
    : collage.bgKind === 'gradient'
      ? preset
        ? t('canvasArea.bgGradientPreset', { name: t(preset) })
        : t('canvasArea.bgGradientCustom')
      : collage.bgKind === 'color'
        ? t('canvasArea.bgColor', { color: collage.bgColor.toUpperCase() })
        : t('canvasArea.bgTransparent')

  return `${mode} · ${t('canvasArea.background', { background })} · ${w}×${h} px`
}

function SafeZoneToggle() {
  const { t } = useTranslation()
  const shown = useAppStore((s) => s.showSafeZones)
  const setShown = useAppStore((s) => s.setShowSafeZones)
  return (
    <Button
      size="icon"
      variant="ghost"
      className="canvas-corner-btn"
      icon={<IconSafeZone />}
      pressed={shown}
      aria-label={t('canvasArea.safeZones')}
      title={t('canvasArea.safeZonesTitle')}
      onClick={() => setShown(!shown)}
    />
  )
}

const BUTTON_ZOOM_FACTOR = 1.25

function MapZoomControls() {
  const { t } = useTranslation()
  const navigable = useMapNavigable()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const resetRouteTransform = useAppStore((s) => s.resetRouteTransform)
  if (!navigable) return null
  const { w, h } = FORMATS[aspectKey]
  const zoomBy = (factor: number) => setRouteTransform(zoomedAround(useAppStore.getState().routeTransform, { x: w / 2, y: h / 2 }, factor))
  return (
    <div className="map-zoom" role="group" aria-label={t('canvasArea.mapZoom')}>
      <Button size="icon" variant="ghost" icon={<IconPlus />} aria-label={t('canvasArea.zoomIn')} title={t('canvasArea.zoomIn')} onClick={() => zoomBy(BUTTON_ZOOM_FACTOR)} />
      <Button size="icon" variant="ghost" icon={<IconMinus />} aria-label={t('canvasArea.zoomOut')} title={t('canvasArea.zoomOut')} onClick={() => zoomBy(1 / BUTTON_ZOOM_FACTOR)} />
      <Button size="icon" variant="ghost" icon={<IconFit />} aria-label={t('canvasArea.showWholeRoute')} title={t('canvasArea.showWholeRoute')} onClick={resetRouteTransform} />
    </div>
  )
}

function EmptyState({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  const { t } = useTranslation()
  const collage = useAppStore((s) => s.mode === 'collage')
  if (collage) {
    return (
      <StatusCard
        icon={<IconImage />}
        title={t('canvasArea.collageEmptyTitle')}
        actions={
          <FileButton accept="image/*" multiple onFiles={onFiles} variant="primary" icon={<IconUpload />}>
            {t('canvasArea.addPhotos')}
          </FileButton>
        }
      >
        {t('canvasArea.collageEmptyBody')}
      </StatusCard>
    )
  }
  return (
    <StatusCard
      icon={<IconRoute />}
      title={t('canvasArea.emptyTitle')}
      actions={
        <div className="button-row">
          <FileButton accept="image/*" multiple onFiles={onFiles} variant="primary" icon={<IconUpload />}>
            {t('canvasArea.addPhotos')}
          </FileButton>
          <FileButton accept={GPX_ACCEPT} onFiles={onFiles} icon={<IconUpload />}>
            {t('canvasArea.addGpx')}
          </FileButton>
        </div>
      }
    >
      {t('canvasArea.emptyBody')}
    </StatusCard>
  )
}

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
  const { t } = useTranslation()
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
  const phone = useMediaQuery(PHONE_QUERY)
  const areaRef = useRef<HTMLDivElement>(null)
  const area = useElementSize(areaRef)

  const { w, h, safeZone } = FORMATS[aspectKey]
  // A tall frame leaves room at its side: the slides go on a rail there instead of under it.
  const rail = h > w && (phone || area.width >= RAIL_MIN_AREA_WIDTH)
  // A series shows the selected slide, or every slide when asked; a panorama is one picture, so it shows whole.
  const wholeCarousel = useAppStore((s) => s.wholeCarousel)
  const series = !panorama && slideCount > 1 && !wholeCarousel
  const shown = series ? 1 : slideCount
  const padding = phone ? PHONE_VIEWPORT_PADDING : VIEWPORT_PADDING
  const previewScale = width > 0 && height > 0 ? Math.min((width - padding * 2) / (w * shown), (height - padding * 2) / h, 1) : 0
  const stage = previewScale > 0 && <CanvasStage previewScale={previewScale} />

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    importFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="canvas-area"
      ref={areaRef}
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
              {t('canvasArea.preparingFiles')}
            </div>
          )}
          {dragging && (
            <div className="drop-indicator" aria-hidden="true">
              {collage ? t('canvasArea.dropPhotos') : t('canvasArea.dropGpxOrPhoto')}
            </div>
          )}
          {safeZone && <SafeZoneToggle />}
          <MapZoomControls />
          <TransparentNote />
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
