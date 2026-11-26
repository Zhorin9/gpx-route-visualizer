import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconImage, IconMapPin, IconPalette, IconPlus, IconType } from '../icons'
import { appliedTemplate } from '../../store/slices/templatesSlice'
import { templateName } from '../../utils/templates'
import TextEditor from './TextEditor'
import PlaceEditor from './PlaceEditor'
import ElementRow from './ElementRow'
import JournalSuggestions from './JournalSuggestions'
import IconSvg from '../place/IconSvg'
import { iconById } from '../place/icons'
import { canvasElement, canvasElements, type CanvasElementDefinition } from '../../core/canvas/registry'
import { useHasRoute } from '../../store/selectors'
import useLayerOrder from '../../hooks/useLayerOrder'
import { elementLayer, placedAt, slotLayer, textLayer } from '../../core/canvas/layers'
import { useAppStore } from '../../store/useAppStore'
import FontField from '../fields/FontField'
import { FIELD_LABELS, wrapperFieldsOf } from '../../utils/wrappers'

function ElementLayerRow({ kind, def, onDropLayer }: { kind: string; def: CanvasElementDefinition; onDropLayer: (dragged: string) => void }) {
  const { t } = useTranslation()
  const instances = def.useInstances?.() ?? []
  const active = useAppStore((s) => s.selection?.kind === 'element' && s.selection.element === kind)
  const select = useAppStore((s) => s.select)
  const label = instances.length > 1 ? `${t(def.label)} ${instances.indexOf(kind) + 1}` : t(def.label)
  return (
    <ElementRow
      icon={def.icon}
      label={label}
      meta={t(def.meta)}
      active={active}
      onClick={() => select({ kind: 'element', element: kind })}
      onDelete={def.remove && (() => def.remove?.(kind))}
      deleteLabel={t('elementsTab.deleteElement')}
      layer={elementLayer(kind)}
      onDropLayer={onDropLayer}
    />
  )
}

function TextLayerRow({ id, onDropLayer }: { id: number; onDropLayer: (dragged: string) => void }) {
  const { t } = useTranslation()
  const text = useAppStore((s) => s.texts.find((n) => n.id === id))
  const active = useAppStore((s) => s.selection?.kind === 'text' && s.selection.id === id)
  const select = useAppStore((s) => s.select)
  const deleteText = useAppStore((s) => s.deleteText)
  if (!text) return null
  return (
    <ElementRow
      icon={text.icon ? <IconSvg icon={text.icon} /> : <IconType />}
      label={text.icon ? t(iconById(text.icon)?.label ?? 'elementsTab.icon') : text.text || t('elementsTab.emptyText')}
      meta={text.icon ? t('elementsTab.iconMeta') : text.badge ? t('elementsTab.badgeMeta') : t('elementsTab.textMeta')}
      active={active}
      onClick={() => select({ kind: 'text', id })}
      onDelete={() => deleteText(id)}
      deleteLabel={text.icon ? t('iconEditor.delete') : t('textEditor.delete')}
      layer={textLayer(id)}
      onDropLayer={onDropLayer}
    />
  )
}

function SlotLayerRow({ slide, index, onDropLayer }: { slide: number; index: number; onDropLayer: (dragged: string) => void }) {
  const { t } = useTranslation()
  const active = useAppStore((s) => s.selection?.kind === 'slot' && s.selection.slide === slide && s.selection.index === index)
  const select = useAppStore((s) => s.select)
  return (
    <ElementRow
      icon={<IconImage />}
      label={t('layers.framedPhoto')}
      meta={t('layers.framedPhotoMeta')}
      active={active}
      onClick={() => select({ kind: 'slot', slide, index })}
      layer={slotLayer(slide, index)}
      onDropLayer={onDropLayer}
    />
  )
}

function LayerRows() {
  const keys = useLayerOrder()
  const setLayerOrder = useAppStore((s) => s.setLayerOrder)
  return [...keys].reverse().map((key) => {
    const onDropLayer = (dragged: string) => {
      const next = placedAt(keys, dragged, key)
      if (next !== keys) setLayerOrder(next)
    }
    const [kind, ...rest] = key.split(':')
    if (kind === 'text') return <TextLayerRow key={key} id={Number(rest[0])} onDropLayer={onDropLayer} />
    if (kind === 'slot') return <SlotLayerRow key={key} slide={Number(rest[0])} index={Number(rest[1])} onDropLayer={onDropLayer} />
    if (kind !== 'element') return null
    const def = canvasElement(rest.join(':'))
    return def ? <ElementLayerRow key={key} kind={rest.join(':')} def={def} onDropLayer={onDropLayer} /> : null
  })
}

function ShowAgainButton({ def, useShowAgain }: { def: CanvasElementDefinition; useShowAgain: () => (() => string | void) | null }) {
  const { t } = useTranslation()
  const show = useShowAgain()
  const select = useAppStore((s) => s.select)
  if (!show) return null
  return (
    <Button
      icon={<IconPlus />}
      onClick={() => {
        const shown = show()
        select({ kind: 'element', element: shown ?? def.kind })
      }}
    >
      {t(def.label)}
    </Button>
  )
}

