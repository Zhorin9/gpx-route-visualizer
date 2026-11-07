import { FORMATS } from '../core/formats/registry'
import { selectSeed, selectTrack } from '../store/derived'
import { withPhotoLook } from '../utils/photoLook'
import { useDayBreaks, useRangeStats, useTrackDays } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { projectLook, seriesRoute } from '../utils/series'
import type { SlideScene } from '../utils/drawSlide'
import useSettled from './useSettled'

export default function useSlideScene(): Omit<SlideScene, 'look'> & { projectLook: SlideScene['look'] } {
  const { w, h } = FORMATS[useAppStore((s) => s.aspectKey)]
  const slides = useAppStore((s) => s.slides)
  const photos = useAppStore((s) => s.photos)
  const photoLook = useSettled(useAppStore((s) => s.photoLook))
  const seed = useAppStore(selectSeed)
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
    // Data slides lay the same film look on a photo behind them.
    photos: new Map(photos.map((p) => [p.id, { ...p, image: withPhotoLook(p.image, photoLook, seed) }])),
    units,
    route,
    movingMs: stats?.movingMs ?? null,
    durationMs: stats?.durationMs ?? null,
    gainM: stats?.elevationGainM ?? null,
    days,
    projectLook: projectLook({ collage, titleStyle, routeStyle, statsStyle }),
  }
}
