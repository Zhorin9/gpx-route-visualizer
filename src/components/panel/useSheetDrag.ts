import { useRef, type PointerEvent, type RefObject } from 'react'

export type SheetState = 'collapsed' | 'half' | 'full'

const HALF_SHARE = 0.58
const CANVAS_LEFT_WHEN_FULL = 120
const TAP_SLOP = 6

function snapHeights(panel: HTMLElement): Record<SheetState, number> {
  const app = panel.parentElement?.clientHeight ?? window.innerHeight
  const chrome = [...panel.children].filter((child) => !child.classList.contains('tab-panel')).reduce((sum, child) => sum + (child as HTMLElement).offsetHeight, 2)
  return { collapsed: chrome, half: app * HALF_SHARE, full: app - CANVAS_LEFT_WHEN_FULL }
}

function nearest(heights: Record<SheetState, number>, height: number): SheetState {
  return (Object.keys(heights) as SheetState[]).reduce((best, state) => (Math.abs(heights[state] - height) < Math.abs(heights[best] - height) ? state : best))
}

export default function useSheetDrag(panelRef: RefObject<HTMLElement | null>, state: SheetState, setState: (state: SheetState) => void) {
  const drag = useRef<{ startY: number; startHeight: number; height: number; moved: boolean; frame: number } | null>(null)
  const suppressClick = useRef(false)

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    const panel = panelRef.current
    if (!panel) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startHeight: panel.offsetHeight, height: panel.offsetHeight, moved: false, frame: 0 }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const current = drag.current
    const panel = panelRef.current
    if (!current || !panel) return
    const delta = current.startY - e.clientY
    if (!current.moved && Math.abs(delta) < TAP_SLOP) return
    if (!current.moved) {
      current.moved = true
      panel.classList.add('dragging')
      if (state === 'collapsed') setState('half')
    }
    const { collapsed, full } = snapHeights(panel)
    current.height = Math.min(full, Math.max(collapsed, current.startHeight + delta))
    cancelAnimationFrame(current.frame)
    current.frame = requestAnimationFrame(() => {
      panel.style.height = `${current.height}px`
    })
  }

  function onPointerEnd() {
    const current = drag.current
    const panel = panelRef.current
    drag.current = null
    if (!current?.moved || !panel) return
    suppressClick.current = true
    cancelAnimationFrame(current.frame)
    panel.classList.remove('dragging')
    panel.style.height = ''
    setState(nearest(snapHeights(panel), current.height))
  }

  function onClick() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setState(state === 'collapsed' ? 'half' : 'collapsed')
  }

  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onClick }
}
