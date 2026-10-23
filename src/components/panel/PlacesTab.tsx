import SliderField from '../fields/SliderField'
import SelectField from '../fields/SelectField'
import ColorField from '../fields/ColorField'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import FileButton from '../ui/FileButton'
import { IconImage, IconTrash } from '../icons'
import { FONT_OPTIONS } from '../../utils/fonts'
import { useAppStore } from '../../store/useAppStore'
import type { PhotoMarker, PointStyle, SelectOption, Waypoint, WaypointKind } from '../../types'

const KIND_OPTIONS: SelectOption<WaypointKind>[] = [
  { value: 'pass', label: 'Przełęcz' },
  { value: 'peak', label: 'Szczyt' },
  { value: 'point', label: 'Punkt' },
]

const MARKER_OPTIONS: SelectOption<PhotoMarker>[] = [
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'circle', label: 'Kółko' },
  { value: 'square', label: 'Ramka' },
  { value: 'film', label: 'Klatka' },
  { value: 'label', label: 'Etykieta' },
]

const SIZE_OPTIONS: SelectOption<PointStyle['size']>[] = [
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
]

// A photo standing on the place's name; its look is shared by every place (and set by the style presets).
function PointPhoto({ waypoint }: { waypoint: Waypoint }) {
  const photos = useAppStore((s) => s.photos)
  const pointStyle = useAppStore((s) => s.pointStyle)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const updatePointStyle = useAppStore((s) => s.updatePointStyle)
  const loadPhotoFiles = useAppStore((s) => s.loadPhotoFiles)
  const options: SelectOption[] = [{ value: '', label: 'Bez zdjęcia' }, ...photos.map((p) => ({ value: String(p.id), label: p.name }))]
  const has = photos.some((p) => p.id === waypoint.photoId)
  return (
    <>
      {photos.length > 0 && (
        <SelectField label="Zdjęcie" value={has ? String(waypoint.photoId) : ''} options={options} onChange={(v) => updateWaypoint(waypoint.id, { photoId: v ? Number(v) : undefined })} />
      )}
      <FileButton accept="image/*" icon={<IconImage />} onFiles={(files) => files?.length && void loadPhotoFiles([files[0]], { waypoint: waypoint.id })}>
        {has ? 'Zmień zdjęcie z dysku' : 'Dodaj zdjęcie z dysku'}
      </FileButton>
      {has && (
        <>
          <Segmented label="Kształt" showLabel value={pointStyle.marker} options={MARKER_OPTIONS} onChange={(marker) => updatePointStyle({ marker })} />
          {pointStyle.marker !== 'label' && <Segmented label="Rozmiar zdjęcia" showLabel value={pointStyle.size} options={SIZE_OPTIONS} onChange={(size) => updatePointStyle({ size })} />}
        </>
      )}
    </>
  )
}

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
      <Section title="Zdjęcie w punkcie">
        <PointPhoto waypoint={selected} />
      </Section>
      <Button variant="danger" icon={<IconTrash />} onClick={() => deleteWaypoint(selected.id)}>
        Usuń miejscowość
      </Button>
    </>
  )
}
