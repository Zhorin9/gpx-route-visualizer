import CheckboxField from '../../../components/fields/CheckboxField'
import SelectField from '../../../components/fields/SelectField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { PALETTES, paletteCss } from '../../../core/data/palettes'
import { DATA_SOURCES, dataSource } from '../../../core/data/sources'
import { useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import type { SelectOption } from '../../../types'
import type { ColorSource, DataColorSettings } from '../types'
import { useActiveDataColor } from '../useDataColoring'

const GLOW_OPTIONS: SelectOption<DataColorSettings['glow']>[] = [
  { value: 'follow', label: 'Jak linia' },
  { value: 'uniform', label: 'Jednolita' },
]

const RANGE_OPTIONS: SelectOption<DataColorSettings['rangeMode']>[] = [
  { value: 'auto', label: 'Automatyczny' },
  { value: 'manual', label: 'Własny' },
]

function PalettePicker() {
  const current = useAppStore((s) => s.dataColor.palette)
  const inverted = useAppStore((s) => s.dataColor.inverted)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  return (
    <div className="field">
      <span className="field-label">Paleta</span>
      <div className="palette-picker" role="radiogroup" aria-label="Paleta">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === current}
            className={p.id === current ? 'palette-option active' : 'palette-option'}
            onClick={() => updateDataColor({ palette: p.id })}
          >
            <span className="palette-swatch" style={{ background: paletteCss(p, inverted) }} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Manual range in the source's own (metric) unit; the slider spans what the track contains.
function ManualRange() {
  const settings = useAppStore((s) => s.dataColor)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const active = useActiveDataColor()
  if (!active) return null
  const source = dataSource(active.sourceId)
  let lo = Infinity
  let hi = -Infinity
  for (const v of active.series) {
    if (!Number.isFinite(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const step = hi - lo > 50 ? 1 : 0.5
  const min = Math.floor(lo)
  const max = Math.max(min + 1, Math.ceil(hi))
  const unit = source.unit('metric')
  return (
    <>
      <SliderField label={`Od (${unit})`} min={min} max={max} step={step} value={Math.min(settings.min, settings.max)} onChange={(v) => updateDataColor({ min: v })} />
      <SliderField label={`Do (${unit})`} min={min} max={max} step={step} value={Math.max(settings.min, settings.max)} onChange={(v) => updateDataColor({ max: v })} />
    </>
  )
}

export function DataColorSettingsFields() {
  const settings = useAppStore((s) => s.dataColor)
  const glowEnabled = useAppStore((s) => s.routeStyle.glowEnabled)
  const track = useAppStore((s) => s.track)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const active = useActiveDataColor()

  const options: SelectOption<ColorSource>[] = [
    { value: 'none', label: 'Jeden kolor' },
    ...DATA_SOURCES.map((src) => {
      const why = track ? src.unavailable(track) : null
      return { value: src.id, label: why ? `${src.label} (${why})` : src.label }
    }),
  ]
  const unavailable = settings.source !== 'none' && track ? dataSource(settings.source).unavailable(track) : null

  function chooseRange(rangeMode: DataColorSettings['rangeMode']) {
    // Start the manual range from what auto was showing.
    if (rangeMode === 'manual' && active) updateDataColor({ rangeMode, min: Math.round(active.domain[0]), max: Math.round(active.domain[1]) })
    else updateDataColor({ rangeMode })
  }

  return (
    <>
      <SelectField label="Koloruj według" value={settings.source} options={options} onChange={(source) => updateDataColor({ source })} />
      {unavailable && <p className="hint">Ten plik GPX nie ma tych danych ({unavailable}) — trasa zostaje w jednym kolorze.</p>}
      {settings.source !== 'none' && !unavailable && (
        <>
          <PalettePicker />
          <CheckboxField label="Odwróć kolory" checked={settings.inverted} onChange={(inverted) => updateDataColor({ inverted })} />
          <Segmented label="Zakres wartości" showLabel value={settings.rangeMode} options={RANGE_OPTIONS} onChange={chooseRange} />
          {settings.rangeMode === 'manual' && <ManualRange />}
          {glowEnabled && <Segmented label="Poświata" showLabel value={settings.glow} options={GLOW_OPTIONS} onChange={(glow) => updateDataColor({ glow })} />}
          <CheckboxField label="Legenda na grafice" checked={settings.legend} onChange={(legend) => updateDataColor({ legend })} />
        </>
      )}
    </>
  )
}

export function DataColorSection() {
  const hasRoute = useHasRoute()
  if (!hasRoute) return null
  return (
    <Section title="Kolor według danych" collapseId="data-color">
      <DataColorSettingsFields />
    </Section>
  )
}

export default function ColorLegendEditor() {
  return (
    <Section title="Legenda kolorów">
      <DataColorSettingsFields />
    </Section>
  )
}
