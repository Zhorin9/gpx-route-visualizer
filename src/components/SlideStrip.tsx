import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react'
import { IconMore, IconPlus } from './icons'
import { useActiveSlide } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import useDismiss from '../hooks/useDismiss'
import { FORMATS } from '../core/formats/registry'
import { computeSlots, layoutDef, slotCount } from '../utils/layouts'
import { drawDataSlide } from '../utils/drawSlide'
import { LIMIT_MESSAGE, kindBlocker, roomForSlide, slideLabel, slideNumbers } from '../utils/series'
import useSlideScene from '../hooks/useSlideScene'
import type { Slide, SlideKind } from '../types'
import './SlideStrip.css'

// Along the bottom thumbnails share a height; on the rail beside a tall frame, a width.
const THUMB_H = 72
const RAIL_THUMB_W = 64
const SLIDE_DRAG_TYPE = 'application/x-slide'
const HINT_SEEN_KEY = 'gpx.slideStripHint'
const REORDER_HINT = 'Przeciągnij slajd, aby zmienić kolejność. Pierwszy slajd to kadr edytora i zostaje na początku.'

const ADD_KINDS: { kind: SlideKind | 'collage'; label: string }[] = [
  { kind: 'photos', label: 'Puste zdjęcie' },
  { kind: 'collage', label: 'Kolaż' },
  { kind: 'profile', label: 'Profil' },
  { kind: 'summary', label: 'Podsumowanie' },
]

// A profile or summary in miniature, drawn the same way as on the frame.
function DataThumb({ slide, width, height }: { slide: Slide; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { projectLook, ...scene } = useSlideScene()
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const k = width / scene.w
    ctx.setTransform(k, 0, 0, k, 0, 0)
    drawDataSlide(ctx, slide, { ...scene, look: slide.ownLook ?? projectLook })
  })
  return <canvas ref={ref} width={width} height={height} />
}

