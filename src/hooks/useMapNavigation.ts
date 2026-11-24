import type Konva from 'konva'
import { useAppStore } from '../store/useAppStore'
import { useHasRoute } from '../store/selectors'
import { zoomedAround } from '../core/route/view'
import { fromBox, type ContentBox } from '../utils/wrappers/box'

const WHEEL_ZOOM_RATE = 0.002

export function useMapNavigable(): boolean {
  const mapShown = useAppStore((s) => s.collage.bgKind === 'map')
  return useHasRoute() && mapShown
}

export default function useMapNavigation(previewScale: number, box: ContentBox | null, w: number, h: number) {
  const navigable = useMapNavigable()
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const inRouteSpace = (x: number, y: number) => (box ? fromBox(box, w, h, x, y) : { x, y })

  function zoomAtPointer(e: Konva.KonvaEventObject<WheelEvent>) {
    const pointer = e.target.getStage()?.getPointerPosition()
    if (!navigable || e.evt.defaultPrevented || !pointer) return
    e.evt.preventDefault()
    const at = inRouteSpace(pointer.x / previewScale, pointer.y / previewScale)
    setRouteTransform(zoomedAround(useAppStore.getState().routeTransform, at, Math.exp(-e.evt.deltaY * WHEEL_ZOOM_RATE)))
  }

  function startPan(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage()
    if (!navigable || e.target !== stage || e.evt.button !== 0 || useAppStore.getState().addingWaypoint) return
    const start = useAppStore.getState().routeTransform
    const from = inRouteSpace(0, 0)
    const { clientX, clientY } = e.evt
    stage.container().classList.add('is-panning')
    const move = (m: MouseEvent) => {
      const to = inRouteSpace((m.clientX - clientX) / previewScale, (m.clientY - clientY) / previewScale)
      setRouteTransform({ ...start, x: start.x + to.x - from.x, y: start.y + to.y - from.y })
    }
    const end = () => {
      stage.container().classList.remove('is-panning')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
  }

  return { navigable, zoomAtPointer, startPan }
}