function StyleInUse() {
  const { t } = useTranslation()
  const template = useAppStore(appliedTemplate)
  const applyStyleEverywhere = useAppStore((s) => s.applyStyleEverywhere)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setSubTab = useAppStore((s) => s.setSubTab)
  const openTemplates = () => {
    setActiveTab('style')
    setSubTab('style', 'presets')
  }
  return (
    <div className="style-in-use">
      <div className="style-in-use-head">
        <span className="style-in-use-text">
          <strong>{template ? t('elementsTab.styleInUse', { name: templateName(template) }) : t('elementsTab.noStyle')}</strong>
          {!template && <span className="hint">{t('elementsTab.noStyleHint')}</span>}
        </span>
        <Button size="sm" variant="ghost" icon={<IconPalette />} onClick={openTemplates}>
          {template ? t('elementsTab.changeStyle') : t('elementsTab.chooseStyle')}
        </Button>
      </div>
      {template?.id === 'dziennik' && <JournalSuggestions />}
      {template && (
        <div className="style-in-use-actions">
          <Button size="sm" onClick={applyStyleEverywhere}>
            {t('elementsTab.applyStyleEverywhere')}
          </Button>
        </div>
      )}
    </div>
  )
}

function SelectedElementEditor({ kind }: { kind: string }) {
  const def = canvasElement(kind)
  return def ? <def.Editor /> : null
}

function WrapperFields() {
  const { t } = useTranslation()
  const wrapper = useAppStore((s) => s.wrapper)
  const updateWrapper = useAppStore((s) => s.updateWrapper)
  const fields = wrapperFieldsOf(wrapper.id)
  if (!fields.length) return null
  return (
    <Section title={t('elementsTab.wrapper')}>
      {fields.map((field) => (
        <TextField key={field} label={t(FIELD_LABELS[field])} value={wrapper.fields[field]} multiline={field === 'note'} onChange={(value) => updateWrapper({ fields: { [field]: value } })} />
      ))}
    </Section>
  )
}

function GlobalFontPicker() {
  const { t } = useTranslation()
  const statsFont = useAppStore((s) => s.statsStyle.fontFamily)
  const applyGlobalFont = useAppStore((s) => s.applyGlobalFont)
  const [family, setFamily] = useState(statsFont)
  return (
    <Section title={t('elementsTab.globalFont')}>
      <FontField value={family} onChange={setFamily} />
      <Button onClick={() => applyGlobalFont(family)}>{t('elementsTab.applyEverywhere')}</Button>
    </Section>
  )
}

export default function ElementsTab() {
  const { t } = useTranslation()
  const hasRoute = useHasRoute()
  const texts = useAppStore((s) => s.texts)
  const waypoints = useAppStore((s) => s.waypoints)
  const selection = useAppStore((s) => s.selection)
  const adding = useAppStore((s) => s.addingWaypoint)
  const select = useAppStore((s) => s.select)
  const deleteWaypoint = useAppStore((s) => s.deleteWaypoint)
  const addText = useAppStore((s) => s.addText)
  const addRouteCaptions = useAppStore((s) => s.addRouteCaptions)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isSelected = (id: number) => selection?.kind === 'waypoint' && selection.id === id

  return (
    <>
      <StyleInUse />
      <div className="button-row">
        <Button variant="primary" icon={<IconPlus />} onClick={() => addText()}>
          {t('elementsTab.text')}
        </Button>
        <Button icon={<IconPlus />} onClick={() => addText('icon')}>
          {t('elementsTab.icon')}
        </Button>
        <Button icon={<IconPlus />} onClick={() => addText('badge')}>
          {t('elementsTab.badge')}
        </Button>
        <Button icon={<IconPlus />} title={t('elementsTab.arcHint')} onClick={() => addText('arc')}>
          {t('elementsTab.arc')}
        </Button>
        <Button pressed={adding} icon={<IconPlus />} disabled={!hasRoute} onClick={() => setAddingWaypoint(!adding)}>
          {adding ? t('common.cancel') : t('elementsTab.place')}
        </Button>
        {canvasElements().map((def) => def.useShowAgain && <ShowAgainButton key={def.kind} def={def} useShowAgain={def.useShowAgain} />)}
      </div>
      {hasRoute && (
        <Button size="sm" variant="ghost" icon={<IconPlus />} onClick={addRouteCaptions}>
          {t('elementsTab.routeCaptions')}
        </Button>
      )}
      {adding && <p className="hint">{t('elementsTab.addingHint')}</p>}

      <Section title={t('elementsTab.elements')}>
        <p className="hint">{t('layers.listHint')}</p>
        <div className="item-list" role="listbox" aria-label={t('elementsTab.elements')}>
          <LayerRows />
          {waypoints.map((w) => (
            <ElementRow
              key={`w${w.id}`}
              icon={<IconMapPin />}
              label={w.text || t('elementsTab.emptyPlace')}
              meta={t('elementsTab.placeMeta')}
              active={isSelected(w.id)}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
              onDelete={() => deleteWaypoint(w.id)}
              deleteLabel={t('placeEditor.delete')}
            />
          ))}
        </div>
        {texts.length === 0 && waypoints.length === 0 && (
          <p className="hint">{t('elementsTab.emptyHint')}</p>
        )}
      </Section>

      {selection?.kind === 'element' && <SelectedElementEditor kind={selection.element} />}
      {selection?.kind === 'text' && <TextEditor id={selection.id} />}
      {selection?.kind === 'waypoint' && <PlaceEditor id={selection.id} />}

      <WrapperFields />
      <GlobalFontPicker />
    </>
  )
}
