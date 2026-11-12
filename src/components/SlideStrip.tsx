import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { IconChevron, IconMore, IconPlus } from './icons'
import { useActiveSlide } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import useDismiss from '../hooks/useDismiss'
import { FORMATS } from '../core/formats/registry'
import { layoutDef, slotCount } from '../utils/layouts'
import LayoutCells from './LayoutCells'
import { drawDataSlide } from '../utils/drawSlide'
import { LIMIT_MESSAGE, kindBlocker, roomForSlide, slideLabel, slideNumbers } from '../utils/series'
import useSlideScene from '../hooks/useSlideScene'
import type { Slide, SlideKind } from '../types'
import type { TKey } from '../i18n'
import './SlideStrip.css'

const THUMB_H = 72
const RAIL_THUMB_W = 64
const SLIDE_DRAG_TYPE = 'application/x-slide'
const HINT_SEEN_KEY = 'gpx.slideStripHint'

const ADD_KINDS: { kind: SlideKind | 'collage'; label: TKey }[] = [
  { kind: 'photos', label: 'slideStrip.emptyPhoto' },
  { kind: 'collage', label: 'slideStrip.collage' },
  { kind: 'profile', label: 'slideStrip.profile' },
  { kind: 'summary', label: 'slideStrip.summary' },
]

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
  return <LayoutCells def={layoutDef(slide.layoutKey)} slide={slide} photos={new Map(photos.map((p) => [p.id, p]))} width={width} height={height} margin={0} />
}

function SlideMenu({ index, count, at, onClose }: { index: number; count: number; at: CSSProperties; onClose: () => void }) {
  const slide = useAppStore((s) => s.slides[index])
  const duplicateSlide = useAppStore((s) => s.duplicateSlide)
  const moveSlide = useAppStore((s) => s.moveSlide)
  const toggleSkipSlide = useAppStore((s) => s.toggleSkipSlide)
  const removeSlide = useAppStore((s) => s.removeSlide)
  const { t } = useTranslation()
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
      {item(t('slideStrip.duplicate'), () => duplicateSlide(index), { hint: 'Ctrl+D' })}
      {item(t('slideStrip.moveToStart'), () => moveSlide(index, 1), { disabled: first || index === 1 })}
      {item(t('slideStrip.moveToEnd'), () => moveSlide(index, count - 1), { disabled: first || index === count - 1 })}
      {item(slide?.skipped ? t('slideStrip.restoreToExport') : t('slideStrip.skipInExport'), () => toggleSkipSlide(index), { disabled: first })}
      {item(t('slideStrip.remove'), () => removeSlide(index), { hint: 'Del', disabled: first, danger: true })}
    </div>
  )
}

function AddMenu({ at, onClose }: { at: CSSProperties; onClose: () => void }) {
  const addSeriesSlide = useAppStore((s) => s.addSeriesSlide)
  const importPhotoSlides = useAppStore((s) => s.importPhotoSlides)
  const { route } = useSlideScene()
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useDismiss(true, ref, onClose)
  return (
    <div className="slide-menu" role="menu" ref={ref} style={at}>
      <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}>
        {t('slideStrip.photos')}
        <span className="text-muted">{t('slideStrip.slideEach')}</span>
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
            {t(label)}
            {blocker && <span className="text-muted">{blocker}</span>}
          </button>
        )
      })}
    </div>
  )
}

function useFirstUseHint(slideCount: number) {
  const showToast = useAppStore((s) => s.showToast)
  const { t } = useTranslation()
  useEffect(() => {
    if (slideCount < 2) return
    try {
      if (localStorage.getItem(HINT_SEEN_KEY)) return
      localStorage.setItem(HINT_SEEN_KEY, '1')
    } catch {
      return
    }
    showToast(t('slideStrip.reorderHint'))
  }, [slideCount, showToast, t])
}

export default function SlideStrip({ vertical }: { vertical: boolean }) {
  const slides = useAppStore((s) => s.slides)
  const mode = useAppStore((s) => s.mode)
  const { w, h } = FORMATS[useAppStore((s) => s.aspectKey)]
  const setActiveSlide = useAppStore((s) => s.setActiveSlide)
  const moveSlide = useAppStore((s) => s.moveSlide)
  const showToast = useAppStore((s) => s.showToast)
  const activeSlide = useActiveSlide()
  const { t } = useTranslation()
  const [menu, setMenu] = useState<{ of: number | 'add'; at: CSSProperties } | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [railHidden, setRailHidden] = useState(false)
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

  const railToggle = vertical && (
    <button
      type="button"
      className="slide-rail-toggle"
      aria-expanded={!railHidden}
      aria-label={t(railHidden ? 'slideStrip.showSlides' : 'slideStrip.hideSlides')}
      title={t(railHidden ? 'slideStrip.showSlides' : 'slideStrip.hideSlides')}
      onClick={() => setRailHidden(!railHidden)}
    >
      <IconChevron className={railHidden ? 'rail-chevron hidden-rail' : 'rail-chevron'} />
    </button>
  )

  if (vertical && railHidden) {
    return (
      <div className="slide-strip vertical collapsed" role="group" aria-label={t('slideStrip.seriesSlides')}>
        {railToggle}
        <span className="slide-rail-count">{slides.length}</span>
      </div>
    )
  }

  return (
    <div className={vertical ? 'slide-strip vertical' : 'slide-strip'} role="group" aria-label={t('slideStrip.seriesSlides')}>
      {railToggle}
      <div className="slide-strip-list">
        {slides.map((slide, index) => {
          const n = numbers[index]
          const classes = ['slide-thumb', index === activeSlide && 'active', slide.skipped && 'skipped', dropAt === index && 'drop-before', dropAt === index + 1 && index === slides.length - 1 && 'drop-after']
          return (
            <div
              key={index}
              className={classes.filter(Boolean).join(' ')}
              draggable={index > 0}
              title={index > 0 ? t('slideStrip.dragToReorder') : undefined}
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
                aria-label={`${n == null ? t('slideStrip.skippedSlide') : t('slideStrip.slide', { n })}: ${slideLabel(slide, index, mode)}`}
                onClick={() => setActiveSlide(index)}
              >
                <span className="slide-thumb-frame" style={thumb}>
                  {slotCount(slide) ? <PhotoThumb slide={slide} {...thumb} /> : <DataThumb slide={slide} {...thumb} />}
                  <span className="slide-thumb-number">{n ?? '—'}</span>
                </span>
                <span className="slide-thumb-label">{slideLabel(slide, index, mode)}</span>
              </button>
              <button type="button" className="slide-thumb-more" aria-label={t('slideStrip.more', { n: index + 1 })} aria-haspopup="menu" aria-expanded={menu?.of === index} onClick={(e) => toggleMenu(index, e.currentTarget)}>
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
            aria-label={t('slideStrip.addSlide')}
            aria-haspopup="menu"
            aria-expanded={menu?.of === 'add'}
            style={thumb}
            onClick={(e) => (room ? toggleMenu('add', e.currentTarget) : showToast(t(LIMIT_MESSAGE)))}
          >
            <IconPlus width={18} height={18} />
          </button>
          {menu?.of === 'add' && <AddMenu at={menu.at} onClose={closeMenu} />}
        </div>
      </div>
    </div>
  )
}
