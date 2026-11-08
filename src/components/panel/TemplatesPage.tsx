import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { pickDocument } from '../../store/document'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import TemplateThumb from './TemplateThumb'
import { isPlainLook, PHOTO_GRADES } from '../../utils/photoLook'
import { IconMore } from '../icons'
import useDismiss from '../../hooks/useDismiss'
import { useAppStore } from '../../store/useAppStore'
import { lookChanged } from '../../store/slices/templatesSlice'
import { BUILT_IN_TEMPLATES, templateName } from '../../utils/templates'
import type { StyleTemplate, TemplateGroup, TemplateParts } from '../../types'
import type { TKey } from '../../i18n'
import './TemplatesPage.css'

const PART_LABELS: { key: keyof TemplateParts; label: TKey }[] = [
  { key: 'fonts', label: 'templatesPage.partFonts' },
  { key: 'route', label: 'templatesPage.partRoute' },
  { key: 'frame', label: 'templatesPage.partFrame' },
  { key: 'colors', label: 'templatesPage.partColors' },
  { key: 'layout', label: 'templatesPage.partLayout' },
  { key: 'points', label: 'templatesPage.partPoints' },
  { key: 'effects', label: 'templatesPage.partEffects' },
]

// A collage has no route and no places to pin photos to.
const ROUTE_PARTS: (keyof TemplateParts)[] = ['route', 'points']

type Filter = 'recent' | 'favorite' | 'all' | TemplateGroup | 'custom'

const FILTERS: { key: Filter; label: TKey }[] = [
  { key: 'recent', label: 'templatesPage.filterRecent' },
  { key: 'favorite', label: 'templatesPage.filterFavorite' },
  { key: 'all', label: 'templatesPage.filterAll' },
  { key: 'basic', label: 'templatesPage.filterBasic' },
  { key: 'natural', label: 'templatesPage.filterNatural' },
  { key: 'retro', label: 'templatesPage.filterRetro' },
  { key: 'dark', label: 'templatesPage.filterDark' },
  { key: 'sticker', label: 'templatesPage.filterSticker' },
  { key: 'poster', label: 'templatesPage.filterPoster' },
  { key: 'custom', label: 'templatesPage.filterCustom' },
]

// Recent and favourite keep their own order; a group keeps the list's.
function filtered(templates: StyleTemplate[], filter: Filter, recent: string[], favorite: string[]): StyleTemplate[] {
  const byIds = (ids: string[]) => ids.flatMap((id) => templates.find((t) => t.id === id) ?? [])
  if (filter === 'recent') return byIds(recent)
  if (filter === 'favorite') return byIds(favorite)
  if (filter === 'all') return templates
  return templates.filter((t) => (t.custom ? 'custom' : (t.group ?? 'basic')) === filter)
}

function CardMenu({ template, onClose }: { template: StyleTemplate; onClose: () => void }) {
  const { t } = useTranslation()
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
        {favorite ? t('templatesPage.unfavorite') : t('templatesPage.favorite')}
      </button>
      {template.custom && (
        <button type="button" role="menuitem" className="danger" onClick={run(() => deleteTemplate(template.id))}>
          {t('templatesPage.delete')}
        </button>
      )}
    </div>
  )
}

function SaveTemplate() {
  const { t } = useTranslation()
  const saveTemplate = useAppStore((s) => s.saveTemplate)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  if (!naming)
    return (
      <Button size="sm" onClick={() => setNaming(true)}>
        {t('templatesPage.saveCurrent')}
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
        <input type="text" autoFocus placeholder={t('templatesPage.templateName')} value={name} onChange={(e) => setName(e.target.value)} aria-label={t('templatesPage.templateName')} />
      </div>
      <Button variant="primary" type="submit">
        {t('templatesPage.save')}
      </Button>
      <Button type="button" onClick={() => setNaming(false)}>
        {t('templatesPage.cancel')}
      </Button>
    </form>
  )
}

// Worked out again only when the document changes, not on every store update (playback, hover, selection).
function useLookChanged(template: StyleTemplate | undefined): boolean {
  const doc = useAppStore(useShallow(pickDocument))
  const activeSlide = useAppStore((s) => s.activeSlide)
  const parts = useAppStore((s) => s.templateParts)
  return useMemo(() => !!template && lookChanged({ ...doc, activeSlide }, template, parts), [doc, activeSlide, parts, template])
}

