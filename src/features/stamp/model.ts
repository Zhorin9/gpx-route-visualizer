import { selectTrack } from '../../store/derived'

const pad = (n: number) => String(n).padStart(2, '0')

// "12.08 · 06:42": the day and the start time, as a camera stamps a frame.
export function stampText(epochMs: number): string {
  const d = new Date(epochMs)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const STAMP_KIND = 'stamp'

export const selectStartTime = (s: Parameters<typeof selectTrack>[0]) => selectTrack(s)?.points.find((p) => p.time != null)?.time ?? null
