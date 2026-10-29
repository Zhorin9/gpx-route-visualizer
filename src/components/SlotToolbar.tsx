import Button from './ui/Button'
import { IconClose, IconMinus, IconPlus, IconReplace, IconTrash, IconType, IconFit } from './icons'
import { usePanorama, useSlideBox, useSlideSlots } from '../store/selectors'
import { intoBox } from '../utils/wrappers'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'

const ZOOM_STEP = 0.1

// Floating controls above the selected photo slot.
export default function SlotToolbar({ previewScale }: { previewScale: number }) {
  const selection = useAppStore((s) => s.selection)
  const assignment = useAppStore((s) =>
    s.selection?.kind === 'slot' ? s.slides[s.selection.slide]?.slots[s.selection.index] : undefined,
  )
  const fit = useAppStore((s) => s.collage.fit)
  const framed = useAppStore((s) => s.collage.frame.enabled)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const requestPhoto = useAppStore((s) => s.requestPhoto)
  const resetSlotCrop = useAppStore((s) => s.resetSlotCrop)
  const updateSlot = useAppStore((s) => s.updateSlot)
  const clearSlot = useAppStore((s) => s.clearSlot)
  const addCaption = useAppStore((s) => s.addCaption)
  const select = useAppStore((s) => s.select)
  const panorama = usePanorama()
  const slideCount = useAppStore((s) => s.slides.length)
  const slots = useSlideSlots(selection?.kind === 'slot' ? selection.slide : 0)
  const box = useSlideBox(selection?.kind === 'slot' ? selection.slide : 0)

  if (selection?.kind !== 'slot') return null
  const own = slots[selection.index]
  if (!own) return null
  // Under a wrapper the slot is drawn smaller, inside its slide's box.
  const { w, h } = FORMATS[aspectKey]
  const scale = box ? box.w / w : 1
  const centre = box ? intoBox(box, w, h, own.x + own.w / 2, own.y + own.h / 2) : { x: own.x + own.w / 2, y: own.y + own.h / 2 }
  const slot = { ...own, x: centre.x - (own.w * scale) / 2, y: centre.y - (own.h * scale) / 2, w: own.w * scale, h: own.h * scale }

  // Bounding box of the (possibly tilted) slot, in preview pixels.
  const rad = (slot.rotation * Math.PI) / 180
  const bh = Math.abs(slot.w * Math.sin(rad)) + Math.abs(slot.h * Math.cos(rad))
  // Keep the bar inside the frame; its width is roughly 330px.
  const frameW = FORMATS[aspectKey].w * previewScale * (panorama ? slideCount : 1)
  const localX = Math.min(Math.max((slot.x + slot.w / 2) * previewScale, 170), Math.max(170, frameW - 170))
  const cx = localX + selection.slide * frameW
  const top = (slot.y + slot.h / 2 - bh / 2) * previewScale
  const bottom = top + bh * previewScale
  const above = top >= 52
  const style = { left: cx, top: above ? top - 10 : bottom + 10, transform: above ? 'translate(-50%, -100%)' : 'translateX(-50%)' }
  const { slide, index } = selection
  const zoom = assignment?.zoom ?? 1
  const canCrop = fit === 'cover'
  const canCaption = !panorama && (slot.kind === 'framed' || framed)

  return (
    <div className="slot-toolbar" style={style} role="toolbar" aria-label="Zdjęcie w slocie">
      <Button size="sm" variant="ghost" icon={<IconReplace />} onClick={() => requestPhoto({ slide, index })}>
        {assignment ? 'Wymień' : 'Dodaj zdjęcie'}
      </Button>
      {assignment && (
        <>
          {canCrop && (
            <>
              <Button size="sm" variant="ghost" icon={<IconFit />} onClick={() => resetSlotCrop(slide, index)}>
                Dopasuj
              </Button>
              <span className="slot-toolbar-sep" />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Oddal"
                disabled={zoom <= 1}
                onClick={() => updateSlot(slide, index, { zoom: Math.max(1, zoom - ZOOM_STEP) })}
              >
                <IconMinus />
              </Button>
              <span className="slot-toolbar-zoom">{Math.round(zoom * 100)}%</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Przybliż"
                disabled={zoom >= 4}
                onClick={() => updateSlot(slide, index, { zoom: Math.min(4, zoom + ZOOM_STEP) })}
              >
                <IconPlus />
              </Button>
              <span className="slot-toolbar-sep" />
            </>
          )}
          {canCaption && (
            <Button size="sm" variant="ghost" icon={<IconType />} onClick={() => addCaption(slide, index)}>
              Podpis
            </Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Usuń zdjęcie ze slotu" onClick={() => clearSlot(slide, index)}>
            <IconTrash />
          </Button>
        </>
      )}
      <span className="slot-toolbar-sep" />
      <Button size="icon" variant="ghost" aria-label="Zamknij pasek (Esc)" title="Zamknij (Esc)" onClick={() => select(null)}>
        <IconClose />
      </Button>
    </div>
  )
}
