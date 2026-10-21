import { useProjectedTrack, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { routeGeometry, type RouteGeometry } from './geometry'
import { useRouteHead } from './providers'
import { selectRouteDays } from '../../store/derived'

export function useRouteGeometry(): RouteGeometry {
  const projected = useProjectedTrack()
  const cum = useTrackCumKm()
  const range = useAppStore((s) => s.range)
  const progress = useAppStore((s) => s.progress)
  const days = useAppStore(selectRouteDays)
  const shape = useAppStore((s) => s.routeStyle.shape)
  const simplify = useAppStore((s) => s.routeStyle.schematicSimplify)
  const head = useRouteHead()
  return routeGeometry(projected, cum, range, progress, days, shape, simplify, head)
}
