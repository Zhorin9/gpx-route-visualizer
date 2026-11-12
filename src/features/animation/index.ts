import { provideAnimation } from '../../core/animation/layers'
import { addCanvasControls } from '../../core/canvas/chrome'
import { provideFrameClock } from '../../core/export/frameSource'
import { registerPanelSection } from '../../core/panel/registry'
import { addRouteDecoration, provideRouteHead } from '../../core/route/providers'
import { useReportCommit, waitForCommit } from './canvas/commitState'
import { stopPreviewOnEdit } from './editStopsPreview'
import RouteHeadMarker from './canvas/RouteHeadMarker'
import { useAnimatedLayer, useAnimatedPhoto, useAnimatedPoint, useAnimationGhost, useAnimationHead, useCountingHead, useTypedText } from './hooks'
import { AnimationTimingSection } from './panel/AnimationPanel'
import MarkerSection from './panel/MarkerSection'
import { usePlayback } from './playback'
import PlaybackBar from './ui/PlaybackBar'

export function registerAnimation() {
  provideRouteHead(useAnimationHead)
  provideAnimation({ layer: useAnimatedLayer, point: useAnimatedPoint, photo: useAnimatedPhoto, countHead: useCountingHead, ghost: useAnimationGhost, typed: useTypedText, reportCommit: useReportCommit })
  addRouteDecoration(RouteHeadMarker)
  addCanvasControls(PlaybackBar)
  registerPanelSection({ id: 'animation', label: 'animation.timeline.title', tab: 'animation', order: 10, Component: AnimationTimingSection })
  registerPanelSection({ id: 'marker', label: 'animation.panel.markerSection', tab: 'animation', modes: ['map'], order: 12, Component: MarkerSection })
  stopPreviewOnEdit()

  // Video export moves the clock frame by frame and waits until each moment is on the frame.
  let before: { t: number; previewing: boolean; playing: boolean } | null = null
  provideFrameClock({
    hold: async () => {
      const playback = usePlayback.getState()
      before = { t: playback.t, previewing: playback.previewing, playing: playback.playing }
      playback.pause()
      usePlayback.setState({ previewing: false })
      await waitForCommit((c) => !c.previewing)
    },
    seek: async (t) => {
      usePlayback.setState({ t, previewing: true })
      await waitForCommit((c) => c.previewing && c.t === t)
    },
    // A playing preview carries on playing rather than staying paused where the export started.
    release: () => {
      if (!before) return
      const { t, previewing, playing } = before
      before = null
      usePlayback.setState({ t, previewing })
      if (playing) usePlayback.getState().play()
    },
  })
}
