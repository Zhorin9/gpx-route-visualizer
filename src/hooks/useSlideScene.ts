import { FORMATS } from '../core/formats/registry'
import { selectTrack } from '../store/derived'
import { useDayBreaks, useRangeStats, useTrackDays } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { projectLook, seriesRoute } from '../utils/series'
import type { SlideScene } from '../utils/drawSlide'

// What slides drawn from data need: the route, its figures, the project's look and the photos.
export default function useSlideScene(): Omit<SlideScene, 'look'> & { projectLook: SlideScene['look'] } {
  const { w, h } = FORMATS[useAppStore((s) => s.aspectKey)]
  const slides = useAppStore((s) => s.slides)
  const photos = useAppStore((s) => s.photos)
  const units = useAppStore((s) => s.statsContent.units)
  const collage = useAppStore((s) => s.collage)
  const titleStyle = useAppStore((s) => s.titleStyle)
  const routeStyle = useAppStore((s) => s.routeStyle)
  const statsStyle = useAppStore((s) => s.statsStyle)
  const route = seriesRoute(useAppStore((s) => selectTrack(s)?.points ?? null), useDayBreaks())
  const stats = useRangeStats()
  const days = useTrackDays().length
  useAppStore((s) => s.fontsVersion)
  return {
    w,
    h,
    slides,
    photos: new Map(photos.map((p) => [p.id, p])),
    units,
    route,
    movingMs: stats?.movingMs ?? null,
    durationMs: stats?.durationMs ?? null,
    gainM: stats?.elevationGainM ?? null,
    days,
    projectLook: projectLook({ collage, titleStyle, routeStyle, statsStyle }),
  }
}
