import { provideAnimation } from '../../core/animation/layers'
import { addCanvasControls } from '../../core/canvas/chrome'
import { provideFrameClock } from '../../core/export/frameSource'
import { registerPanelSection } from '../../core/panel/registry'
import { addRouteDecoration, provideRouteHead } from '../../core/route/providers'
import CommitProbe from './canvas/CommitProbe'
import { waitForCommit } from './canvas/commitState'
import { stopPreviewOnEdit } from './editStopsPreview'
import RouteHeadMarker from './canvas/RouteHeadMarker'
import { useAnimatedLayer, useAnimatedPhoto, useAnimatedPoint, useAnimationGhost, useAnimationHead, useCountingHead } from './hooks'
import { AnimationTimingSection } from './panel/AnimationPanel'
import { usePlayback } from './playback'
import PlaybackBar from './ui/PlaybackBar'
import { BUILT_IN_VEHICLES, registerVehicle } from './vehicles'

export function registerAnimation() {
  provideRouteHead(useAnimationHead)
  provideAnimation({ layer: useAnimatedLayer, point: useAnimatedPoint, photo: useAnimatedPhoto, countHead: useCountingHead, ghost: useAnimationGhost })
  for (const vehicle of BUILT_IN_VEHICLES) registerVehicle(vehicle)
  addRouteDecoration(RouteHeadMarker)
  addRouteDecoration(CommitProbe)
  addCanvasControls(PlaybackBar)
  registerPanelSection({ id: 'animation', label: 'Animacja', tab: 'export', order: 10, Component: AnimationTimingSection })
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
    // Back to what the editor showed: a playing preview carries on playing, it isn't left
    // paused on whatever frame was on screen when the export started.
    release: () => {
      if (!before) return
      const { t, previewing, playing } = before
      before = null
      usePlayback.setState({ t, previewing })
      if (playing) usePlayback.getState().play()
    },
  })
}
