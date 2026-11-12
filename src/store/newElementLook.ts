import { FONTS_AND_EFFECTS, appliedTemplate, isStickerPiece, withTemplate } from './slices/templatesSlice'
import type { StyleTemplate, TextNode, Waypoint } from '../types'
import type { AppState } from './types'

const templateForNew = (s: AppState): StyleTemplate | undefined => (s.styleNewElements ? appliedTemplate(s) : undefined)

export function styledText(s: AppState, node: TextNode): TextNode {
  const template = templateForNew(s)
  const styled = (template && withTemplate({ ...s, texts: [node] }, template, FONTS_AND_EFFECTS).texts?.[0]) || node
  if (!isStickerPiece(styled)) return { ...styled, color: s.titleStyle.color }
  if (!template || !s.sticker || styled.icon) return styled
  return { ...styled, color: s.sticker.color, ...(styled.badge ? { badge: { ...styled.badge, color: s.sticker.color } } : null) }
}

export function styledWaypoint(s: AppState, node: Waypoint): Waypoint {
  const template = templateForNew(s)
  const styled = (template && withTemplate({ ...s, waypoints: [node] }, template, FONTS_AND_EFFECTS).waypoints?.[0]) || node
  return { ...styled, color: s.statsStyle.color }
}
