import type { AspectKey, AspectOption } from '../types'

export const ASPECTS: Record<AspectKey, AspectOption> = {
  '9:16': { w: 1080, h: 1920, label: 'Story (9:16)' },
  '4:5': { w: 1080, h: 1350, label: 'Post (4:5)' },
  '1:1': { w: 1080, h: 1080, label: 'Kwadrat (1:1)' },
}

// Areas Instagram covers with its own UI on a Story (profile bar, reply box).
export const STORY_SAFE_ZONE = { top: 250, bottom: 340 }

export function defaultStatsY(aspectKey: AspectKey): number {
  return aspectKey === '9:16' ? STORY_SAFE_ZONE.top + 30 : 70
}

// 13% from the top, as on the template previews; on a Story, clear of the profile bar.
export function defaultTitleY(aspectKey: AspectKey): number {
  const y = Math.round(ASPECTS[aspectKey].h * 0.13)
  return aspectKey === '9:16' ? Math.max(y, STORY_SAFE_ZONE.top + 30) : y
}

// With a title, the stats header sits one line below it.
export function statsYBelowTitle(title: { y: number; fontSize: number }): number {
  return Math.round(title.y + title.fontSize * 1.3 + 16)
}
