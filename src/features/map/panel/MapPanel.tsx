import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SelectField from '../../../components/fields/SelectField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Button from '../../../components/ui/Button'
import { useAppStore } from '../../../store/useAppStore'
import { MOODS, moodOf } from '../model/mood'
import { creditFor, mapStyles, mapStyle, OFM_TERMS, paletteFrom } from '../model/styles'
import Segmented from '../../../components/ui/Segmented'
import { selectTrack } from '../../../store/derived'
import { seedOf } from '../../../store/derived'
import { DEFAULT_MAP, type MapSettings, type SketchSettings } from '../types'
import type { SelectOption } from '../../../types'

const KINDS: SelectOption<MapSettings['kind']>[] = [
  { value: 'tiles', label: 'Zwykła' },
  { value: 'sketch', label: 'Szkic' },
]

const WATERS: SelectOption<SketchSettings['water']>[] = [
  { value: 'hatch', label: 'Kreski' },
  { value: 'wash', label: 'Akwarela' },
]

export function MapCreditFields() {
  const map = useAppStore((s) => s.map)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const updateMap = useAppStore((s) => s.updateMap)
  return (
    <>
      <SliderField label="Wielkość napisu" unit="px" min={8} max={24} value={map.creditSize} defaultValue={DEFAULT_MAP.creditSize} onChange={(creditSize) => updateMap({ creditSize })} />
      <ColorField label="Kolor napisu" value={map.creditColor ?? textColor} onChange={(creditColor) => updateMap({ creditColor })} />
    </>
  )
}

export default function MapPanel() {
  const map = useAppStore((s) => s.map)
  const gradient = useAppStore((s) => s.collage.gradient)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const updateMap = useAppStore((s) => s.updateMap)
  const styleOptions: SelectOption[] = mapStyles().map((s) => ({ value: s.id, label: s.label }))
  const sketch = map.kind === 'sketch'
  // undefined while fetching, null when the features couldn't be fetched.
  const layers = useAppStore((s) => {
    const points = selectTrack(s)?.points
    return points ? s.sketchLayers[seedOf(points)] : false
  })
  const loadSketchLayers = useAppStore((s) => s.loadSketchLayers)

  return (
    <>
      <Section title="Mapa">
        <Segmented label="Styl mapy" showLabel value={map.kind} options={KINDS} onChange={(kind) => updateMap({ kind })} />
        {sketch ? (
          <>
            <CheckboxField label="Papier pod szkicem" checked={map.sketch.paper} onChange={(paper) => updateMap({ sketch: { ...map.sketch, paper } })} />
            {!map.sketch.paper && <p className="hint">Bez papieru zostają same kreski i nazwy na przezroczystym tle: na przebitkę wybierz w eksporcie wideo „PNG + alfa”.</p>}
            <CheckboxField label="Drogi i rzeki" checked={map.sketch.lines} onChange={(lines) => updateMap({ sketch: { ...map.sketch, lines } })} />
            {!map.sketch.lines && <p className="hint">Zostają miejscowości z kropkami, jeziora i morze.</p>}
            <CheckboxField label="Nazwy miejscowości" checked={map.labels} onChange={(labels) => updateMap({ labels })} />
            {!map.labels && <p className="hint">Kropki miejscowości zostają, znikają ich nazwy, nazwy mórz i podpisy start i meta.</p>}
            <Segmented label="Woda" showLabel value={map.sketch.water} options={WATERS} onChange={(water) => updateMap({ sketch: { ...map.sketch, water } })} />
            <SliderField
              label="Drżenie"
              unit="%"
              min={50}
              max={200}
              value={Math.round(map.sketch.roughness * 100)}
              defaultValue={100}
              onChange={(v) => updateMap({ sketch: { ...map.sketch, roughness: v / 100 } })}
            />
          </>
        ) : (
          <SelectField label="Rodzaj mapy" value={map.styleId} options={styleOptions} onChange={(styleId) => updateMap({ styleId })} />
        )}
        <CheckboxField label="Kolory z szablonu stylu" checked={map.palette != null} onChange={(on) => updateMap({ palette: on ? paletteFrom(gradient, textColor) : null })} />
        {map.palette && (
          <Button size="sm" onClick={() => updateMap({ palette: paletteFrom(gradient, textColor) })}>
            Odśwież kolory z obecnego stylu
          </Button>
        )}
        {sketch ? (
          <>
            {layers === undefined && <p className="hint">Pobieram wybrzeże, rzeki, drogi i miejscowości z OpenStreetMap…</p>}
            {layers === null && (
              <>
                <p className="hint">Nie udało się pobrać tła (brak połączenia?). Szkic pokazuje samą trasę z podpisami start i meta.</p>
                <Button size="sm" onClick={() => loadSketchLayers(true)}>
                  Spróbuj ponownie
                </Button>
              </>
            )}
            <p className="hint">Tło pobierane raz dla trasy, potem rysowane zawsze tak samo: w podglądzie, w pliku i w każdej klatce filmu.</p>
          </>
        ) : (
          <>
            <CheckboxField label="Nazwy miejscowości i dróg" checked={map.labels} onChange={(labels) => updateMap({ labels })} />
            <CheckboxField label="Cieniowanie terenu" checked={map.hillshade} onChange={(hillshade) => updateMap({ hillshade })} />
          </>
        )}
        <p className="hint">Mapa leży pod trasą i podąża za jej przesunięciem, obrotem i skalą. Napisy i trasa same dobierają kontrast do mapy.</p>
      </Section>
      <MoodSection />
      {!sketch && <MapLookSection />}
      <Section title="Źródło mapy">
        <p className="hint">
          „{creditFor(map)}” zostaje na grafice, bo wymaga tego licencja mapy. Możesz je przesunąć na kadrze, zmniejszyć i zmienić kolor. {sketch ? OFM_TERMS : mapStyle(map.styleId).terms}
        </p>
        <MapCreditFields />
      </Section>
    </>
  )
}

