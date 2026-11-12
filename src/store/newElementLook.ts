import { BUILT_IN_TEMPLATES } from '../utils/templates'
import type { StyleTemplate, TextNode, Waypoint } from '../types'
import type { AppState } from './types'

type LookSource = Pick<AppState, 'texts' | 'waypoints' | 'titleStyle' | 'statsStyle' | 'sticker' | 'templateId' | 'customTemplates'>

// A badge, an icon or a bent caption carries its own outline and shadow, which a style's text effects leave alone.
export const isStickerPiece = (t: TextNode) => t.role !== 'title' && Boolean(t.badge || t.icon || t.warp)

const appliedTemplate = (s: LookSource): StyleTemplate | undefined =>
  s.templateId ? [...BUILT_IN_TEMPLATES, ...s.customTemplates].find((t) => t.id === s.templateId) : undefined

function textEffectsOf(source: TextNode | undefined, template: StyleTemplate | undefined): Partial<TextNode> {
  if (source) {
    const { outlineEnabled, outlineColor, outlineWidth, shadowEnabled, hardShadow, typing } = source
    return { outlineEnabled, outlineColor, outlineWidth, shadowEnabled, hardShadow, typing }
  }
  const effect = template?.titleEffect
  if (!effect) return {}
  return { outlineEnabled: !!effect.outline, ...(effect.outline ? { outlineColor: effect.outline.color, outlineWidth: effect.outline.width } : null), hardShadow: effect.hardShadow, typing: effect.typing }
}

export function styledText(s: LookSource, node: TextNode): TextNode {
  const template = appliedTemplate(s)
  const source = s.texts.find((t) => !isStickerPiece(t) && t.role !== 'title') ?? s.texts.find((t) => t.role === 'title')
  const fonts = { fontFamily: source?.fontFamily ?? template?.fonts.title ?? node.fontFamily, italic: source?.italic ?? template?.titleItalic ?? node.italic }
  if (!isStickerPiece(node)) return { ...node, ...fonts, color: source?.color ?? s.titleStyle.color, ...textEffectsOf(source, template) }
  if (!s.sticker || node.icon) return { ...node, ...fonts }
  return { ...node, ...fonts, color: s.sticker.color, ...(node.badge ? { badge: { ...node.badge, color: s.sticker.color } } : null) }
}

export function styledWaypoint(s: LookSource, node: Waypoint): Waypoint {
  const source = s.waypoints.at(-1)
  return {
    ...node,
    fontFamily: source?.fontFamily ?? appliedTemplate(s)?.fonts.note ?? node.fontFamily,
    color: source?.color ?? s.statsStyle.color,
    ...(source?.shadowEnabled === undefined ? null : { shadowEnabled: source.shadowEnabled }),
  }
}
