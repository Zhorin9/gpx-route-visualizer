import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconMapPin, IconPalette, IconPlus, IconType } from '../icons'
import { appliedTemplate } from '../../store/slices/templatesSlice'
import { templateName } from '../../utils/templates'
import TextEditor from './TextEditor'
import PlaceEditor from './PlaceEditor'
import ElementRow from './ElementRow'
import IconSvg from '../place/IconSvg'
import { iconById } from '../place/icons'
import { canvasElement, canvasElements, type CanvasElementDefinition } from '../../core/canvas/registry'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import FontField from '../fields/FontField'
import CheckboxField from '../fields/CheckboxField'
import { FIELD_LABELS, wrapperFieldsOf } from '../../utils/wrappers'

function RegisteredElementRow({ def }: { def: CanvasElementDefinition }) {
  const { t } = useTranslation()
  const available = def.useIsAvailable()
  const active = useAppStore((s) => s.selection?.kind === 'element' && s.selection.element === def.kind)
  const select = useAppStore((s) => s.select)
  if (!available) return null
  return <ElementRow icon={def.icon} label={t(def.label)} meta={t(def.meta)} active={active} onClick={() => select({ kind: 'element', element: def.kind })} />
}

function ShowAgainButton({ def, useShowAgain }: { def: CanvasElementDefinition; useShowAgain: () => (() => void) | null }) {
  const { t } = useTranslation()
  const show = useShowAgain()
  const select = useAppStore((s) => s.select)
  if (!show) return null
  return (
    <Button
      icon={<IconPlus />}
      onClick={() => {
        show()
        select({ kind: 'element', element: def.kind })
      }}
    >
      {t(def.label)}
    </Button>
  )
}

function StyleInUse() {
  const { t } = useTranslation()
  const template = useAppStore(appliedTemplate)
  const styleNewElements = useAppStore((s) => s.styleNewElements)
  const setStyleNewElements = useAppStore((s) => s.setStyleNewElements)
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
      {template && (
        <div className="style-in-use-actions">
          <CheckboxField label={t('elementsTab.styleNewElements')} checked={styleNewElements} onChange={setStyleNewElements} />
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
  const addText = useAppStore((s) => s.addText)
  const addRouteCaptions = useAppStore((s) => s.addRouteCaptions)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isSelected = (kind: 'text' | 'waypoint', id: number) => selection?.kind === kind && selection.id === id

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
        <div className="item-list" role="listbox" aria-label={t('elementsTab.elements')}>
          {canvasElements().map((def) => (
            <RegisteredElementRow key={def.kind} def={def} />
          ))}
          {texts.map((text) => (
            <ElementRow
              key={`t${text.id}`}
              icon={text.icon ? <IconSvg icon={text.icon} /> : <IconType />}
              label={text.icon ? t(iconById(text.icon)?.label ?? 'elementsTab.icon') : text.text || t('elementsTab.emptyText')}
              meta={text.icon ? t('elementsTab.iconMeta') : text.badge ? t('elementsTab.badgeMeta') : t('elementsTab.textMeta')}
              active={isSelected('text', text.id)}
              onClick={() => select({ kind: 'text', id: text.id })}
            />
          ))}
          {waypoints.map((w) => (
            <ElementRow
              key={`w${w.id}`}
              icon={<IconMapPin />}
              label={w.text || t('elementsTab.emptyPlace')}
              meta={t('elementsTab.placeMeta')}
              active={isSelected('waypoint', w.id)}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
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
