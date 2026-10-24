import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import type { AnimationTrackId } from '../../../core/animation/layers'
import { useAppStore } from '../../../store/useAppStore'
import { selectDuration } from '../model/timeline'
import { usePlayback } from '../playback'
import { TRACK_LABELS, tracksFor, type TrackClip } from '../types'
import { formatTime } from '../ui/formatTime'
import './TimelineEditor.css'

const SNAP_S = 0.1
const MIN_CLIP_S = 0.1
const snap = (v: number) => Math.round(v / SNAP_S) * SNAP_S

type DragMode = 'move' | 'resize'

function TimelineTrack({ track, scale }: { track: AnimationTrackId; scale: number }) {
  const clip = useAppStore((s) => s.animation.clips[track])
  const setClip = useAppStore((s) => s.setClip)
  const laneRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ mode: DragMode; x: number; clip: TrackClip; width: number } | null>(null)

  function begin(e: PointerEvent, mode: DragMode) {
    e.preventDefault()
    e.stopPropagation()
    const width = laneRef.current?.getBoundingClientRect().width ?? 1
    drag.current = { mode, x: e.clientX, clip, width }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function move(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    // The scale stays as it was when the drag began, so the bar doesn't run away from the pointer.
    const dt = ((e.clientX - d.x) / d.width) * scale
    if (d.mode === 'move') setClip(track, { ...d.clip, start: snap(Math.max(0, d.clip.start + dt)) })
    else setClip(track, { ...d.clip, duration: snap(Math.max(MIN_CLIP_S, d.clip.duration + dt)) })
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? SNAP_S : e.key === 'ArrowLeft' ? -SNAP_S : 0
    if (!step) return
    e.preventDefault()
    if (e.shiftKey) setClip(track, { ...clip, duration: snap(Math.max(MIN_CLIP_S, clip.duration + step)) })
    else setClip(track, { ...clip, start: snap(Math.max(0, clip.start + step)) })
  }

  const label = TRACK_LABELS[track]
  return (
    <div className="timeline-track">
      <span className="timeline-label">{label}</span>
      <div className="timeline-lane" ref={laneRef}>
        <div
          className={`timeline-clip timeline-clip-${track}`}
          style={{ left: `${(clip.start / scale) * 100}%`, width: `${(clip.duration / scale) * 100}%` }}
          role="slider"
          tabIndex={0}
          aria-label={`${label}: początek ${clip.start.toFixed(1)} s, długość ${clip.duration.toFixed(1)} s`}
          aria-valuemin={0}
          aria-valuemax={scale}
          aria-valuenow={clip.start}
          aria-valuetext={`od ${clip.start.toFixed(1)} s przez ${clip.duration.toFixed(1)} s`}
          title="Przeciągnij, aby przesunąć; uchwyt z prawej zmienia długość. Strzałki przesuwają, Shift+strzałki zmieniają długość."
          onPointerDown={(e) => begin(e, 'move')}
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
          onKeyDown={onKeyDown}
        >
          <span className="timeline-clip-text">{clip.duration.toFixed(1)} s</span>
          <span className="timeline-handle" onPointerDown={(e) => begin(e, 'resize')} onPointerMove={move} onPointerUp={() => (drag.current = null)} />
        </div>
      </div>
    </div>
  )
}

// One bar per kind of content the mode has: when it starts and how long it takes to appear.
export default function TimelineEditor() {
  const t = usePlayback((s) => s.t)
  const previewing = usePlayback((s) => s.previewing)
  const seek = usePlayback((s) => s.seek)
  const pause = usePlayback((s) => s.pause)
  const total = useAppStore(selectDuration)
  const tracks = tracksFor(useAppStore((s) => s.mode))
  // A little room after the end, so the last bar can still be stretched.
  const scale = Math.max(4, Math.ceil(total + 1))
  const ticks = Array.from({ length: Math.floor(scale / (scale > 20 ? 5 : scale > 8 ? 2 : 1)) + 1 }, (_, i) => i * (scale > 20 ? 5 : scale > 8 ? 2 : 1))

  function seekFromRuler(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    pause()
    seek(((e.clientX - r.left) / r.width) * scale)
  }

  return (
    <div className="timeline">
      <div className="timeline-track">
        <span className="timeline-label" />
        <div className="timeline-ruler" onPointerDown={seekFromRuler} title="Kliknij, aby przejść do tej chwili">
          {ticks.map((s) => (
            <span key={s} className="timeline-tick" style={{ left: `${(s / scale) * 100}%` }}>
              {s}s
            </span>
          ))}
          <span className="timeline-end" style={{ left: `${(total / scale) * 100}%` }} title={`Koniec: ${formatTime(total)}`} />
        </div>
      </div>
      {tracks.map((track) => (
        <TimelineTrack key={track} track={track} scale={scale} />
      ))}
      {previewing && <span className="timeline-playhead" style={{ left: `calc(var(--timeline-label) + (100% - var(--timeline-label)) * ${Math.min(t, scale) / scale})` }} />}
    </div>
  )
}