function MoodSection() {
  const map = useAppStore((s) => s.map)
  const updateMap = useAppStore((s) => s.updateMap)
  const current = moodOf(map)
  return (
    <Section title="Nastrój">
      <Segmented
        label="Nastrój"
        value={current ?? ''}
        options={MOODS.map(({ id, label }) => ({ value: id, label }))}
        onChange={(id) => {
          const mood = MOODS.find((m) => m.id === id)?.mood
          if (mood) updateMap(mood)
        }}
      />
      <SliderField label="Krycie mapy" unit="%" min={10} max={100} step={5} value={Math.round(map.opacity * 100)} defaultValue={100} onChange={(v) => updateMap({ opacity: v / 100 })} />
      <ColorField label="Kolor pod mapą" value={map.ground} onChange={(ground) => updateMap({ ground })} />
      <SliderField label="Winieta" unit="%" min={0} max={100} value={Math.round(map.vignette * 100)} defaultValue={0} onChange={(v) => updateMap({ vignette: v / 100 })} />
      <SliderField label="Sepia" unit="%" min={0} max={100} value={Math.round(map.sepia * 100)} defaultValue={0} onChange={(v) => updateMap({ sepia: v / 100 })} />
      <SliderField label="Ziarno filmowe" unit="%" min={0} max={40} value={Math.round(map.grain * 100)} defaultValue={0} onChange={(v) => updateMap({ grain: v / 100 })} />
      <p className="hint">Zmienia tylko mapę: trasa, kropka i napisy zostają w pełnym kolorze. Winieta przyciemnia brzegi do koloru pod mapą.</p>
    </Section>
  )
}

function MapLookSection() {
  const map = useAppStore((s) => s.map)
  const updateMap = useAppStore((s) => s.updateMap)
  return (
      <Section title="Wygląd mapy">
        <SliderField label="Przyciemnienie (minus: rozjaśnienie)" unit="%" min={-80} max={80} value={Math.round(map.dim * 100)} defaultValue={0} onChange={(v) => updateMap({ dim: v / 100 })} />
        <SliderField label="Nasycenie" unit="%" min={0} max={200} value={Math.round(map.saturation * 100)} defaultValue={100} onChange={(v) => updateMap({ saturation: v / 100 })} />
        <SliderField label="Rozmycie" unit="px" min={0} max={12} value={map.blur} defaultValue={DEFAULT_MAP.blur} onChange={(blur) => updateMap({ blur })} />
      </Section>
  )
}
