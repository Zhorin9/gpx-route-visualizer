import { useState, type ComponentType } from 'react'
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
import { useHasRoute, useRangeStats } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { FONT_OPTIONS } from '../../../utils/fonts'
import { formatNumber } from '../../../utils/format'
import { distanceUnit, heightUnit, type Units } from '../../../core/units'
import { STAT_DEFINITIONS, statDefinition, type StatDefinition } from '../model/definitions'
import { STATS_ARRANGEMENTS } from '../model/registry'
import type { RangeStats, SelectOption, StatKey, StatsArrangement, StatsContent } from '../../../types'

const ARRANGEMENT_OPTIONS: SelectOption<StatsArrangement>[] = STATS_ARRANGEMENTS.map((a) => ({ value: a.id, label: a.label }))

const UNIT_OPTIONS: SelectOption<Units>[] = [
  { value: 'metric', label: 'km, m' },
  { value: 'imperial', label: 'mi, ft' },
]

const OVERRIDE_PLACEHOLDER = 'puste = wyliczone z GPX'

type OverridableKey = keyof StatsContent['overrides']

function OverrideField({ statKey }: { statKey: OverridableKey }) {
  const value = useAppStore((s) => s.statsContent.overrides[statKey])
  const setStatOverride = useAppStore((s) => s.setStatOverride)
  return <TextField label="Własna wartość" placeholder={OVERRIDE_PLACEHOLDER} value={value} onChange={(v) => setStatOverride(statKey, v)} />
}

function DaySettings() {
  const dayLabel = useAppStore((s) => s.statsContent.dayLabel)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  return <TextField label="Treść" value={dayLabel} onChange={(v) => updateStatsContent({ dayLabel: v })} />
}

function DistanceSettings() {
  const precision = useAppStore((s) => s.statsContent.distancePrecision)
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const options = [0, 1, 2].map((digits) => ({ value: String(digits), label: `${formatNumber(15.678, digits)} ${distanceUnit(units)}` }))
  return (
    <>
      <SelectField label="Dokładność" value={String(precision)} options={options} onChange={(v) => updateStatsContent({ distancePrecision: Number(v) })} />
      <OverrideField statKey="distance" />
    </>
  )
}

function ElevationSettings({ statKey }: { statKey: OverridableKey }) {
  const roundTo = useAppStore((s) => s.statsContent.elevationRoundTo)
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const options = ['1', '5', '10', '50'].map((v) => ({ value: v, label: `Co ${v} ${heightUnit(units)}` }))
  return (
    <>
      <SelectField label="Zaokrąglenie" value={String(roundTo)} options={options} onChange={(v) => updateStatsContent({ elevationRoundTo: Number(v) })} />
      <OverrideField statKey={statKey} />
    </>
  )
}

// Extra settings shown under a ticked stat; every figure can be typed by hand.
const STAT_SETTINGS: Record<StatKey, ComponentType> = {
  day: DaySettings,
  distance: DistanceSettings,
  elevation: () => <ElevationSettings statKey="elevation" />,
  maxElevation: () => <ElevationSettings statKey="maxElevation" />,
  time: () => <OverrideField statKey="time" />,
  movingTime: () => <OverrideField statKey="movingTime" />,
  avgSpeed: () => <OverrideField statKey="avgSpeed" />,
}

function unavailableReason(def: StatDefinition, stats: RangeStats | null): string | undefined {
  if (!stats) return undefined
  if (def.requires === 'time' && stats.durationMs <= 0) return 'brak czasu w pliku'
  if (def.requires === 'elevation' && stats.maxElevationM == null) return 'brak wysokości w pliku'
  return undefined
}

