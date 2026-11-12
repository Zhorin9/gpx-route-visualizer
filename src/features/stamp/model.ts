import { selectTrack } from '../../store/derived'

const pad = (n: number) => String(n).padStart(2, '0')

// "12.08 · 06:42": the day and the start time, as a camera stamps a frame.
export function stampText(epochMs: number): string {
  const d = new Date(epochMs)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toDateTimeInput(epochMs: number): string {
  const d = new Date(epochMs)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInput(value: string): number | null {
  const epochMs = new Date(value).getTime()
  return Number.isNaN(epochMs) ? null : epochMs
}

export const STAMP_KIND = 'stamp'

type State = Parameters<typeof selectTrack>[0] & { stampTime: number | null }

export const selectStartTime = (s: State) => selectTrack(s)?.points.find((p) => p.time != null)?.time ?? null

export const selectStampTime = (s: State) => s.stampTime ?? selectStartTime(s)
