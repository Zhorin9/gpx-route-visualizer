import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../../core/formats/registry'
import type { StyleTemplate } from '../../types'

const ROUTE_PATH = 'M8 90 C14 60 32 70 38 46 S60 38 66 22 S86 14 92 8'
// Route widths are set for a 1080 px frame; the card is a fifth of that.
const THUMB_SCALE = 0.45

function thumbBackground({ gradient, textColor }: StyleTemplate) {
  const base = `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`
  const ink = (share: number) => `color-mix(in srgb, ${textColor} ${share}%, transparent)`
  if (gradient.pattern === 'grid') return `linear-gradient(${ink(10)} 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, ${ink(10)} 1px, transparent 1px) 0 0/14px 14px, ${base}`
  if (gradient.pattern === 'contours') return `repeating-radial-gradient(circle at 30% 70%, transparent 0 11px, ${ink(14)} 11px 12px), ${base}`
  return base
}

export default function TemplateThumb({ template }: { template: StyleTemplate }) {
  const { w, h } = useAppStore((s) => FORMATS[s.aspectKey])
  const { route, textColor, fonts } = template
  const color = route.color ?? textColor
  const marker = template.pointStyle?.marker
  const width = (w = 0) => Math.max(1, w * THUMB_SCALE)
  return (
    <span className={w > h ? 'template-thumb landscape' : 'template-thumb'} style={{ background: thumbBackground(template), color: textColor, aspectRatio: `${w} / ${h}` }}>
      {template.frame.enabled && <span className="template-thumb-frame" style={{ borderColor: template.frame.color }} />}
      <span className="template-thumb-title" style={{ fontFamily: `'${fonts.title}', serif`, color: template.titleColor ?? textColor, fontStyle: template.titleItalic ? 'italic' : 'normal' }}>
        {template.titleUppercase ? 'SARDYNIA' : 'Sardynia'}
      </span>
      <span className="template-thumb-sub" style={{ fontFamily: `'${fonts.data}', serif` }}>
        3 dni · 148 km
      </span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {route.glowEnabled && (
          <path
            d={ROUTE_PATH}
            stroke={route.glowColor ?? color}
            strokeWidth={width(route.glowWidth)}
            opacity={route.glowOpacity}
            style={route.glowBlur ? { filter: `blur(${route.glowBlur * 0.25}px)` } : undefined}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={ROUTE_PATH} stroke={color} strokeWidth={width(route.coreWidth)} strokeDasharray={route.dotted ? '0.1 6' : route.dashed ? '5 4' : undefined} vectorEffect="non-scaling-stroke" />
      </svg>
      {marker && (
        <span className={`template-thumb-photo marker-${marker}`} style={{ borderColor: marker === 'film' ? textColor : color }}>
          {marker === 'label' ? <span style={{ borderColor: textColor }}>Monte Tuttavista</span> : <span className="template-thumb-image" />}
        </span>
      )}
    </span>
  )
}
