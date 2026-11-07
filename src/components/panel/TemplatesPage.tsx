import { useRef, useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import TemplateThumb from './TemplateThumb'
import { IconMore } from '../icons'
import useDismiss from '../../hooks/useDismiss'
import { useAppStore } from '../../store/useAppStore'
import { lookChanged } from '../../store/slices/templatesSlice'
import { BUILT_IN_TEMPLATES } from '../../utils/templates'
import type { StyleTemplate, TemplateGroup, TemplateParts } from '../../types'
import './TemplatesPage.css'

const PART_LABELS: { key: keyof TemplateParts; label: string }[] = [
  { key: 'fonts', label: 'Czcionki' },
  { key: 'route', label: 'Kolor i styl trasy' },
  { key: 'frame', label: 'Ramka zdjęć' },
  { key: 'colors', label: 'Kolory kadru' },
  { key: 'layout', label: 'Układ zdjęć' },
  { key: 'points', label: 'Zdjęcia w punktach' },
  { key: 'effects', label: 'Efekty i ikony' },
  { key: 'photo', label: 'Wygląd zdjęć' },
]

// A collage has no route and no places to pin photos to.
const ROUTE_PARTS: (keyof TemplateParts)[] = ['route', 'points']

type Filter = 'recent' | 'favorite' | 'all' | TemplateGroup | 'custom'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'recent', label: 'Ostatnie' },
  { key: 'favorite', label: 'Ulubione' },
  { key: 'all', label: 'Wszystkie' },
  { key: 'basic', label: 'Podstawowe' },
  { key: 'natural', label: 'Naturalne' },
  { key: 'retro', label: 'Retro' },
  { key: 'dark', label: 'Ciemne' },
  { key: 'sticker', label: 'Naklejki' },
  { key: 'poster', label: 'Plakaty' },
  { key: 'custom', label: 'Własne' },
]

// Recent and favourite keep their own order; a group keeps the list's.
function filtered(templates: StyleTemplate[], filter: Filter, recent: string[], favorite: string[]): StyleTemplate[] {
  const byIds = (ids: string[]) => ids.flatMap((id) => templates.find((t) => t.id === id) ?? [])
  if (filter === 'recent') return byIds(recent)
  if (filter === 'favorite') return byIds(favorite)
  if (filter === 'all') return templates
  return templates.filter((t) => (t.custom ? 'custom' : (t.group ?? 'basic')) === filter)
}

const countLabel = (shown: number, total: number) => `${shown} z ${total} ${total === 1 ? 'szablonu' : 'szablonów'}`

