import { useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import PhotoPaletteSection from './PhotoPaletteSection'
import WrapperSection from './WrapperSection'
import { IconClose } from '../icons'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../../core/formats/registry'
import { BUILT_IN_TEMPLATES } from '../../utils/templates'
import type { StyleTemplate, TemplateGroup, TemplateParts } from '../../types'
import './TemplatesTab.css'

const PART_LABELS: { key: keyof TemplateParts; label: string }[] = [
  { key: 'fonts', label: 'Czcionki' },
  { key: 'route', label: 'Kolor i styl trasy' },
  { key: 'frame', label: 'Ramka zdjęć' },
  { key: 'colors', label: 'Kolory kadru' },
  { key: 'layout', label: 'Układ zdjęć' },
  { key: 'points', label: 'Zdjęcia w punktach' },
]

// A collage has no route and no places to pin photos to.
const ROUTE_PARTS: (keyof TemplateParts)[] = ['route', 'points']

const GROUPS: { key: TemplateGroup | 'custom'; label: string }[] = [
  { key: 'basic', label: 'Podstawowe' },
  { key: 'natural', label: 'Naturalne' },
  { key: 'retro', label: 'Retro i papier' },
  { key: 'dark', label: 'Ciemne i graficzne' },
  { key: 'custom', label: 'Własne' },
]

const ROUTE_PATH = 'M8 90 C14 60 32 70 38 46 S60 38 66 22 S86 14 92 8'
// Route widths are set for a 1080 px frame; the card is a fifth of that.
const THUMB_SCALE = 0.45

// The background as CSS, with its pattern in the text colour.
function thumbBackground({ gradient, textColor }: StyleTemplate) {
  const base = `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`
  const ink = (share: number) => `color-mix(in srgb, ${textColor} ${share}%, transparent)`
  if (gradient.pattern === 'grid') return `linear-gradient(${ink(10)} 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, ${ink(10)} 1px, transparent 1px) 0 0/14px 14px, ${base}`
  if (gradient.pattern === 'contours') return `repeating-radial-gradient(circle at 30% 70%, transparent 0 11px, ${ink(14)} 11px 12px), ${base}`
  return base
}

// Drawn in the open format's proportions; a landscape card puts the text in a side column.
function TemplateThumb({ template }: { template: StyleTemplate }) {
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

export default function TemplatesTab() {
  const customTemplates = useAppStore((s) => s.customTemplates)
  const applyTemplate = useAppStore((s) => s.applyTemplate)
  const saveTemplate = useAppStore((s) => s.saveTemplate)
  const deleteTemplate = useAppStore((s) => s.deleteTemplate)
  const [selectedId, setSelectedId] = useState(BUILT_IN_TEMPLATES[0].id)
  const [parts, setParts] = useState<TemplateParts>({ fonts: true, route: true, frame: true, colors: true, layout: false, points: true })
  const collageMode = useAppStore((s) => s.mode === 'collage')
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')

  const templates = [...BUILT_IN_TEMPLATES, ...customTemplates]
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]
  const anyPart = Object.values(parts).some(Boolean)

  function submitName() {
    saveTemplate(name)
    setName('')
    setNaming(false)
  }

  return (
    <>
      <PhotoPaletteSection />
      <WrapperSection />
      <Section title="Presety stylu">
        {GROUPS.map(({ key, label }) => {
          const group = templates.filter((t) => (t.custom ? 'custom' : (t.group ?? 'basic')) === key)
          if (!group.length) return null
          return (
            <div key={key} className="template-group">
              <h3 className="template-group-title">{label}</h3>
              <div className="template-grid" role="group" aria-label={label}>
                {group.map((template) => (
                  <div key={template.id} className={template.id === selected.id ? 'template-card active' : 'template-card'}>
                    {/* A double click applies it straight away, with the parts ticked below. */}
                    <button
                      type="button"
                      className="template-card-body"
                      aria-pressed={template.id === selected.id}
                      title="Dwuklik: zastosuj"
                      onClick={() => setSelectedId(template.id)}
                      onDoubleClick={() => anyPart && applyTemplate(template, parts)}
                    >
                      <TemplateThumb template={template} />
                      <span className="template-card-name">{template.name}</span>
                      <span className="template-card-desc">{template.desc}</span>
                    </button>
                    {template.custom && (
                      <button type="button" className="template-card-remove" aria-label={`Usuń szablon ${template.name}`} onClick={() => deleteTemplate(template.id)}>
                        <IconClose width={12} height={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </Section>

      <Section title="Zastosuj z szablonu">
        {PART_LABELS.filter(({ key }) => !collageMode || !ROUTE_PARTS.includes(key)).map(({ key, label }) => (
          <CheckboxField key={key} label={label} checked={parts[key]} onChange={(on) => setParts({ ...parts, [key]: on })} />
        ))}
        <div className="button-row">
          <Button variant="primary" disabled={!anyPart} onClick={() => applyTemplate(selected, parts)}>
            Zastosuj {selected.name}
          </Button>
          <Button onClick={() => setNaming(true)}>Zapisz jako własny</Button>
        </div>
        {naming && (
          <form
            className="template-name-row"
            onSubmit={(e) => {
              e.preventDefault()
              submitName()
            }}
          >
            <div className="field">
              <input type="text" autoFocus placeholder="Nazwa szablonu" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nazwa szablonu" />
            </div>
            <Button variant="primary" type="submit">
              Zapisz
            </Button>
            <Button type="button" onClick={() => setNaming(false)}>
              Anuluj
            </Button>
          </form>
        )}
        <p className="hint">Szablon nie rusza zdjęć, tras ani treści napisów — tylko wygląd. Dwuklik na presecie od razu go stosuje.</p>
      </Section>
    </>
  )
}
