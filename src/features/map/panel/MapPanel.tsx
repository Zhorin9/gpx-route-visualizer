import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SelectField from '../../../components/fields/SelectField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Button from '../../../components/ui/Button'
import { useAppStore } from '../../../store/useAppStore'
import { creditFor, mapStyles, mapStyle, paletteFrom } from '../model/styles'
import { DEFAULT_MAP } from '../types'
import type { SelectOption } from '../../../types'

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

// Settings of the map background, under the "Rodzaj tła" switch.
export default function MapPanel() {
  const map = useAppStore((s) => s.map)
  const gradient = useAppStore((s) => s.collage.gradient)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const updateMap = useAppStore((s) => s.updateMap)
  const styleOptions: SelectOption[] = mapStyles().map((s) => ({ value: s.id, label: s.label }))

  return (
    <>
      <Section title="Mapa">
        <SelectField label="Styl mapy" value={map.styleId} options={styleOptions} onChange={(styleId) => updateMap({ styleId })} />
        <CheckboxField label="Kolory z szablonu stylu" checked={map.palette != null} onChange={(on) => updateMap({ palette: on ? paletteFrom(gradient, textColor) : null })} />
        {map.palette && (
          <Button size="sm" onClick={() => updateMap({ palette: paletteFrom(gradient, textColor) })}>
            Odśwież kolory z obecnego stylu
          </Button>
        )}
        <CheckboxField label="Nazwy miejscowości i dróg" checked={map.labels} onChange={(labels) => updateMap({ labels })} />
        <CheckboxField label="Cieniowanie terenu" checked={map.hillshade} onChange={(hillshade) => updateMap({ hillshade })} />
        <p className="hint">Mapa leży pod trasą i podąża za jej przesunięciem, obrotem i skalą. Napisy i trasa same dobierają kontrast do mapy.</p>
      </Section>
      <Section title="Wygląd mapy">
        <SliderField label="Przyciemnienie (minus: rozjaśnienie)" unit="%" min={-80} max={80} value={Math.round(map.dim * 100)} defaultValue={0} onChange={(v) => updateMap({ dim: v / 100 })} />
        <SliderField label="Nasycenie" unit="%" min={0} max={200} value={Math.round(map.saturation * 100)} defaultValue={100} onChange={(v) => updateMap({ saturation: v / 100 })} />
        <SliderField label="Rozmycie" unit="px" min={0} max={12} value={map.blur} defaultValue={DEFAULT_MAP.blur} onChange={(blur) => updateMap({ blur })} />
      </Section>
      <Section title="Źródło mapy">
        <p className="hint">
          „{creditFor(map)}” zostaje na grafice, bo wymaga tego licencja mapy. Możesz je przesunąć na kadrze, zmniejszyć i zmienić kolor. {mapStyle(map.styleId).terms}
        </p>
        <MapCreditFields />
      </Section>
    </>
  )
}
