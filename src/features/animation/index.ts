import { flushSync } from 'react-dom'
import { provideAnimation } from '../../core/animation/layers'
import { addCanvasControls } from '../../core/canvas/chrome'
import { provideFrameClock } from '../../core/export/frameSource'
import { registerPanelSection } from '../../core/panel/registry'
import { addRouteDecoration, provideRouteHead } from '../../core/route/providers'
import RouteHeadDot from './canvas/RouteHeadDot'
import { useAnimatedLayer, useAnimatedPoint, useAnimationGhost, useAnimationHead, useCountingHead } from './hooks'
import { AnimationTimingSection } from './panel/AnimationPanel'
import { usePlayback } from './playback'
import PlaybackBar from './ui/PlaybackBar'

export function registerAnimation() {
  provideRouteHead(useAnimationHead)
  provideAnimation({ layer: useAnimatedLayer, point: useAnimatedPoint, countHead: useCountingHead, ghost: useAnimationGhost })
  addRouteDecoration(RouteHeadDot)
  addCanvasControls(PlaybackBar)
  registerPanelSection({ id: 'animation', tab: 'animation', order: 10, Component: AnimationTimingSection })

  // Video export moves the clock frame by frame; flushSync draws the frame before it is captured.
  let before: { t: number; previewing: boolean } | null = null
  provideFrameClock({
    hold: () => {
      const playback = usePlayback.getState()
      before = { t: playback.t, previewing: playback.previewing }
      playback.pause()
      flushSync(() => usePlayback.setState({ previewing: false }))
    },
    seek: (t) => flushSync(() => usePlayback.setState({ t, previewing: true })),
    release: () => {
      if (!before) return
      usePlayback.setState(before)
      before = null
    },
  })
}
