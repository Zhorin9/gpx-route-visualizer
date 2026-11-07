import { useState } from 'react'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconMapPin, IconPlus, IconType } from '../icons'
import TextEditor from './TextEditor'
import PlaceEditor from './PlaceEditor'
import ElementRow from './ElementRow'
import IconSvg from '../place/IconSvg'
import { iconById } from '../place/icons'
import { canvasElement, canvasElements, type CanvasElementDefinition } from '../../core/canvas/registry'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import FontField from '../fields/FontField'
import { FIELD_LABELS, wrapperFieldsOf } from '../../utils/wrappers'

function RegisteredElementRow({ def }: { def: CanvasElementDefinition }) {
  const available = def.useIsAvailable()
  const active = useAppStore((s) => s.selection?.kind === 'element' && s.selection.element === def.kind)
  const select = useAppStore((s) => s.select)
  if (!available) return null
  return <ElementRow icon={def.icon} label={def.label} meta={def.meta} active={active} onClick={() => select({ kind: 'element', element: def.kind })} />
}

function SelectedElementEditor({ kind }: { kind: string }) {
  const def = canvasElement(kind)
  return def ? <def.Editor /> : null
}

function WrapperFields() {
  const wrapper = useAppStore((s) => s.wrapper)
  const updateWrapper = useAppStore((s) => s.updateWrapper)
  const fields = wrapperFieldsOf(wrapper.id)
  if (!fields.length) return null
  return (
    <Section title="Opakowanie">
      {fields.map((field) => (
        <TextField key={field} label={FIELD_LABELS[field]} value={wrapper.fields[field]} multiline={field === 'note'} onChange={(value) => updateWrapper({ fields: { [field]: value } })} />
      ))}
    </Section>
  )
}

function GlobalFontPicker() {
  const statsFont = useAppStore((s) => s.statsStyle.fontFamily)
  const applyGlobalFont = useAppStore((s) => s.applyGlobalFont)
  const [family, setFamily] = useState(statsFont)
  return (
    <Section title="Jedna czcionka dla wszystkiego">
      <FontField value={family} onChange={setFamily} />
      <Button onClick={() => applyGlobalFont(family)}>Zastosuj wszędzie</Button>
    </Section>
  )
}

export default function ElementsTab() {
  const hasRoute = useHasRoute()
  const texts = useAppStore((s) => s.texts)
  const waypoints = useAppStore((s) => s.waypoints)
  const selection = useAppStore((s) => s.selection)
  const adding = useAppStore((s) => s.addingWaypoint)
  const select = useAppStore((s) => s.select)
  const addText = useAppStore((s) => s.addText)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)

  const isSelected = (kind: 'text' | 'waypoint', id: number) => selection?.kind === kind && selection.id === id

  return (
    <>
      <div className="button-row">
        <Button variant="primary" icon={<IconPlus />} onClick={() => addText()}>
          Napis
        </Button>
        <Button icon={<IconPlus />} onClick={() => addText('star')}>
          Ikona
        </Button>
        <Button pressed={adding} icon={<IconPlus />} disabled={!hasRoute} onClick={() => setAddingWaypoint(!adding)}>
          {adding ? 'Anuluj' : 'Miejscowość'}
        </Button>
      </div>
      {adding && <p className="hint">Kliknij na trasie — etykieta przyklei się do najbliższego punktu.</p>}

      <Section title="Elementy na grafice">
        <div className="item-list" role="listbox" aria-label="Elementy na grafice">
          {canvasElements().map((def) => (
            <RegisteredElementRow key={def.kind} def={def} />
          ))}
          {texts.map((t) => (
            <ElementRow
              key={`t${t.id}`}
              icon={t.icon ? <IconSvg icon={t.icon} /> : <IconType />}
              label={t.icon ? (iconById(t.icon)?.label ?? 'Ikona') : t.text || '(pusty)'}
              meta={t.icon ? 'ikona' : 'napis'}
              active={isSelected('text', t.id)}
              onClick={() => select({ kind: 'text', id: t.id })}
            />
          ))}
          {waypoints.map((w) => (
            <ElementRow
              key={`w${w.id}`}
              icon={<IconMapPin />}
              label={w.text || '(pusta)'}
              meta="miejscowość"
              active={isSelected('waypoint', w.id)}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
            />
          ))}
        </div>
        {texts.length === 0 && waypoints.length === 0 && (
          <p className="hint">Dodaj napis, ikonę albo miejscowość. Elementy przeciągasz na podglądzie, a dwuklik zmienia treść.</p>
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