function CardMenu({ template, onClose }: { template: StyleTemplate; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const favorite = useAppStore((s) => s.favoriteTemplates.includes(template.id))
  const toggleFavorite = useAppStore((s) => s.toggleFavoriteTemplate)
  const deleteTemplate = useAppStore((s) => s.deleteTemplate)
  useDismiss(true, ref, onClose)
  const run = (action: () => void) => () => {
    action()
    onClose()
  }
  return (
    <div ref={ref} className="template-menu" role="menu">
      <button type="button" role="menuitem" onClick={run(() => toggleFavorite(template.id))}>
        {favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      </button>
      {template.custom && (
        <button type="button" role="menuitem" className="danger" onClick={run(() => deleteTemplate(template.id))}>
          Usuń
        </button>
      )}
    </div>
  )
}

function SaveTemplate() {
  const saveTemplate = useAppStore((s) => s.saveTemplate)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  if (!naming)
    return (
      <Button size="sm" onClick={() => setNaming(true)}>
        Zapisz obecny jako własny
      </Button>
    )
  return (
    <form
      className="template-name-row"
      onSubmit={(e) => {
        e.preventDefault()
        saveTemplate(name)
        setName('')
        setNaming(false)
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
  )
}

function PreviewBar({ template }: { template: StyleTemplate }) {
  const parts = useAppStore((s) => s.templateParts)
  const setParts = useAppStore((s) => s.setTemplateParts)
  const applyPreview = useAppStore((s) => s.applyPreview)
  const endPreview = useAppStore((s) => s.endPreview)
  const collageMode = useAppStore((s) => s.mode === 'collage')
  const [choosing, setChoosing] = useState(false)
  const anyPart = Object.values(parts).some(Boolean)
  return (
    <div className="template-preview-bar" role="region" aria-label="Podgląd szablonu">
      <div className="template-preview-head">
        <span>
          Podgląd: <strong>{template.name}</strong>
        </span>
        <span className="hint">kadr pokazuje ten styl</span>
      </div>
      <div className="button-row">
        <Button variant="primary" size="sm" disabled={!anyPart} onClick={applyPreview}>
          Zastosuj
        </Button>
        <Button size="sm" onClick={endPreview}>
          Wróć do poprzedniego
        </Button>
        <Button size="sm" variant="ghost" className="template-only" pressed={choosing} onClick={() => setChoosing(!choosing)}>
          Tylko…
        </Button>
      </div>
      {choosing && (
        <div className="template-parts">
          {PART_LABELS.filter(({ key }) => !collageMode || !ROUTE_PARTS.includes(key)).map(({ key, label }) => (
            <CheckboxField key={key} label={label} checked={parts[key]} onChange={(on) => setParts({ ...parts, [key]: on })} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TemplatesPage() {
  const customTemplates = useAppStore((s) => s.customTemplates)
  const recent = useAppStore((s) => s.recentTemplates)
  const favorite = useAppStore((s) => s.favoriteTemplates)
  const preview = useAppStore((s) => s.templatePreview)
  const previewTemplate = useAppStore((s) => s.previewTemplate)
  const applyPreview = useAppStore((s) => s.applyPreview)
  const templates = [...BUILT_IN_TEMPLATES, ...customTemplates]
  const current = useAppStore((s) => templates.find((t) => t.id === s.templateId))
  const changed = useAppStore((s) => !s.templatePreview && !!current && lookChanged(s, current, s.templateParts))
  const [filter, setFilter] = useState<Filter>(recent.length ? 'recent' : 'all')
  const [menuOf, setMenuOf] = useState<string | null>(null)

  const shown = filtered(templates, filter, recent, favorite)
  const filters = FILTERS.filter(({ key }) => key === 'recent' || key === 'favorite' || filtered(templates, key, recent, favorite).length)
  const onFrame = preview?.template.id ?? current?.id

  return (
    <div className="templates-page">
      <div className="template-current">
        <span>
          Teraz: <strong>{current?.name ?? 'własny wygląd'}</strong>
        </span>
        {changed && <span className="template-changed">zmieniony</span>}
      </div>

      <div className="template-filters" role="radiogroup" aria-label="Grupa szablonów">
        {filters.map(({ key, label }) => (
          <button key={key} type="button" role="radio" aria-checked={key === filter} className={key === filter ? 'template-filter active' : 'template-filter'} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="template-grid">
          {shown.map((template) => (
            <div key={template.id} className={template.id === onFrame ? 'template-card active' : 'template-card'}>
              {/* A click shows it on the frame; a double click applies it straight away. */}
              <button
                type="button"
                className="template-card-body"
                aria-pressed={template.id === onFrame}
                title={`${template.desc}. Dwuklik: zastosuj`}
                onClick={() => previewTemplate(template)}
                onDoubleClick={applyPreview}
              >
                <TemplateThumb template={template} />
                <span className="template-card-name">{template.name}</span>
              </button>
              <button
                type="button"
                className="template-card-more"
                aria-label={`Więcej: ${template.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOf === template.id}
                // The open menu closes on a press elsewhere; its own button toggles it instead.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setMenuOf(menuOf === template.id ? null : template.id)}
              >
                <IconMore width={12} height={12} />
              </button>
              {menuOf === template.id && <CardMenu template={template} onClose={() => setMenuOf(null)} />}
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">{filter === 'favorite' ? 'Dodaj szablon do ulubionych z menu na jego karcie.' : 'Tu pojawią się szablony, których używasz.'}</p>
      )}

      {preview && <PreviewBar template={preview.template} />}

      <div className="template-footer">
        <span className="hint">{countLabel(shown.length, templates.length)}</span>
        <SaveTemplate />
      </div>
    </div>
  )
}
