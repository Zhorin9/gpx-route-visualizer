import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { hasVisiblePhotos, useActiveSlide, usePanorama } from '../store/selectors'
import { CHROME_ACCENT as ACCENT } from '../core/canvas/chrome'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { UI_ONLY } from '../utils/exportImage'
import { usePhotoAnimation } from '../core/animation/layers'
import { blurredBackdrop, containLayout, coverLayout } from '../utils/image'
import PannableCover from './PannableCover'
import { computeSlots, frameInsets, layoutDef, ribbonSlot, slotCount, type SlotRect } from '../utils/layouts'
import SlideBox from './SlideBox'
import type { CollageStyle, Photo, SlotAssignment } from '../types'
import { clamp } from '../utils/math'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface SlotViewProps {
  slot: SlotRect
  slide: number
  frameOffsetX: number
  collage: CollageStyle
  assignment?: SlotAssignment
  photo?: Photo
  selected: boolean
  emptyLabel?: string
  order: number
  count: number
}

function PhotoImage({ photo, assignment, inner, fit, slide, index }: { photo: Photo; assignment: SlotAssignment; inner: Box; fit: 'cover' | 'contain'; slide: number; index: number }) {
  const updateSlot = useAppStore((s) => s.updateSlot)
  const img = photo.image
  const crop = assignment.crop ?? (fit === 'contain' ? 'fit' : 'manual')

  if (crop === 'fit') {
    const back = coverLayout(img.width, img.height, inner.w, inner.h, 1, 0, 0)
    const front = containLayout(img.width, img.height, inner.w, inner.h)
    return (
      <>
        <KonvaImage image={blurredBackdrop(img)} x={inner.x + back.x} y={inner.y + back.y} width={back.width} height={back.height} listening={false} />
        <KonvaImage image={img} x={inner.x + front.x} y={inner.y + front.y} width={front.width} height={front.height} />
      </>
    )
  }

  if (crop === 'fill') {
    const layout = coverLayout(img.width, img.height, inner.w, inner.h, assignment.zoom, assignment.offsetX, assignment.offsetY)
    return <KonvaImage image={img} x={inner.x + layout.x} y={inner.y + layout.y} width={layout.width} height={layout.height} />
  }

  return (
    <PannableCover
      image={img}
      box={inner}
      zoom={assignment.zoom}
      offsetX={assignment.offsetX}
      offsetY={assignment.offsetY}
      onPan={(offsetX, offsetY) => updateSlot(slide, index, { offsetX, offsetY })}
      onZoom={(zoom) => updateSlot(slide, index, { zoom })}
    />
  )
}

// Large, high-contrast target: it has to read on a checkerboard and on any frame colour.
function EmptySlot({ inner, label, onPick }: { inner: Box; label: string; onPick: () => void }) {
  const [hover, setHover] = useState(false)
  const short = Math.min(inner.w, inner.h)
  const radius = clamp(short * 0.14, 22, 56)
  const cx = inner.x + inner.w / 2
  const cy = inner.y + inner.h / 2 - radius * 0.5
  const arm = radius * 0.5
  const stroke = Math.max(3, radius * 0.1)

  function setCursor(e: Konva.KonvaEventObject<MouseEvent>, cursor: string) {
    e.target.getStage()!.container().style.cursor = cursor
  }

  return (
    <>
      <Rect
        name={UI_ONLY}
        x={inner.x}
        y={inner.y}
        width={inner.w}
        height={inner.h}
        fill={hover ? '#f6e9d0' : 'rgba(255, 255, 255, 0.82)'}
        onClick={onPick}
        onTap={onPick}
        onMouseEnter={(e) => {
          setHover(true)
          setCursor(e, 'pointer')
        }}
        onMouseLeave={(e) => {
          setHover(false)
          setCursor(e, '')
        }}
      />
      <Rect
        name={UI_ONLY}
        x={inner.x + 6}
        y={inner.y + 6}
        width={inner.w - 12}
        height={inner.h - 12}
        stroke={ACCENT}
        strokeWidth={hover ? 4 : 3}
        strokeScaleEnabled={false}
        dash={[14, 9]}
        listening={false}
      />
      <Circle name={UI_ONLY} x={cx} y={cy} radius={radius} fill={hover ? ACCENT : '#ffffff'} stroke={ACCENT} strokeWidth={stroke} listening={false} />
      <Line name={UI_ONLY} points={[cx - arm, cy, cx + arm, cy]} stroke={hover ? '#ffffff' : ACCENT} strokeWidth={stroke * 1.4} lineCap="round" listening={false} />
      <Line name={UI_ONLY} points={[cx, cy - arm, cx, cy + arm]} stroke={hover ? '#ffffff' : ACCENT} strokeWidth={stroke * 1.4} lineCap="round" listening={false} />
      <Text
        name={UI_ONLY}
        x={inner.x}
        y={cy + radius + 14}
        width={inner.w}
        text={label}
        align="center"
        fontFamily="Lora"
        fontStyle="600"
        fontSize={clamp(inner.w / 9, 18, 34)}
        fill="#7a5920"
        listening={false}
      />
    </>
  )
}

