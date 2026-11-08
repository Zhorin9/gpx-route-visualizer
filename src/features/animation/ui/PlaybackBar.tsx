import { useTranslation } from 'react-i18next'
import { useCanAnimate } from '../hooks'
import { useAppStore } from '../../../store/useAppStore'
import { selectDuration } from '../model/timeline'
import { usePlayback } from '../playback'
import { formatTime } from './formatTime'
import './PlaybackBar.css'

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
    </svg>
  )
}

export default function PlaybackBar() {
  const { t: tr } = useTranslation()
  const canAnimate = useCanAnimate()
  const settings = useAppStore((s) => s.animation)
  const exporting = useAppStore((s) => s.exporting)
  const total = useAppStore(selectDuration)
  const { t, playing, previewing, play, pause, stop, seek } = usePlayback()
  if (!canAnimate || !settings.enabled) return null

  return (
    <div className="playback-bar" role="group" aria-label={tr('animation.playback.group')}>
      <button type="button" className="playback-play" onClick={playing ? pause : play} disabled={exporting} aria-label={playing ? tr('animation.playback.pause') : tr('animation.playback.play')}>
        <PlayIcon playing={playing} />
      </button>
      <input
        type="range"
        className="playback-slider"
        aria-label={tr('animation.playback.time')}
        aria-valuetext={formatTime(t)}
        min={0}
        max={total}
        step={0.01}
        value={Math.min(t, total)}
        disabled={exporting}
        onChange={(e) => {
          pause()
          seek(Number(e.target.value))
        }}
      />
      <span className="playback-time">
        {formatTime(Math.min(t, total))} / {formatTime(total)}
      </span>
      {previewing && !exporting && (
        <button type="button" className="link-btn" onClick={stop}>
          {tr('animation.playback.backToEditing')}
        </button>
      )}
    </div>
  )
}
