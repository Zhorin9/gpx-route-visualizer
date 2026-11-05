import { create } from 'zustand'
import { useAppStore } from '../../store/useAppStore'
import { selectDuration } from './model/timeline'
import { clamp } from '../../utils/math'

// Not part of the document: playing adds no undo step and nothing of it is saved.
export interface PlaybackState {
  t: number
  playing: boolean
  // false: the static editor view.
  previewing: boolean
  play: () => void
  pause: () => void
  stop: () => void
  seek: (t: number) => void
}

let frame = 0
let lastTick = 0

const duration = () => selectDuration(useAppStore.getState())

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
    set({ t: clamp(t, 0, duration()), previewing: true })
  },
}))
