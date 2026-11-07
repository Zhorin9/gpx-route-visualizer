import { STICKER_COLORS, STICKER_INK } from '../utils/sticker'
import type { TextNode } from '../types'

export type TextKind = 'text' | 'icon' | 'badge' | 'arc'

const PINK = STICKER_COLORS[0].hex
const INK_OUTLINE = { outlineEnabled: true, outlineColor: STICKER_INK, outlineWidth: 4, shadowEnabled: false }

// What a new element of each kind starts as, over a plain text placed at `at`; `ink` is the design's text colour.
// An icon's x is its centre, so it moves over; a badge starts lower and an arc higher, so they don't land on each other.
export const TEXT_KINDS: Record<TextKind, (ink: string, at: { x: number; y: number }) => Partial<TextNode>> = {
  text: () => ({}),
  icon: (ink, at) => ({ icon: 'star', text: '', fontSize: 120, x: at.x + 120, color: ink }),
  badge: (_, at) => ({ text: 'ULUBIONE', uppercase: true, fontSize: 72, color: PINK, badge: { shape: 'burst', color: PINK }, y: at.y + 220, ...INK_OUTLINE }),
  arc: (_, at) => ({ text: 'ROWER & APARAT', uppercase: true, fontSize: 64, color: PINK, warp: { kind: 'arc', amount: 40 }, y: at.y - 260, ...INK_OUTLINE }),
}
