import { useState, type DragEvent } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import useGpxImport from '../hooks/useGpxImport'
import { useActiveSlide, useHasBackground, useHasRoute, usePanorama } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { computeSlots, layoutDef, ribbonSlot, slotAt } from '../utils/layouts'
import { stageHandle } from '../utils/exportImage'
import CanvasElements from '../core/canvas/CanvasElements'
import BackgroundLayer from './BackgroundLayer'
import EditableText from './EditableText'
import RouteGroup from './RouteGroup'
import PhotoLayer from './PhotoLayer'
import { PHOTO_DRAG_TYPE } from './PhotoTape'
import SlotToolbar from './SlotToolbar'

export default function CanvasStage({ previewScale }: { previewScale: number }) {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const hasBackground = useHasBackground()
  const previewBackdrop = useAppStore((s) => s.previewBackdrop)
  const adding = useAppStore((s) => s.addingWaypoint)
  const showSafeZones = useAppStore((s) => s.showSafeZones)
  const texts = useAppStore((s) => s.texts)
  const select = useAppStore((s) => s.select)
  const hasRoute = useHasRoute()
  const slides = useAppStore((s) => s.slides)
  const collage = useAppStore((s) => s.collage)
  const activeSlide = useActiveSlide()
  const panorama = usePanorama()
  const previewLayoutKey = useAppStore((s) => s.previewLayoutKey)
  const currentLayoutKey = slides[activeSlide].layoutKey
  const assignPhoto = useAppStore((s) => s.assignPhoto)
  const { importFiles } = useGpxImport()
  const [dragSlot, setDragSlot] = useState<{ slide: number; index: number } | null>(null)

  const { w, h, safeZone } = FORMATS[aspectKey]
  const slideCount = slides.length
  const slotsBySlide = panorama
    ? [[ribbonSlot(w, h, slideCount)]]
    : slides.map((slide) => computeSlots(layoutDef(slide.layoutKey), w, h, collage.gap, collage.margin))
  const isCheckerboard = !hasBackground && previewBackdrop === 'checkerboard'
  const classes = ['stage-wrapper', isCheckerboard && 'checkerboard', adding && 'is-adding'].filter(Boolean).join(' ')

  function handlePointerDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const target = e.target
    if (target === target.getStage()) select(null)
  }

  function slotUnderPointer(e: DragEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / previewScale
    const slide = panorama ? 0 : Math.min(slideCount - 1, Math.max(0, Math.floor(x / w)))
    const slot = slotAt(slotsBySlide[slide], panorama ? x : x - slide * w, (e.clientY - rect.top) / previewScale)
    return slot ? { slide, slot } : null
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    const slot = slotUnderPointer(e)
    setDragSlot(slot ? { slide: slot.slide, index: slot.slot.index } : null)
    if (slot) e.preventDefault()
  }

  // Photos from the tape or the desktop land in the slot under the pointer; anything else bubbles up.
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    setDragSlot(null)
    const target = slotUnderPointer(e)
    if (!target) return
    const photoId = e.dataTransfer.getData(PHOTO_DRAG_TYPE)
    const images = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (!photoId && !images.length) return
    e.preventDefault()
    e.stopPropagation()
    const place = { slide: target.slide, index: target.slot.index }
    if (photoId) assignPhoto(place.slide, place.index, Number(photoId))
    else importFiles(images, place)
  }

  const dragRect = dragSlot ? { ...slotsBySlide[dragSlot.slide][dragSlot.index], x: slotsBySlide[dragSlot.slide][dragSlot.index].x + dragSlot.slide * w } : null

  return (
    <div
      className={classes}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragSlot(null)}
      onDrop={handleDrop}
      style={{
        width: w * slideCount * previewScale,
        height: h * previewScale,
        ...(!hasBackground && !isCheckerboard ? { background: previewBackdrop } : null),
      }}
    >
      {/* Sized to the preview, not the export: a full 1080×1920 canvas
          would be redrawn at every change only to be cropped by CSS. */}
      <Stage
        ref={(stage) => {
          stageHandle.current = stage
        }}
        width={w * slideCount * previewScale}
        height={h * previewScale}
        scaleX={previewScale}
        scaleY={previewScale}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <BackgroundLayer />
        <PhotoLayer />
        <Layer>{hasRoute && <RouteGroup />}</Layer>
        <Layer>
          <CanvasElements />
          {texts.map((node) => (
            <EditableText key={node.id} node={node} />
          ))}
        </Layer>
      </Stage>

      {/* HTML overlays, so they can never end up in an exported image. */}
      <SlotToolbar previewScale={previewScale} />
      {dragRect && (
        <div
          className="drop-slot"
          style={{
            left: dragRect.x * previewScale,
            top: dragRect.y * previewScale,
            width: dragRect.w * previewScale,
            height: dragRect.h * previewScale,
            transform: dragRect.rotation ? `rotate(${dragRect.rotation}deg)` : undefined,
          }}
        >
          Upuść, aby dodać
        </div>
      )}
      {slideCount > 1 && (
        <div className="slide-dividers" aria-hidden="true">
          {slides.map((_, i) => (
            <div key={i} className={i === activeSlide ? 'slide-divider active' : 'slide-divider'} style={{ width: w * previewScale }}>
              <span>Slajd {i + 1}</span>
            </div>
          ))}
        </div>
      )}
      {previewLayoutKey && previewLayoutKey !== currentLayoutKey && (
        <>
          <div
            className="layout-preview-outline"
            style={{ left: activeSlide * w * previewScale + 6, width: w * previewScale - 12 }}
            aria-hidden="true"
          />
          <span className="layout-preview-tag" style={{ left: (activeSlide + 0.5) * w * previewScale }}>Podgląd: {layoutDef(previewLayoutKey).label} — kliknij, aby zastosować</span>
        </>
      )}
      {safeZone && showSafeZones && (
        <div className="safe-zones" aria-hidden="true">
          <div className="safe-zone" style={{ height: safeZone.top * previewScale }}>
            <span>{safeZone.topLabel}</span>
          </div>
          <div className="safe-zone bottom" style={{ height: safeZone.bottom * previewScale }}>
            <span>{safeZone.bottomLabel}</span>
          </div>
          {safeZone.left > 0 && <div className="safe-zone side" style={{ left: 0, width: safeZone.left * previewScale }} />}
          {safeZone.right > 0 && <div className="safe-zone side right" style={{ right: 0, width: safeZone.right * previewScale }} />}
        </div>
      )}
    </div>
  )
}
