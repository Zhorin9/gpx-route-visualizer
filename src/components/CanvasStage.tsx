import { useState, type DragEvent } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import useGpxImport from '../hooks/useGpxImport'
import { useActiveSlide, useHasBackground, useHasRoute, usePanorama } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { computeSlots, layoutDef, ribbonSlot, slotAt, slotCount } from '../utils/layouts'
import { stageHandle } from '../utils/exportImage'
import { slideNumbers } from '../utils/series'
import { fromBox, intoBox, slideBox } from '../utils/wrappers'
import CanvasElements from '../core/canvas/CanvasElements'
import { stageUnderlays } from '../core/canvas/chrome'
import BackgroundLayer from './BackgroundLayer'
import EditableText from './EditableText'
import RouteGroup from './RouteGroup'
import PhotoLayer from './PhotoLayer'
import SeriesLayer from './SeriesLayer'
import { PHOTO_DRAG_TYPE } from './panel/PhotoPool'
import SlideBox from './SlideBox'
import SlotToolbar from './SlotToolbar'
import WrapperLayer from './WrapperLayer'
import type { SlotRect } from '../utils/layouts'

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
  const wrapper = useAppStore((s) => s.wrapper)
  const carouselKind = useAppStore((s) => s.carouselKind)
  const activeSlide = useActiveSlide()
  const panorama = usePanorama()
  const previewLayoutKey = useAppStore((s) => s.previewLayoutKey)
  const currentLayoutKey = slides[activeSlide].layoutKey
  const assignPhoto = useAppStore((s) => s.assignPhoto)
  const setActiveSlide = useAppStore((s) => s.setActiveSlide)
  const { importFiles } = useGpxImport()
  const [dragSlot, setDragSlot] = useState<{ slide: number; index: number } | null>(null)

  const { w, h, safeZone } = FORMATS[aspectKey]
  const slideCount = slides.length
  const numbers = slideNumbers(slides)
  const slotsBySlide = panorama
    ? [[ribbonSlot(w, h, slideCount)]]
    : slides.map((slide) => (slotCount(slide) ? computeSlots(layoutDef(slide.layoutKey), w, h, collage.gap, collage.margin) : []))
  // Where each slide's content sits under the wrapper; null where it fills the slide.
  const boxes = slides.map((_, i) => slideBox({ wrapper, slides, carouselKind }, i, w, h))
  const first = boxes[0]
  const isCheckerboard = !hasBackground && previewBackdrop === 'checkerboard'
  const classes = ['stage-wrapper', isCheckerboard && 'checkerboard', adding && 'is-adding'].filter(Boolean).join(' ')

  // A click on empty space drops the selection and picks the slide under the pointer.
  function handlePointerDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = e.target.getStage()
    if (e.target !== stage) return
    select(null)
    const x = stage?.getPointerPosition()?.x
    if (x != null && !panorama && slideCount > 1) setActiveSlide(Math.min(slideCount - 1, Math.floor(x / previewScale / w)))
  }

  function slotUnderPointer(e: DragEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / previewScale
    const y = (e.clientY - rect.top) / previewScale
    const slide = panorama ? 0 : Math.min(slideCount - 1, Math.max(0, Math.floor(x / w)))
    const box = boxes[slide]
    const at = box ? fromBox(box, w, h, x - slide * w, y) : { x: panorama ? x : x - slide * w, y }
    const slot = slotAt(slotsBySlide[slide], at.x, at.y)
    return slot ? { slide, slot } : null
  }

  // A slot's rectangle on the ribbon, where its slide's box draws it.
  function onRibbon(slot: SlotRect, slide: number) {
    const box = boxes[slide]
    if (!box) return { ...slot, x: slot.x + slide * w }
    const scale = box.w / w
    const c = intoBox(box, w, h, slot.x + slot.w / 2, slot.y + slot.h / 2)
    return { x: slide * w + c.x - (slot.w * scale) / 2, y: c.y - (slot.h * scale) / 2, w: slot.w * scale, h: slot.h * scale, rotation: (slot.rotation ?? 0) + box.rotation }
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

  const dragRect = dragSlot ? onRibbon(slotsBySlide[dragSlot.slide][dragSlot.index], dragSlot.slide) : null

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
      {/* The map lies under the first slide's content, so it shrinks into the same box. */}
      <div
        className="stage-underlays"
        style={
          first
            ? {
                transformOrigin: `${(w / 2) * previewScale}px ${(h / 2) * previewScale}px`,
                transform: `translate(${(first.x + first.w / 2 - w / 2) * previewScale}px, ${(first.y + first.h / 2 - h / 2) * previewScale}px) rotate(${first.rotation}deg) scale(${first.w / w})`,
              }
            : undefined
        }
      >
        {stageUnderlays().map((Underlay, i) => (
          <Underlay key={i} previewScale={previewScale} />
        ))}
      </div>
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
        <SeriesLayer />
        <Layer>
          {hasRoute && (
            <SlideBox slide={0}>
              <RouteGroup />
            </SlideBox>
          )}
        </Layer>
        <Layer>
          <CanvasElements />
          {texts.map((node) => (
            <EditableText key={node.id} node={node} />
          ))}
        </Layer>
        <WrapperLayer />
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
              <span>{numbers[i] == null ? 'Pominięty slajd' : `Slajd ${numbers[i]}`}</span>
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
