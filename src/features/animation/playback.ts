import { create } from 'zustand'
import { useAppStore } from '../../store/useAppStore'
import { totalDuration } from './model/timeline'

// The animation's clock. Not part of the document: playing never adds an undo step
// and nothing of it is saved.
export interface PlaybackState {
  t: number
  playing: boolean
  // The frame shows the animation at `t` (playing, paused or scrubbed);
  // false = the ordinary static editor view.
  previewing: boolean
  play: () => void
  pause: () => void
  // Back to the static view.
  stop: () => void
  seek: (t: number) => void
}

let frame = 0
let lastTick = 0

const duration = () => totalDuration(useAppStore.getState().animation)

function tick(now: number) {
  const s = usePlayback.getState()
  if (!s.playing) return
  const dt = (now - lastTick) / 1000
  lastTick = now
  const total = duration()
  let t = s.t + dt
  if (t >= total) {
    if (useAppStore.getState().animation.loop) t = t % total
    else {
      usePlayback.setState({ t: total, playing: false })
      return
    }
  }
  usePlayback.setState({ t })
  frame = requestAnimationFrame(tick)
}

export const usePlayback = create<PlaybackState>()((set, get) => ({
  t: 0,
  playing: false,
  previewing: false,
  play: () => {
    if (get().playing) return
    const total = duration()
    // Played to the end without looping: start over.
    const t = get().t >= total ? 0 : get().t
    set({ playing: true, previewing: true, t })
    lastTick = performance.now()
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(tick)
  },
  pause: () => {
    cancelAnimationFrame(frame)
    set({ playing: false })
  },
  stop: () => {
    cancelAnimationFrame(frame)
    set({ playing: false, previewing: false, t: 0 })
  },
  seek: (t) => {
    set({ t: Math.max(0, Math.min(duration(), t)), previewing: true })
  },
}))
