import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { formatGain } from '../../../core/units'
import { formatNumber } from '../../../utils/format'
import { useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { DEFAULT_PROFILE, PROFILE_KIND, type ProfileChartStyle, type ProfilePlacement } from '../types'
import { useProfileData } from '../useProfile'
import type { SelectOption } from '../../../types'

const STYLE_OPTIONS: SelectOption<ProfileChartStyle>[] = [
  { value: 'area', label: 'Wypełniony' },
  { value: 'line', label: 'Linia' },
  { value: 'bars', label: 'Słupki' },
]

const PLACEMENT_OPTIONS: SelectOption<ProfilePlacement>[] = [
  { value: 'bottom', label: 'Dół kadru' },
  { value: 'top', label: 'Góra kadru' },
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

// Everything about the chart; shown in Trasa and, while the chart is selected, in Napisy.
export function ElevationProfileSettings() {
  const settings = useAppStore((s) => s.profile)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const placedByHand = useAppStore((s) => s.placements[PROFILE_KIND] != null)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setProfilePlacement = useAppStore((s) => s.setProfilePlacement)

  return (
    <>
      <Segmented label="Styl wykresu" showLabel value={settings.style} options={STYLE_OPTIONS} onChange={(style) => updateProfile({ style })} />
      <Segmented
        label="Położenie"
        showLabel
        value={settings.placement}
        options={PLACEMENT_OPTIONS}
        onChange={setProfilePlacement}
      />
      {placedByHand && <p className="hint">Wykres przesunięto ręcznie. Wybierz położenie, aby wrócić do ustawienia automatycznego.</p>}
      <SliderField label="Szerokość" unit="%" min={30} max={100} value={settings.widthPct} defaultValue={DEFAULT_PROFILE.widthPct} onChange={(widthPct) => updateProfile({ widthPct })} />
      <SliderField label="Wysokość" unit="px" min={100} max={500} step={10} value={settings.height} defaultValue={DEFAULT_PROFILE.height} onChange={(height) => updateProfile({ height })} />
      <CheckboxField label="Kolor jak trasa" checked={settings.color == null} onChange={(same) => updateProfile({ color: same ? null : routeColor })} />
      {settings.color != null && <ColorField label="Kolor wykresu" value={settings.color} onChange={(color) => updateProfile({ color })} />}

      <h6 className="subhead">Podjazdy</h6>
      <CheckboxField label="Podświetl podjazdy" checked={settings.highlightClimbs} onChange={(highlightClimbs) => updateProfile({ highlightClimbs })} />
      {settings.highlightClimbs && (
        <CheckboxField label="Wznios nad podjazdami" checked={settings.climbLabels} onChange={(climbLabels) => updateProfile({ climbLabels })} />
      )}
      <ClimbSummary />

      <h6 className="subhead">Opisy</h6>
      <CheckboxField label="Suma przewyższeń" checked={settings.showTotal} onChange={(showTotal) => updateProfile({ showTotal })} />
      <CheckboxField label="Wysokość min. i maks." checked={settings.showMinMax} onChange={(showMinMax) => updateProfile({ showMinMax })} />
      <CheckboxField label="Dystans pod wykresem" checked={settings.showDistance} onChange={(showDistance) => updateProfile({ showDistance })} />

      <h6 className="subhead">Znacznik</h6>
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

// Section in Trasa: switching the chart on and its settings.
export function ElevationProfileSection() {
  const hasRoute = useHasRoute()
  const enabled = useAppStore((s) => s.profile.enabled)
  const updateProfile = useAppStore((s) => s.updateProfile)
  if (!hasRoute) return null
  return (
    <Section title="Profil wysokości" collapseId="profile">
      <CheckboxField label="Pokaż wykres na grafice" checked={enabled} onChange={(on) => updateProfile({ enabled: on })} />
      {enabled && <ElevationProfileSettings />}
    </Section>
  )
}

export default function ElevationProfileEditor() {
  const updateProfile = useAppStore((s) => s.updateProfile)
  const select = useAppStore((s) => s.select)
  return (
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
  )
}
