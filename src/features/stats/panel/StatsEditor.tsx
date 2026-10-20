import SelectField from '../../../components/fields/SelectField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import TextField from '../../../components/fields/TextField'
import Button from '../../../components/ui/Button'
import CheckboxField from '../../../components/fields/CheckboxField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import StatConfigItem from './StatConfigItem'
import { DEFAULT_STATS_STYLE } from '../../../store/defaults'
import { useAppStore } from '../../../store/useAppStore'
import { FONT_OPTIONS } from '../../../utils/fonts'
import { formatNumber } from '../../../utils/format'
import type { SelectOption, StatsArrangement } from '../../../types'

const ARRANGEMENT_OPTIONS: SelectOption<StatsArrangement>[] = [
  { value: 'columns', label: 'Kolumny' },
  { value: 'row', label: 'W jednej linii' },
]

const DISTANCE_PRECISION_OPTIONS = [0, 1, 2].map((digits) => ({
  value: String(digits),
  label: `${formatNumber(15.678, digits)} km`,
}))

const ELEVATION_ROUND_OPTIONS = ['1', '5', '10', '50'].map((v) => ({ value: v, label: `Co ${v} m` }))

const OVERRIDE_PLACEHOLDER = 'puste = wyliczone z GPX'

export default function StatsEditor() {
  const style = useAppStore((s) => s.statsStyle)
  const content = useAppStore((s) => s.statsContent)
  const layout = useAppStore((s) => s.statsLayout)
  const placement = useAppStore((s) => s.placements.stats)
  const updateStatsStyle = useAppStore((s) => s.updateStatsStyle)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const setStatVisible = useAppStore((s) => s.setStatVisible)
  const setStatOverride = useAppStore((s) => s.setStatOverride)
  const resetStatsLayout = useAppStore((s) => s.resetStatsLayout)

  const isLayoutCustom = placement?.x != null || placement?.y != null || Object.keys(layout.chipOffsets).length > 0

  return (
    <>
      <p className="hint">
        Przeciągnij nagłówek na podglądzie, aby go przesunąć. W układzie „W jednej linii” możesz też wysunąć pojedynczy element z rzędu.
      </p>

      <Section title="Elementy">
        <StatConfigItem label="Etykieta dnia" checked={content.visible.day} onToggle={(v) => setStatVisible('day', v)}>
          <TextField label="Treść" value={content.dayLabel} onChange={(v) => updateStatsContent({ dayLabel: v })} />
        </StatConfigItem>

        <StatConfigItem label="Dystans" checked={content.visible.distance} onToggle={(v) => setStatVisible('distance', v)}>
          <SelectField
            label="Dokładność"
            value={String(content.distancePrecision)}
            options={DISTANCE_PRECISION_OPTIONS}
            onChange={(v) => updateStatsContent({ distancePrecision: Number(v) })}
          />
          <TextField
            label="Własna wartość"
            placeholder={OVERRIDE_PLACEHOLDER}
            value={content.overrides.distance}
            onChange={(v) => setStatOverride('distance', v)}
          />
        </StatConfigItem>

        <StatConfigItem label="Przewyższenie" checked={content.visible.elevation} onToggle={(v) => setStatVisible('elevation', v)}>
          <SelectField
            label="Zaokrąglenie"
            value={String(content.elevationRoundTo)}
            options={ELEVATION_ROUND_OPTIONS}
            onChange={(v) => updateStatsContent({ elevationRoundTo: Number(v) })}
          />
          <TextField
            label="Własna wartość"
            placeholder={OVERRIDE_PLACEHOLDER}
            value={content.overrides.elevation}
            onChange={(v) => setStatOverride('elevation', v)}
          />
        </StatConfigItem>

        <StatConfigItem label="Czas" checked={content.visible.time} onToggle={(v) => setStatVisible('time', v)}>
          <TextField
            label="Własna wartość"
            placeholder={OVERRIDE_PLACEHOLDER}
            value={content.overrides.time}
            onChange={(v) => setStatOverride('time', v)}
          />
        </StatConfigItem>
      </Section>

      <Section
        title="Wygląd"
        actions={
          isLayoutCustom && (
            <Button size="sm" variant="ghost" onClick={resetStatsLayout}>
              Wyrównaj
            </Button>
          )
        }
      >
        <Segmented
          label="Układ nagłówka"
          showLabel
          value={style.arrangement}
          options={ARRANGEMENT_OPTIONS}
          onChange={(arrangement) => updateStatsStyle({ arrangement })}
        />
        {style.arrangement === 'columns' && (
          <>
            <CheckboxField label="Etykiety nad wartościami" checked={style.labels} onChange={(labels) => updateStatsStyle({ labels })} />
            <CheckboxField label="Linie podziału" checked={style.dividers} onChange={(dividers) => updateStatsStyle({ dividers })} />
            <CheckboxField label="Rozciągnij na całą szerokość" checked={style.stretch} onChange={(stretch) => updateStatsStyle({ stretch })} />
          </>
        )}
        <SelectField label="Czcionka" value={style.fontFamily} onChange={(v) => updateStatsStyle({ fontFamily: v })} options={FONT_OPTIONS} />
        <ColorField label="Kolor" value={style.color} onChange={(v) => updateStatsStyle({ color: v })} />
        <SliderField
          label="Wielkość"
          unit="px"
          min={16}
          max={90}
          value={style.fontSize}
          defaultValue={DEFAULT_STATS_STYLE.fontSize}
          onChange={(v) => updateStatsStyle({ fontSize: v })}
        />
        {(style.arrangement === 'row' || !style.stretch) && (
          <SliderField
            label="Odstęp"
            unit="px"
            min={0}
            max={150}
            value={style.spacing}
            defaultValue={DEFAULT_STATS_STYLE.spacing}
            onChange={(v) => updateStatsStyle({ spacing: v })}
          />
        )}
        <SliderField
          label="Obrót"
          unit="°"
          min={-180}
          max={180}
          value={style.rotation}
          defaultValue={0}
          snapPoints={[0, -90, 90]}
          onChange={(v) => updateStatsStyle({ rotation: v })}
        />
      </Section>
    </>
  )
}
