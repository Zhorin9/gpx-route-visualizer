import SliderField from '../fields/SliderField'
import SelectField from '../fields/SelectField'
import ColorField from '../fields/ColorField'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { IconMapPin, IconTrash } from '../icons'
import { FONT_OPTIONS } from '../../utils/fonts'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'

export default function PlacesTab() {
  const hasRoute = useHasRoute()
  const adding = useAppStore((s) => s.addingWaypoint)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)
  const waypoints = useAppStore((s) => s.waypoints)
  const selectedId = useAppStore((s) => (s.selection?.kind === 'waypoint' ? s.selection.id : null))
  const select = useAppStore((s) => s.select)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const deleteWaypoint = useAppStore((s) => s.deleteWaypoint)

  const selected = waypoints.find((w) => w.id === selectedId)

  return (
    <>
      <Button
        variant={adding ? 'secondary' : 'primary'}
        pressed={adding}
        icon={<IconMapPin />}
        onClick={() => setAddingWaypoint(!adding)}
        disabled={!hasRoute}
        block
      >
        {adding ? 'Anuluj dodawanie' : 'Dodaj miejscowość'}
      </Button>
      <p className="hint">
        {!hasRoute
          ? 'Najpierw wgraj plik GPX.'
          : adding
            ? 'Kliknij w dowolne miejsce na trasie — etykieta przyklei się do najbliższego punktu.'
            : 'Etykieta trzyma się trasy także po zmianie proporcji czy zakresu. Przeciągnij napis, aby zmienić jego położenie.'}
      </p>

      {waypoints.length > 0 && (
        <div className="item-list" role="listbox" aria-label="Miejscowości">
          {waypoints.map((w) => (
            <button
              key={w.id}
              type="button"
              role="option"
              aria-selected={w.id === selectedId}
              className={w.id === selectedId ? 'item-list-item active' : 'item-list-item'}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
            >
              {w.text || '(pusta)'}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <Section title="Etykieta">
            <TextField label="Nazwa" value={selected.text} onChange={(text) => updateWaypoint(selected.id, { text })} />
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
      )}
    </>
  )
}
