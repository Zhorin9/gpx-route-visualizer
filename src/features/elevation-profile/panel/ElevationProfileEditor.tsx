import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { PALETTES, paletteCss, paletteStops } from '../../../core/data/palettes'
import { dataSource, type DataSourceId } from '../../../core/data/sources'
import { distanceUnit, formatGain, type Units } from '../../../core/units'
import { formatNumber } from '../../../utils/format'
import { selectTrack } from '../../../store/derived'
import { useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { DEFAULT_PROFILE, PROFILE_KIND, type ProfileChartStyle, type ProfileColorMode, type ProfileLayout, type ProfileSettings } from '../types'
import { paletteSource, sampledSource, sourceDomain, useProfileData } from '../useProfile'
import GradientStopsEditor from './GradientStopsEditor'
import type { SelectOption } from '../../../types'
import '../../data-color/panel/DataColorEditor.css'
import './ElevationProfileEditor.css'

const COLOR_MODE_OPTIONS: SelectOption<ProfileColorMode>[] = [
  { value: 'route', label: 'Jak trasa' },
  { value: 'palette', label: 'Własna paleta' },
  { value: 'single', label: 'Jeden kolor' },
]

const COLOR_BY: DataSourceId[] = ['elevation', 'grade', 'speed', 'heartRate']

const STYLE_OPTIONS: SelectOption<ProfileChartStyle>[] = [
  { value: 'line', label: 'Linia' },
  { value: 'area', label: 'Wypełnienie' },
  { value: 'bars', label: 'Słupki' },
  { value: 'steps', label: 'Schodki' },
]

const LAYOUT_OPTIONS: SelectOption<ProfileLayout>[] = [
  { value: 'low', label: 'Niski pasek' },
  { value: 'tall', label: 'Wysoki' },
  { value: 'overlay', label: 'Nałożony na dół' },
]

const SCALE_OPTIONS: SelectOption<ProfileSettings['scale']>[] = [
  { value: 'auto', label: 'Automatyczna' },
  { value: 'zero', label: 'Od zera' },
]

const UNIT_OPTIONS: SelectOption<Units>[] = [
  { value: 'metric', label: 'm / km' },
  { value: 'imperial', label: 'ft / mi' },
]

function climbsLabel(count: number) {
  if (count === 1) return '1 podjazd'
  return `${count} ${count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'podjazdy' : 'podjazdów'}`
}

function ClimbSummary() {
  const units = useAppStore((s) => s.statsContent.units)
  const data = useProfileData(64)
  if (!data) return null
  if (!data.climbs.length) return <p className="hint">Brak podjazdów: żaden odcinek nie ma co najmniej 30 m wzniosu przy nachyleniu od 3%.</p>
  return (
    <p className="hint">
      {climbsLabel(data.climbs.length)}: {data.climbs.map((c) => `${formatGain(c.gainM, units, 5)} (${formatNumber(c.avgGrade, 1)}%)`).join(', ')}
    </p>
  )
}

// A shortcut to colour by data with the grade as source (full settings in "Kolor według danych").
function GradeColoringToggle() {
  const source = useAppStore((s) => s.dataColor.source)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  return (
    <CheckboxField
      label="Koloruj trasę według nachylenia"
      checked={source === 'grade'}
      onChange={(on) => updateDataColor({ source: on ? 'grade' : 'none' })}
    />
  )
}

// The profile's own colour scale: what it follows, a palette to start from and its movable colours.
function OwnPalette() {
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const track = useAppStore(selectTrack)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const data = useProfileData(64)
  if (!track) return null

  const options = COLOR_BY.map((id) => ({ value: id, label: dataSource(id).label, disabled: dataSource(id).unavailable(track) != null }))
  const source = paletteSource(track, settings.colorBy)
  const [lo, hi] = data ? sourceDomain(sampledSource(data, source), source) : [0, 1]
  const format = (v: number) => dataSource(source).format(v, units)
  const stopsKey = JSON.stringify(settings.stops)

  return (
    <>
      <Segmented label="Kolor według" showLabel value={source} options={options} onChange={(colorBy) => updateProfile({ colorBy })} />
      <div className="field">
        <span className="field-label">Paleta</span>
        <div className="palette-picker" role="radiogroup" aria-label="Paleta profilu">
          {PALETTES.map((p) => {
            const active = JSON.stringify(paletteStops(p)) === stopsKey
            return (
              <button key={p.id} type="button" role="radio" aria-checked={active} className={active ? 'palette-option active' : 'palette-option'} onClick={() => updateProfile({ stops: paletteStops(p) })}>
                <span className="palette-swatch" style={{ background: paletteCss(p) }} />
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <span className="field-label">Własny gradient</span>
      <GradientStopsEditor stops={settings.stops} onChange={(stops) => updateProfile({ stops })} scale={[format(lo), format((lo + hi) / 2), format(hi)]} />
    </>
  )
}

// Everything about the chart; shown in Trasa and, while the chart is selected, in Napisy.
export function ElevationProfileSettings() {
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const routeByData = useAppStore((s) => s.dataColor.source !== 'none')
  const placedByHand = useAppStore((s) => s.placements[PROFILE_KIND] != null)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setProfileLayout = useAppStore((s) => s.setProfileLayout)
  const filled = settings.style === 'area' || settings.style === 'steps'

  return (
    <>
      <h6 className="subhead">Kolor profilu</h6>
      <Segmented label="Kolor profilu" value={settings.colorMode} options={COLOR_MODE_OPTIONS} onChange={(colorMode) => updateProfile({ colorMode })} />
      {settings.colorMode === 'route' && <p className="hint">{routeByData ? 'Profil ma kolory trasy według danych.' : 'Profil ma kolor linii trasy.'}</p>}
      {settings.colorMode === 'palette' && <OwnPalette />}
      {settings.colorMode === 'single' && <ColorField label="Kolor wykresu" value={settings.color} onChange={(color) => updateProfile({ color })} />}
      {filled && (
        <SliderField
          label="Przezroczystość wypełnienia"
          unit="%"
          min={5}
          value={Math.round(settings.fillOpacity * 100)}
          defaultValue={Math.round(DEFAULT_PROFILE.fillOpacity * 100)}
          onChange={(v) => updateProfile({ fillOpacity: v / 100 })}
        />
      )}

      <Segmented label="Styl" showLabel value={settings.style} options={STYLE_OPTIONS} onChange={(style) => updateProfile({ style })} />
      <Segmented label="Wysokość i położenie" showLabel value={settings.layout} options={LAYOUT_OPTIONS} onChange={setProfileLayout} />
      {placedByHand && <p className="hint">Wykres przesunięto ręcznie. Wybierz położenie, aby wrócić do ustawienia automatycznego.</p>}

      <h6 className="subhead">Oznaczenia</h6>
      <CheckboxField label="Najwyższy punkt" checked={settings.peak} onChange={(peak) => updateProfile({ peak })} />
      <CheckboxField label="Start i meta" checked={settings.startFinish} onChange={(startFinish) => updateProfile({ startFinish })} />
      <CheckboxField label={`Znaczniki co 10 ${distanceUnit(units)}`} checked={settings.kmTicks} onChange={(kmTicks) => updateProfile({ kmTicks })} />
      <CheckboxField label="Zaznacz nachylenia powyżej progu" checked={settings.steep} onChange={(steep) => updateProfile({ steep })} />
      {settings.steep && (
        <SliderField label="Próg nachylenia" unit="%" min={2} max={20} value={settings.steepGrade} defaultValue={DEFAULT_PROFILE.steepGrade} onChange={(steepGrade) => updateProfile({ steepGrade })} />
      )}
      <CheckboxField label="Suma przewyższeń" checked={settings.showTotal} onChange={(showTotal) => updateProfile({ showTotal })} />
      <CheckboxField label="Wysokość min. i maks." checked={settings.showMinMax} onChange={(showMinMax) => updateProfile({ showMinMax })} />
      {settings.layout !== 'overlay' && (
        <CheckboxField label="Dystans pod wykresem" checked={settings.showDistance} onChange={(showDistance) => updateProfile({ showDistance })} />
      )}
      <CheckboxField label="Podświetl podjazdy" checked={settings.highlightClimbs} onChange={(highlightClimbs) => updateProfile({ highlightClimbs })} />
      {settings.highlightClimbs && (
        <>
          <CheckboxField label="Wznios nad podjazdami" checked={settings.climbLabels} onChange={(climbLabels) => updateProfile({ climbLabels })} />
          <ClimbSummary />
        </>
      )}
      <GradeColoringToggle />
      <CheckboxField label="Znacznik na trasie i wykresie" checked={settings.marker} onChange={(marker) => updateProfile({ marker })} />
      {settings.marker && (
        <SliderField
          label="Położenie znacznika"
          unit="%"
          min={0}
          max={100}
          value={Math.round(settings.markerAt * 100)}
          defaultValue={50}
          onChange={(v) => updateProfile({ markerAt: v / 100 })}
        />
      )}
    </>
  )
}

// Folded under the main settings: scale, smoothing, grid, width and units.
function ElevationProfileAdvanced() {
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  return (
    <Section title="Zaawansowane" collapseId="profile-advanced">
      <Segmented label="Skala pionowa" showLabel value={settings.scale} options={SCALE_OPTIONS} onChange={(scale) => updateProfile({ scale })} />
      <SliderField
        label="Przewyższenie (rozciągnięcie pionowe)"
        unit="×"
        min={0.5}
        max={3}
        step={0.1}
        value={settings.exaggeration}
        defaultValue={DEFAULT_PROFILE.exaggeration}
        onChange={(exaggeration) => updateProfile({ exaggeration })}
      />
      <SliderField label="Wygładzanie śladu" min={0} max={10} value={settings.smoothing} defaultValue={DEFAULT_PROFILE.smoothing} onChange={(smoothing) => updateProfile({ smoothing })} />
      <CheckboxField label="Siatka i etykiety osi" checked={settings.grid} onChange={(grid) => updateProfile({ grid })} />
      {settings.layout !== 'overlay' && (
        <SliderField label="Szerokość" unit="%" min={30} max={100} value={settings.widthPct} defaultValue={DEFAULT_PROFILE.widthPct} onChange={(widthPct) => updateProfile({ widthPct })} />
      )}
      <Segmented label="Jednostki" showLabel value={units} options={UNIT_OPTIONS} onChange={(u) => updateStatsContent({ units: u })} />
    </Section>
  )
}

// Section in Trasa: switching the chart on and its settings.
export function ElevationProfileSection() {
  const hasRoute = useHasRoute()
  const enabled = useAppStore((s) => s.profile.enabled)
  const updateProfile = useAppStore((s) => s.updateProfile)
  if (!hasRoute) return null
  return (
    <>
      <Section title="Profil wysokości" collapseId="profile">
        <CheckboxField label="Pokaż profil wysokości" checked={enabled} onChange={(on) => updateProfile({ enabled: on })} />
        {enabled && <ElevationProfileSettings />}
      </Section>
      {enabled && <ElevationProfileAdvanced />}
    </>
  )
}

export default function ElevationProfileEditor() {
  const updateProfile = useAppStore((s) => s.updateProfile)
  const select = useAppStore((s) => s.select)
  return (
    <>
      <Section title="Profil wysokości">
        <ElevationProfileSettings />
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            updateProfile({ enabled: false })
            select(null)
          }}
        >
          Usuń wykres z grafiki
        </button>
      </Section>
      <ElevationProfileAdvanced />
    </>
  )
}