function SlotView({ slot, slide, frameOffsetX, collage, assignment, photo, selected, emptyLabel, order, count }: SlotViewProps) {
  const { t } = useTranslation()
  const animation = usePhotoAnimation(order, count)
  const select = useAppStore((s) => s.select)
  const requestPhoto = useAppStore((s) => s.requestPhoto)
  const { frame } = collage
  const framed = slot.kind === 'framed' || (slot.kind === 'cell' && frame.enabled)
  const insets = frameInsets(slot, frame.thickness, frame.style, framed)
  const inner: Box = {
    x: insets.left,
    y: insets.top,
    w: slot.w - insets.left - insets.right,
    h: slot.h - insets.top - insets.bottom,
  }
  const handleSelect = () => select({ kind: 'slot', slide, index: slot.index })

  return (
    <Group
      x={slot.x + slot.w / 2 + frameOffsetX}
      y={slot.y + slot.h / 2 + animation.offsetY}
      opacity={animation.opacity}
      offsetX={slot.w / 2}
      offsetY={slot.h / 2}
      rotation={slot.rotation}
      onMouseDown={handleSelect}
      onTouchStart={handleSelect}
    >
      {framed && (
        <Rect
          width={slot.w}
          height={slot.h}
          fill={frame.color}
          shadowColor="#2d2b2b"
          shadowBlur={18}
          shadowOffsetY={6}
          shadowOpacity={0.35}
        />
      )}
      <Group clipX={inner.x} clipY={inner.y} clipWidth={inner.w} clipHeight={inner.h}>
        {photo && assignment ? (
          <PhotoImage photo={photo} assignment={assignment} inner={inner} fit={collage.fit} slide={slide} index={slot.index} />
        ) : (
          <EmptySlot inner={inner} label={emptyLabel ?? (slot.kind === 'backdrop' ? t('photoLayer.addBackdropPhoto') : t('photoLayer.addPhoto'))} onPick={() => requestPhoto({ slide, index: slot.index })} />
        )}
      </Group>
      {selected && (
        <Rect
          name={UI_ONLY}
          width={slot.w}
          height={slot.h}
          stroke={ACCENT}
          strokeWidth={2}
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
    </Group>
  )
}

export default function PhotoLayer() {
  const { t } = useTranslation()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slides = useAppStore((s) => s.slides)
  const collage = useAppStore((s) => s.collage)
  const photos = useAppStore((s) => s.photos)
  const previewLayoutKey = useAppStore((s) => s.previewLayoutKey)
  const selection = useAppStore((s) => s.selection)
  const dimOpacity = useAppStore((s) => s.dimOpacity)
  const carouselKind = useAppStore((s) => s.carouselKind)
  const panorama = usePanorama()
  const activeSlide = useActiveSlide()
  const { w, h } = FORMATS[aspectKey]

  const photoById = new Map(photos.map((p) => [p.id, p]))
  const hasPhotos = hasVisiblePhotos(slides, carouselKind)
  const cellCount = layoutDef(previewLayoutKey ?? slides[0].layoutKey).cells.length
  // A lone empty slot is the plain "no photo" state: the transparent canvas stays visible.
  if (!hasPhotos && slides.length === 1 && cellCount <= 1) return null

  if (panorama) {
    const assignment = slides[0].slots[0]
    const unframed = { ...collage, frame: { ...collage.frame, enabled: false } }
    return (
      <Layer>
        <SlotView
          slot={ribbonSlot(w, h, slides.length)}
          slide={0}
          frameOffsetX={0}
          collage={unframed}
          assignment={assignment}
          photo={assignment ? photoById.get(assignment.photoId) : undefined}
          selected={selection?.kind === 'slot'}
          emptyLabel={t('photoLayer.addPanoramaPhoto')}
          order={0}
          count={1}
        />
        {dimOpacity > 0 && <Rect width={w * slides.length} height={h} fill="#000000" opacity={dimOpacity} listening={false} />}
      </Layer>
    )
  }

  return (
    <Layer>
      {slides.map((slide, slideIndex) => {
        if (!slotCount(slide)) return null
        const def = layoutDef(slideIndex === activeSlide && previewLayoutKey ? previewLayoutKey : slide.layoutKey)
        const slots = computeSlots(def, w, h, collage.gap, collage.margin)
        return (
          <SlideBox key={slideIndex} slide={slideIndex}>
            {slots.map((slot, order) => {
              const assignment = slide.slots[slot.index]
              return (
                <SlotView
                  key={slot.index}
                  slot={slot}
                  slide={slideIndex}
                  frameOffsetX={slideIndex * w}
                  collage={collage}
                  assignment={assignment}
                  photo={assignment ? photoById.get(assignment.photoId) : undefined}
                  selected={selection?.kind === 'slot' && selection.slide === slideIndex && selection.index === slot.index}
                  order={order}
                  count={slots.length}
                />
              )
            })}
          </SlideBox>
        )
      })}
      {dimOpacity > 0 && <Rect width={w * slides.length} height={h} fill="#000000" opacity={dimOpacity} listening={false} />}
    </Layer>
  )
}
