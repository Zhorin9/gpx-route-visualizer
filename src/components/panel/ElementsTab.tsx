import { useState } from 'react'
import SelectField from '../fields/SelectField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconMapPin, IconPlus, IconBarChart, IconType } from '../icons'
import StatsEditor from './StatsTab'
import TextEditor from './TextsTab'
import WaypointEditor from './PlacesTab'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { FONT_OPTIONS } from '../../utils/fonts'

function ElementRow({
  icon,
  label,
  meta,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  meta: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? 'item-list-item element-row active' : 'item-list-item element-row'}
      onClick={onClick}
    >
      {icon}
      <span className="element-row-label">{label}</span>
      <span className="element-row-meta">{meta}</span>
    </button>
  )
}

function GlobalFontPicker() {
  const statsFont = useAppStore((s) => s.statsStyle.fontFamily)
  const applyGlobalFont = useAppStore((s) => s.applyGlobalFont)
  const [family, setFamily] = useState(statsFont)
  return (
    <Section title="Jedna czcionka dla wszystkiego">
      <SelectField label="Czcionka" value={family} onChange={setFamily} options={FONT_OPTIONS} />
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
        <Button variant="primary" icon={<IconPlus />} onClick={addText}>
          Napis
        </Button>
        <Button pressed={adding} icon={<IconPlus />} disabled={!hasRoute} onClick={() => setAddingWaypoint(!adding)}>
          {adding ? 'Anuluj' : 'Miejscowość'}
        </Button>
      </div>
      {adding && <p className="hint">Kliknij na trasie — etykieta przyklei się do najbliższego punktu.</p>}

      <Section title="Elementy na grafice">
        <div className="item-list" role="listbox" aria-label="Elementy na grafice">
          {hasRoute && (
            <ElementRow
              icon={<IconBarChart />}
              label="Nagłówek ze statystykami"
              meta="liczby"
              active={selection?.kind === 'stats'}
              onClick={() => select({ kind: 'stats' })}
            />
          )}
          {texts.map((t) => (
            <ElementRow
              key={`t${t.id}`}
              icon={<IconType />}
              label={t.text || '(pusty)'}
              meta="napis"
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
          <p className="hint">Dodaj napis albo miejscowość. Elementy przeciągasz na podglądzie, a dwuklik zmienia treść.</p>
        )}
      </Section>

      {selection?.kind === 'stats' && <StatsEditor />}
      {selection?.kind === 'text' && <TextEditor id={selection.id} />}
      {selection?.kind === 'waypoint' && <WaypointEditor id={selection.id} />}

      <GlobalFontPicker />
    </>
  )
}
