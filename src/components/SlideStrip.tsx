import { IconClose, IconPlus } from './icons'
import { useActiveSlide } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { MAX_SLIDES, MIN_CAROUSEL_SLIDES } from '../store/defaults'
import { ASPECTS } from '../utils/aspects'
import { computeSlots, layoutDef } from '../utils/layouts'
import './SlideStrip.css'

const THUMB_H = 72

// Carousel slides as a row of mini frames: pick one to edit, add or remove.
export default function SlideStrip() {
  const slides = useAppStore((s) => s.slides)
  const photos = useAppStore((s) => s.photos)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setActiveSlide = useAppStore((s) => s.setActiveSlide)
  const addSlide = useAppStore((s) => s.addSlide)
  const removeSlide = useAppStore((s) => s.removeSlide)
  const activeSlide = useActiveSlide()

  const { w, h } = ASPECTS[aspectKey]
  const thumbW = Math.round((THUMB_H * w) / h)
  const thumbById = new Map(photos.map((p) => [p.id, p.thumb]))

  return (
    <div className="slide-strip" role="group" aria-label="Slajdy karuzeli">
      <span className="photo-tape-title">Slajdy</span>
      <div className="photo-tape-list">
        {slides.map((slide, index) => {
          const cells = computeSlots(layoutDef(slide.layoutKey), thumbW, THUMB_H, 2, 0)
          return (
            <div key={index} className={index === activeSlide ? 'slide-thumb active' : 'slide-thumb'}>
              <button type="button" className="slide-thumb-body" aria-pressed={index === activeSlide} onClick={() => setActiveSlide(index)}>
                <span className="slide-thumb-frame" style={{ width: thumbW, height: THUMB_H }}>
                  {cells.map((cell) => {
                    const thumb = thumbById.get(slide.slots[cell.index]?.photoId ?? -1)
                    return (
                      <span
                        key={cell.index}
                        className="layout-thumb-cell"
                        style={{
                          left: cell.x,
                          top: cell.y,
                          width: cell.w,
                          height: cell.h,
                          transform: cell.rotation ? `rotate(${cell.rotation}deg)` : undefined,
                          backgroundImage: thumb ? `url(${thumb})` : undefined,
                        }}
                      />
                    )
                  })}
                </span>
                <span className="slide-thumb-label">Slajd {index + 1}</span>
              </button>
              {slides.length > MIN_CAROUSEL_SLIDES && (
                <button type="button" className="slide-thumb-remove" aria-label={`Usuń slajd ${index + 1}`} onClick={() => removeSlide(index)}>
                  <IconClose width={12} height={12} />
                </button>
              )}
            </div>
          )
        })}
        {slides.length < MAX_SLIDES && (
          <button type="button" className="slide-add" onClick={addSlide} aria-label="Dodaj slajd" style={{ width: thumbW, height: THUMB_H }}>
            <IconPlus width={18} height={18} />
          </button>
        )}
      </div>
    </div>
  )
}
