import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../../core/formats/registry'
import type { StyleTemplate } from '../../types'

const ROUTE_PATH = 'M12 86C20 60 34 70 40 50S62 42 68 26S86 18 90 12'

function thumbBackground({ gradient, textColor }: StyleTemplate) {
  const base = `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`
  const ink = (share: number) => `color-mix(in srgb, ${textColor} ${share}%, transparent)`
  if (gradient.pattern === 'grid') return `linear-gradient(${ink(10)} 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, ${ink(10)} 1px, transparent 1px) 0 0/14px 14px, ${base}`
  if (gradient.pattern === 'contours') return `repeating-radial-gradient(circle at 30% 70%, transparent 0 11px, ${ink(14)} 11px 12px), ${base}`
  return base
}

// The template's background, its name in the title colour and its route, in the open format.
export default function TemplateThumb({ template }: { template: StyleTemplate }) {
  const { w, h } = useAppStore((s) => FORMATS[s.aspectKey])
  const { route, textColor } = template
  const casing = route.casing
  return (
    <span className="template-thumb" style={{ background: thumbBackground(template), aspectRatio: `${w} / ${h}` }}>
      <span className="template-thumb-name" style={{ color: template.titleColor ?? textColor, fontFamily: `'${template.fonts.title}', serif` }}>
        {template.name.split(' ')[0]}
      </span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {casing?.dx ? <path d={ROUTE_PATH} stroke={casing.color} strokeWidth={7} transform="translate(1.5 1.5)" vectorEffect="non-scaling-stroke" /> : null}
        {casing && <path d={ROUTE_PATH} stroke={casing.color} strokeWidth={7} vectorEffect="non-scaling-stroke" />}
        <path d={ROUTE_PATH} stroke={route.color ?? textColor} strokeWidth={4} strokeDasharray={route.dotted ? '0.1 6' : route.dashed ? '5 4' : undefined} vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