function StatsList() {
  const content = useAppStore((s) => s.statsContent)
  const setStatVisible = useAppStore((s) => s.setStatVisible)
  const moveStat = useAppStore((s) => s.moveStat)
  const stats = useRangeStats()
  const [dragKey, setDragKey] = useState<StatKey | null>(null)
  const [overKey, setOverKey] = useState<StatKey | null>(null)
  const { order } = content

  return (
    <div className="stat-list" role="list" aria-label="Statystyki">
      {order.map((key, index) => {
        const def = statDefinition(key)
        if (!def) return null
        const Settings = STAT_SETTINGS[key]
        return (
          <div role="listitem" key={key}>
            <StatConfigItem
              label={def.label}
              checked={content.visible[key]}
              onToggle={(v) => setStatVisible(key, v)}
              unavailable={unavailableReason(def, stats)}
              onMove={(step) => moveStat(key, index + step)}
              isFirst={index === 0}
              isLast={index === order.length - 1}
              dropTarget={overKey === key && dragKey !== key}
              dragProps={{
                draggable: true,
                onDragStart: (e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  setDragKey(key)
                },
                onDragOver: (e) => {
                  if (!dragKey) return
                  e.preventDefault()
                  setOverKey(key)
                },
                onDrop: (e) => {
                  e.preventDefault()
                  if (dragKey) moveStat(dragKey, index)
                  setDragKey(null)
                  setOverKey(null)
                },
                onDragEnd: () => {
                  setDragKey(null)
                  setOverKey(null)
                },
              }}
            >
              <Settings />
            </StatConfigItem>
          </div>
        )
      })}
    </div>
  )
}

// The Dane tab: the stats header's settings, once there is a route to count.
export function StatsSection() {
  const hasRoute = useHasRoute()
  if (!hasRoute) return <p className="hint">Wgraj plik GPX, aby ustawić statystyki.</p>
  return <StatsEditor />
}

export default function StatsEditor() {
  const style = useAppStore((s) => s.statsStyle)
  const content = useAppStore((s) => s.statsContent)
  const layout = useAppStore((s) => s.statsLayout)
  const placement = useAppStore((s) => s.placements.stats)
  const updateStatsStyle = useAppStore((s) => s.updateStatsStyle)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const resetStatsLayout = useAppStore((s) => s.resetStatsLayout)

  const isLayoutCustom = placement?.x != null || placement?.y != null || Object.keys(layout.chipOffsets).length > 0
  const captioned = style.arrangement !== 'row'
  const hasColumns = style.arrangement === 'columns' || style.arrangement === 'grid'
  const heroOptions: SelectOption<StatKey>[] = content.order
    .filter((key) => content.visible[key])
    .map((key) => ({ value: key, label: STAT_DEFINITIONS.find((d) => d.key === key)?.label ?? key }))

  return (
    <>
      <p className="hint">
        Przeciągnij nagłówek na podglądzie, aby go przesunąć. W układzie „W jednej linii” możesz też wysunąć pojedynczy element z rzędu.
      </p>

      <Section title="Statystyki">
        <Segmented label="Jednostki" showLabel value={content.units} options={UNIT_OPTIONS} onChange={(units) => updateStatsContent({ units })} />
        <StatsList />
        <p className="hint">Kolejność zmienisz, przeciągając wiersz lub strzałkami. Czas w ruchu pomija postoje.</p>
      </Section>

      <Section
        title="Wygląd statystyk"
        actions={
          isLayoutCustom && (
            <Button size="sm" variant="ghost" onClick={resetStatsLayout}>
              Wyrównaj
            </Button>
          )
        }
      >
        <SelectField label="Układ nagłówka" value={style.arrangement} options={ARRANGEMENT_OPTIONS} onChange={(arrangement) => updateStatsStyle({ arrangement })} />
        {style.arrangement === 'hero' && heroOptions.length > 0 && (
          <>
            <SelectField
              label="Duża liczba"
              value={heroOptions.some((o) => o.value === style.heroKey) ? style.heroKey : heroOptions[0].value}
              options={heroOptions}
              onChange={(heroKey) => updateStatsStyle({ heroKey })}
            />
            <CheckboxField label="Pozostałe liczby pod spodem" checked={style.heroSecondary} onChange={(heroSecondary) => updateStatsStyle({ heroSecondary })} />
          </>
        )}
        {captioned && <CheckboxField label="Etykiety nad wartościami" checked={style.labels} onChange={(labels) => updateStatsStyle({ labels })} />}
        {hasColumns && (
          <>
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
        {(style.arrangement !== 'columns' || !style.stretch) && (
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
