import { useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconClose } from '../icons'
import { useAppStore } from '../../store/useAppStore'
import { BUILT_IN_TEMPLATES } from '../../utils/templates'
import type { StyleTemplate, TemplateParts } from '../../types'
import './TemplatesTab.css'

const PART_LABELS: { key: keyof TemplateParts; label: string }[] = [
  { key: 'fonts', label: 'Czcionki' },
  { key: 'route', label: 'Kolor i styl trasy' },
  { key: 'frame', label: 'Ramka zdjęć' },
  { key: 'colors', label: 'Kolory kadru' },
  { key: 'layout', label: 'Układ zdjęć' },
]

const ROUTE_PATH = 'M14 88 C22 80 16 72 26 68 S40 62 38 54 C36 46 48 42 54 38 S66 36 70 30 C74 24 82 24 84 18 S80 12 76 10'

function TemplateThumb({ template }: { template: StyleTemplate }) {
  const { preview } = template
  return (
    <span className="template-thumb" style={{ background: preview.bg, color: preview.text }}>
      {preview.frame && <span className="template-thumb-frame" style={{ borderColor: preview.frame }} />}
      <span
        className="template-thumb-title"
        style={{ fontFamily: preview.titleFont, color: preview.titleColor ?? preview.text, fontStyle: preview.italic ? 'italic' : 'normal' }}
      >
        {preview.title}
      </span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d={ROUTE_PATH}
          stroke={preview.line}
          strokeWidth={preview.width}
          strokeDasharray={preview.dotted ? '0.1 6' : preview.dash ? '9 6' : undefined}
          style={preview.glow ? { filter: `drop-shadow(0 0 3px ${preview.line})` } : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}

export default function TemplatesTab() {
  const customTemplates = useAppStore((s) => s.customTemplates)
  const applyTemplate = useAppStore((s) => s.applyTemplate)
  const saveTemplate = useAppStore((s) => s.saveTemplate)
  const deleteTemplate = useAppStore((s) => s.deleteTemplate)
  const [selectedId, setSelectedId] = useState('default')
  const [parts, setParts] = useState<TemplateParts>({ fonts: true, route: true, frame: true, colors: true, layout: false })
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
      <Section title="Szablony stylu">
        <div className="template-grid" role="group" aria-label="Szablony stylu">
          {templates.map((template) => (
            <div key={template.id} className={template.id === selected.id ? 'template-card active' : 'template-card'}>
              <button type="button" className="template-card-body" aria-pressed={template.id === selected.id} onClick={() => setSelectedId(template.id)}>
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
      </Section>

      <Section title="Zastosuj z szablonu">
        {PART_LABELS.map(({ key, label }) => (
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
        <p className="hint">Szablon nie rusza zdjęć, tras ani treści napisów — tylko wygląd.</p>
      </Section>
    </>
  )
}
