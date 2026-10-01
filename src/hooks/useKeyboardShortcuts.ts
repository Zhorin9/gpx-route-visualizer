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