function PreviewBar({ template }: { template: StyleTemplate }) {
  const { t } = useTranslation()
  const parts = useAppStore((s) => s.templateParts)
  const setParts = useAppStore((s) => s.setTemplateParts)
  const keepPreview = useAppStore((s) => s.keepPreview)
  const endPreview = useAppStore((s) => s.endPreview)
  const collageMode = useAppStore((s) => s.mode === 'collage')
  const [choosing, setChoosing] = useState(false)
  const anyPart = Object.values(parts).some(Boolean)
  const grade = template.photoLook && !isPlainLook(template.photoLook) ? PHOTO_GRADES.find((g) => g.value === template.photoLook?.grade)?.label : null
  return (
    <div className="template-preview-bar" role="region" aria-label={t('templatesPage.previewLabel')}>
      <div className="template-preview-head">
        <span>
          {t('templatesPage.preview')} <strong>{templateName(template)}</strong>
        </span>
        <span className="hint">{t('templatesPage.previewHint')}</span>
      </div>
      {/* Photos keep their own colours unless asked: the style's film look is opt-in. */}
      {grade && <CheckboxField label={t('templatesPage.applyToPhotos', { grade: t(grade).toLowerCase() })} checked={parts.photo} onChange={(photo) => setParts({ ...parts, photo })} />}
      <div className="button-row">
        <Button variant="primary" size="sm" disabled={!anyPart} onClick={keepPreview}>
          {t('templatesPage.apply')}
        </Button>
        <Button size="sm" onClick={endPreview}>
          {t('templatesPage.revert')}
        </Button>
        <Button size="sm" variant="ghost" className="template-only" pressed={choosing} onClick={() => setChoosing(!choosing)}>
          {t('templatesPage.chooseParts')}
        </Button>
      </div>
      {choosing && (
        <div className="template-parts">
          {PART_LABELS.filter(({ key }) => !collageMode || !ROUTE_PARTS.includes(key)).map(({ key, label }) => (
            <CheckboxField key={key} label={t(label)} checked={parts[key]} onChange={(on) => setParts({ ...parts, [key]: on })} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TemplatesPage() {
  const { t } = useTranslation()
  const customTemplates = useAppStore((s) => s.customTemplates)
  const recent = useAppStore((s) => s.recentTemplates)
  const favorite = useAppStore((s) => s.favoriteTemplates)
  const preview = useAppStore((s) => s.templatePreview)
  const previewTemplate = useAppStore((s) => s.previewTemplate)
  const keepPreview = useAppStore((s) => s.keepPreview)
  const templates = [...BUILT_IN_TEMPLATES, ...customTemplates]
  const current = useAppStore((s) => templates.find((x) => x.id === s.templateId))
  const changed = useLookChanged(preview ? undefined : current)
  const [filter, setFilter] = useState<Filter>(recent.length ? 'recent' : 'all')
  const [menuOf, setMenuOf] = useState<string | null>(null)

  const shown = filtered(templates, filter, recent, favorite)
  const filters = FILTERS.filter(({ key }) => key === 'recent' || key === 'favorite' || filtered(templates, key, recent, favorite).length)
  const onFrame = preview?.template.id ?? current?.id

  return (
    <div className="templates-page">
      <div className="template-current">
        <span>
          {t('templatesPage.now')} <strong>{(current && templateName(current)) ?? t('templatesPage.customLook')}</strong>
        </span>
        {changed && <span className="template-changed">{t('templatesPage.changed')}</span>}
      </div>

      <div className="template-filters" role="radiogroup" aria-label={t('templatesPage.groupLabel')}>
        {filters.map(({ key, label }) => (
          <button key={key} type="button" role="radio" aria-checked={key === filter} className={key === filter ? 'template-filter active' : 'template-filter'} onClick={() => setFilter(key)}>
            {t(label)}
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
                title={t('templatesPage.cardTitle', { desc: t(template.desc) })}
                onClick={() => previewTemplate(template)}
                onDoubleClick={keepPreview}
              >
                <TemplateThumb template={template} />
                <span className="template-card-name">{templateName(template)}</span>
              </button>
              <button
                type="button"
                className="template-card-more"
                aria-label={t('templatesPage.more', { name: templateName(template) })}
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
        <p className="hint">{filter === 'favorite' ? t('templatesPage.noFavorites') : t('templatesPage.noRecent')}</p>
      )}

      {preview && <PreviewBar template={preview.template} />}

      <div className="template-footer">
        <span className="hint">{t('templatesPage.count', { shown: shown.length, count: templates.length })}</span>
        <SaveTemplate />
      </div>
    </div>
  )
}
