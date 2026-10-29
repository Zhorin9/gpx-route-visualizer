import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

function isEditingField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

export default function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditingField(e.target)) return
      const s = useAppStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        s.redo()
        return
      }
      // In a series, with nothing selected on the frame: arrows walk the strip, Delete removes
      // the slide, Ctrl+D duplicates it.
      const series = s.carouselKind === 'slides' && s.slides.length > 1
      const slide = Math.min(s.activeSlide, s.slides.length - 1)
      if (series && !s.selection) {
        if (mod && key === 'd') {
          e.preventDefault()
          s.duplicateSlide(slide)
          return
        }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target as HTMLElement).closest?.('[role="tablist"], [role="radiogroup"], input')) {
          e.preventDefault()
          s.setActiveSlide(Math.max(0, Math.min(s.slides.length - 1, slide + (e.key === 'ArrowLeft' ? -1 : 1))))
          return
        }
        if (e.key === 'Delete' && slide > 0) {
          e.preventDefault()
          s.removeSlide(slide)
          return
        }
      }
      if (e.key === 'Escape') {
        if (s.addingWaypoint) s.setAddingWaypoint(false)
        else if (s.routeEditable) s.setRouteEditable(false)
        else s.select(null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.selection) {
        e.preventDefault()
        s.deleteSelection()
        return
      }
      const arrow = ARROWS[e.key]
      if (arrow && s.selection) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        s.nudgeSelection(arrow[0] * step, arrow[1] * step)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
