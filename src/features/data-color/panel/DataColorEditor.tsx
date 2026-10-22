import CheckboxField from '../../../components/fields/CheckboxField'
import { IconInfo } from '../../../components/icons'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { PALETTES, paletteCss } from '../../../core/data/palettes'
import { DATA_SOURCES, dataSource, type DataSourceId } from '../../../core/data/sources'
import ColorField from '../../../components/fields/ColorField'
import { useAppStore } from '../../../store/useAppStore'
import { selectTrack, selectRouteDays } from '../../../store/derived'
import type { GpxTrack, SelectOption } from '../../../types'
import type { DataColorSettings } from '../types'
import { useActiveDataColor } from '../useDataColoring'
import './DataColorEditor.css'

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
  const track = useAppStore(selectTrack)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const active = useActiveDataColor()

  const missing = DATA_SOURCES.flatMap((src) => {
    const why = track ? src.unavailable(track) : null
    return why ? [`${src.label.toLowerCase()} (${why})`] : []
  })
  const options: SelectOption<DataSourceId>[] = DATA_SOURCES.map((src) => ({
    value: src.id,
    label: src.label,
    disabled: track != null && src.unavailable(track) != null,
  }))
  const unavailable = settings.source !== 'none' && track ? dataSource(settings.source).unavailable(track) : null

  function chooseRange(rangeMode: DataColorSettings['rangeMode']) {
    // Start the manual range from what auto was showing.
    if (rangeMode === 'manual' && active) updateDataColor({ rangeMode, min: Math.round(active.domain[0]), max: Math.round(active.domain[1]) })
    else updateDataColor({ rangeMode })
  }

  return (
    <>
      {settings.source !== 'none' && (
        <>
          <Segmented label="Dane" showLabel value={settings.source} options={options} onChange={(source) => updateDataColor({ source })} />
          {missing.length > 0 && (
            <p className="note">
              <IconInfo />
              Niedostępne w tym pliku: {missing.join(', ')}.
            </p>
          )}
        </>
      )}
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

const MODE_OPTIONS: SelectOption<'single' | 'data'>[] = [
  { value: 'single', label: 'Jeden kolor' },
  { value: 'data', label: 'Wg danych' },
]

// The first source this file has data for: speed and heart rate tell the most about a ride.
function firstAvailable(track: GpxTrack | null): DataSourceId {
  return DATA_SOURCES.find((s) => !track || !s.unavailable(track))?.id ?? 'elevation'
}

function LineColor() {
  const color = useAppStore((s) => s.routeStyle.color)
  const multiDay = useAppStore((s) => selectRouteDays(s).length > 1)
  const updateRouteStyle = useAppStore((s) => s.updateRouteStyle)
  if (multiDay) return <p className="hint">Trasa ma kilka dni: każdy dzień ma własny kolor, ustawiany w podzakładce „Linia”.</p>
  return <ColorField label="Kolor" value={color} onChange={(c) => updateRouteStyle({ color: c })} />
}

// Trasa → Kolor: one colour for the line, or colours from the recorded data.
export function ColorPage() {
  const source = useAppStore((s) => s.dataColor.source)
  const track = useAppStore(selectTrack)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const mode = source === 'none' ? 'single' : 'data'
  return (
    <Section title="Kolor linii">
      <Segmented
        label="Kolor linii"
        value={mode}
        options={MODE_OPTIONS}
        onChange={(m) => updateDataColor({ source: m === 'single' ? 'none' : firstAvailable(track) })}
      />
      {mode === 'single' ? <LineColor /> : <DataColorSettingsFields />}
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
