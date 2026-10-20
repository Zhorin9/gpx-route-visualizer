import { provideAnimation } from '../../core/animation/layers'
import { addCanvasControls } from '../../core/canvas/chrome'
import { provideFrameClock } from '../../core/export/frameSource'
import { registerPanelSection } from '../../core/panel/registry'
import { addRouteDecoration, provideRouteHead } from '../../core/route/providers'
import CommitProbe from './canvas/CommitProbe'
import { waitForCommit } from './canvas/commitState'
import RouteHeadDot from './canvas/RouteHeadDot'
import { useAnimatedLayer, useAnimatedPoint, useAnimationGhost, useAnimationHead, useCountingHead } from './hooks'
import { AnimationTimingSection } from './panel/AnimationPanel'
import { usePlayback } from './playback'
import PlaybackBar from './ui/PlaybackBar'

export function registerAnimation() {
  provideRouteHead(useAnimationHead)
  provideAnimation({ layer: useAnimatedLayer, point: useAnimatedPoint, countHead: useCountingHead, ghost: useAnimationGhost })
  addRouteDecoration(RouteHeadDot)
  addRouteDecoration(CommitProbe)
  addCanvasControls(PlaybackBar)
  registerPanelSection({ id: 'animation', tab: 'animation', order: 10, Component: AnimationTimingSection })

  // Video export moves the clock frame by frame and waits until each moment is on the frame.
  let before: { t: number; previewing: boolean } | null = null
  provideFrameClock({
    hold: async () => {
      const playback = usePlayback.getState()
      before = { t: playback.t, previewing: playback.previewing }
      playback.pause()
      usePlayback.setState({ previewing: false })
      await waitForCommit((c) => !c.previewing)
    },
    seek: async (t) => {
      usePlayback.setState({ t, previewing: true })
      await waitForCommit((c) => c.previewing && c.t === t)
    },
    release: () => {
      if (!before) return
      usePlayback.setState(before)
      before = null
    },
  })
}
