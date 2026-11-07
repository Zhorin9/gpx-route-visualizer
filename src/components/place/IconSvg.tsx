import { ICON_GRID, ICON_STROKE, iconById, type IconId } from './icons'

// The panel's version: a plain line in the text colour.
export default function IconSvg({ icon, size = 16 }: { icon: IconId; size?: number }) {
  const def = iconById(icon)
  if (!def) return null
  return (
    <svg viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`} width={size} height={size} fill="none" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d={def.fill} />
      <path d={def.line} />
    </svg>
  )
}
