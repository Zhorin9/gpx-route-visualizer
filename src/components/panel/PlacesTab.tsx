import SliderField from '../fields/SliderField'
import SelectField from '../fields/SelectField'
import ColorField from '../fields/ColorField'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconTrash } from '../icons'
import { FONT_OPTIONS } from '../../utils/fonts'
import { useAppStore } from '../../store/useAppStore'
import type { SelectOption, WaypointKind } from '../../types'

const KIND_OPTIONS: SelectOption<WaypointKind>[] = [
  { value: 'pass', label: 'Przełęcz' },
  { value: 'peak', label: 'Szczyt' },
  { value: 'point', label: 'Punkt' },
]

export default function WaypointEditor({ id }: { id: number }) {
  const selected = useAppStore((s) => s.waypoints.find((w) => w.id === id))
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const deleteWaypoint = useAppStore((s) => s.deleteWaypoint)

  if (!selected) return null

  return (
    <>
      <Section title="Etykieta">
        <TextField label="Nazwa" value={selected.text} onChange={(text) => updateWaypoint(selected.id, { text })} />
        <Segmented label="Rodzaj punktu" showLabel value={selected.kind} options={KIND_OPTIONS} onChange={(kind) => updateWaypoint(selected.id, { kind })} />
        <SelectField
          label="Czcionka"
          value={selected.fontFamily}
          onChange={(fontFamily) => updateWaypoint(selected.id, { fontFamily })}
          options={FONT_OPTIONS}
        />
        <SliderField
          label="Rozmiar"
          unit="px"
          min={10}
          max={80}
          value={selected.fontSize}
          defaultValue={26}
          onChange={(fontSize) => updateWaypoint(selected.id, { fontSize })}
        />
        <ColorField label="Kolor" value={selected.color} onChange={(color) => updateWaypoint(selected.id, { color })} />
      </Section>
      <Button variant="danger" icon={<IconTrash />} onClick={() => deleteWaypoint(selected.id)}>
        Usuń miejscowość
      </Button>
    </>
  )
}