function PhotoThumb({ slide, width, height }: { slide: Slide; width: number; height: number }) {
  const photos = useAppStore((s) => s.photos)
  const thumbById = new Map(photos.map((p) => [p.id, p.thumb]))
  return (
    <>
      {computeSlots(layoutDef(slide.layoutKey), width, height, 2, 0).map((cell) => {
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
    </>
  )
}

function SlideMenu({ index, count, at, onClose }: { index: number; count: number; at: CSSProperties; onClose: () => void }) {
  const slide = useAppStore((s) => s.slides[index])
  const duplicateSlide = useAppStore((s) => s.duplicateSlide)
  const moveSlide = useAppStore((s) => s.moveSlide)
  const toggleSkipSlide = useAppStore((s) => s.toggleSkipSlide)
  const removeSlide = useAppStore((s) => s.removeSlide)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(true, ref, onClose)
  const item = (label: string, action: () => void, opts: { hint?: string; disabled?: boolean; danger?: boolean } = {}) => (
    <button
      type="button"
      role="menuitem"
      className={opts.danger ? 'danger' : undefined}
      disabled={opts.disabled}
      onClick={() => {
        action()
        onClose()
      }}
    >
      {label}
      {opts.hint && <span className="text-muted">{opts.hint}</span>}
    </button>
  )
  const first = index === 0
  return (
    <div className="slide-menu" role="menu" ref={ref} style={at}>
      {item('Duplikuj', () => duplicateSlide(index), { hint: 'Ctrl+D' })}
      {item('Przenieś na początek', () => moveSlide(index, 1), { disabled: first || index === 1 })}
      {item('Przenieś na koniec', () => moveSlide(index, count - 1), { disabled: first || index === count - 1 })}
      {item(slide?.skipped ? 'Przywróć do eksportu' : 'Pomiń w eksporcie', () => toggleSkipSlide(index), { disabled: first })}
      {item('Usuń', () => removeSlide(index), { hint: 'Del', disabled: first, danger: true })}
    </div>
  )
}

function AddMenu({ at, onClose }: { at: CSSProperties; onClose: () => void }) {
  const addSeriesSlide = useAppStore((s) => s.addSeriesSlide)
  const importPhotoSlides = useAppStore((s) => s.importPhotoSlides)
  const { route } = useSlideScene()
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useDismiss(true, ref, onClose)
  return (
    <div className="slide-menu" role="menu" ref={ref} style={at}>
      <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}>
        Zdjęcia…
        <span className="text-muted">slajd na każde</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          onClose()
          if (files.length) void importPhotoSlides(files)
        }}
      />
      {ADD_KINDS.map(({ kind, label }) => {
        const blocker = kind === 'collage' ? null : kindBlocker(kind, route)
        return (
          <button
            key={kind}
            type="button"
            role="menuitem"
            disabled={!!blocker}
            onClick={() => {
              addSeriesSlide(kind)
              onClose()
            }}
          >
            {label}
            {blocker && <span className="text-muted">{blocker}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Shows the reorder hint once, the first time the series has a slide to move.
function useFirstUseHint(slideCount: number) {
  const showToast = useAppStore((s) => s.showToast)
  useEffect(() => {
    if (slideCount < 2) return
    try {
      if (localStorage.getItem(HINT_SEEN_KEY)) return
      localStorage.setItem(HINT_SEEN_KEY, '1')
    } catch {
      return
    }
    showToast(REORDER_HINT)
  }, [slideCount, showToast])
}

// The series beside or under the frame: pick a slide to edit, drag to reorder, "…" for the rest, "+" to add.
export default function SlideStrip({ vertical }: { vertical: boolean }) {
  const slides = useAppStore((s) => s.slides)
  const mode = useAppStore((s) => s.mode)
  const { w, h } = FORMATS[useAppStore((s) => s.aspectKey)]
  const setActiveSlide = useAppStore((s) => s.setActiveSlide)
  const moveSlide = useAppStore((s) => s.moveSlide)
  const showToast = useAppStore((s) => s.showToast)
  const activeSlide = useActiveSlide()
  const [menu, setMenu] = useState<{ of: number | 'add'; at: CSSProperties } | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  useFirstUseHint(slides.length)
  // Menus open beside the rail or above the strip, on the page: the scrolling strip would cut them off.
  const toggleMenu = (of: number | 'add', button: HTMLElement) => {
    const rect = button.getBoundingClientRect()
    const at = vertical ? { left: rect.right + 4, top: Math.min(rect.top, window.innerHeight - 240) } : { left: rect.left, bottom: window.innerHeight - rect.top + 4 }
    setMenu(menu?.of === of ? null : { of, at })
  }

  const thumb = vertical ? { width: RAIL_THUMB_W, height: Math.round((RAIL_THUMB_W * h) / w) } : { width: Math.round((THUMB_H * w) / h), height: THUMB_H }
  const numbers = slideNumbers(slides)
  const room = roomForSlide(slides)

  function dropIndex(e: DragEvent<HTMLElement>, index: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const before = vertical ? e.clientY < rect.top + rect.height / 2 : e.clientX < rect.left + rect.width / 2
    return Math.max(1, before ? index : index + 1)
  }

  return (
    <div className={vertical ? 'slide-strip vertical' : 'slide-strip'} role="group" aria-label="Slajdy serii">
      <div className="slide-strip-list">
        {slides.map((slide, index) => {
          const n = numbers[index]
          const classes = ['slide-thumb', index === activeSlide && 'active', slide.skipped && 'skipped', dropAt === index && 'drop-before', dropAt === index + 1 && index === slides.length - 1 && 'drop-after']
          return (
            <div
              key={index}
              className={classes.filter(Boolean).join(' ')}
              draggable={index > 0}
              title={index > 0 ? 'Przeciągnij, aby zmienić kolejność' : undefined}
              onDragStart={(e) => {
                e.dataTransfer.setData(SLIDE_DRAG_TYPE, String(index))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(SLIDE_DRAG_TYPE)) return
                e.preventDefault()
                setDropAt(dropIndex(e, index))
              }}
              onDragLeave={() => setDropAt(null)}
              onDrop={(e) => {
                const from = Number(e.dataTransfer.getData(SLIDE_DRAG_TYPE))
                const to = dropIndex(e, index)
                setDropAt(null)
                // Dropping past itself means one place less once it has left its own.
                moveSlide(from, to > from ? to - 1 : to)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setActiveSlide(index)
                setMenu({ of: index, at: { left: e.clientX, bottom: window.innerHeight - e.clientY } })
              }}
            >
              <button
                type="button"
                className="slide-thumb-body"
                aria-pressed={index === activeSlide}
                aria-label={`Slajd ${n ?? '(pominięty)'}: ${slideLabel(slide, index, mode)}`}
                onClick={() => setActiveSlide(index)}
              >
                <span className="slide-thumb-frame" style={thumb}>
                  {slotCount(slide) ? <PhotoThumb slide={slide} {...thumb} /> : <DataThumb slide={slide} {...thumb} />}
                  <span className="slide-thumb-number">{n ?? '—'}</span>
                </span>
                <span className="slide-thumb-label">{slideLabel(slide, index, mode)}</span>
              </button>
              <button type="button" className="slide-thumb-more" aria-label={`Więcej: slajd ${index + 1}`} aria-haspopup="menu" aria-expanded={menu?.of === index} onClick={(e) => toggleMenu(index, e.currentTarget)}>
                <IconMore width={14} height={14} />
              </button>
              {menu?.of === index && <SlideMenu index={index} count={slides.length} at={menu.at} onClose={closeMenu} />}
            </div>
          )
        })}
        <div className="slide-thumb">
          <button
            type="button"
            className={room ? 'slide-add' : 'slide-add full'}
            aria-label="Dodaj slajd"
            aria-haspopup="menu"
            aria-expanded={menu?.of === 'add'}
            style={thumb}
            onClick={(e) => (room ? toggleMenu('add', e.currentTarget) : showToast(LIMIT_MESSAGE))}
          >
            <IconPlus width={18} height={18} />
          </button>
          {menu?.of === 'add' && <AddMenu at={menu.at} onClose={closeMenu} />}
        </div>
      </div>
    </div>
  )
}
