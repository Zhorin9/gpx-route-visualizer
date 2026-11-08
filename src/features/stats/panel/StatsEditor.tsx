import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import SelectField from '../../../components/fields/SelectField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import TextField from '../../../components/fields/TextField'
import Button from '../../../components/ui/Button'
import CheckboxField from '../../../components/fields/CheckboxField'
import Section from '../../../components/ui/Section'
import StatConfigItem from './StatConfigItem'
import { DEFAULT_STATS_STYLE } from '../../../store/defaults'
import { useRangeStats } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import FontField from '../../../components/fields/FontField'
import RotationField from '../../../components/fields/RotationField'
import ShadowField from '../../../components/fields/ShadowField'
import { formatNumber } from '../../../utils/format'
import { distanceUnit, heightUnit } from '../../../core/units'
import { STAT_DEFINITIONS, statDefinition, type StatDefinition } from '../model/definitions'
import { STATS_ARRANGEMENTS } from '../model/registry'
import type { RangeStats, SelectOption, StatKey, StatsContent } from '../../../types'
import type { TKey } from '../../../i18n'
import './StatsEditor.css'

type OverridableKey = keyof StatsContent['overrides']

function OverrideField({ statKey }: { statKey: OverridableKey }) {
  const value = useAppStore((s) => s.statsContent.overrides[statKey])
  const setStatOverride = useAppStore((s) => s.setStatOverride)
  const { t } = useTranslation()
  return <TextField label={t('stats.panel.customValue')} placeholder={t('stats.panel.overridePlaceholder')} value={value} onChange={(v) => setStatOverride(statKey, v)} />
}

function DaySettings() {
  const dayLabel = useAppStore((s) => s.statsContent.dayLabel)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const { t } = useTranslation()
  return <TextField label={t('stats.panel.dayText')} value={dayLabel} onChange={(v) => updateStatsContent({ dayLabel: v })} />
}

function DistanceSettings() {
  const precision = useAppStore((s) => s.statsContent.distancePrecision)
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const { t } = useTranslation()
  const options = [0, 1, 2].map((digits) => ({ value: String(digits), label: `${formatNumber(15.678, digits)} ${distanceUnit(units)}` }))
  return (
    <>
      <SelectField label={t('stats.panel.precision')} value={String(precision)} options={options} onChange={(v) => updateStatsContent({ distancePrecision: Number(v) })} />
      <OverrideField statKey="distance" />
    </>
  )
}

function ElevationSettings({ statKey }: { statKey: OverridableKey }) {
  const roundTo = useAppStore((s) => s.statsContent.elevationRoundTo)
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const { t } = useTranslation()
  const options = ['1', '5', '10', '50'].map((v) => ({ value: v, label: t('stats.panel.roundTo', { step: v, unit: heightUnit(units) }) }))
  return (
    <>
      <SelectField label={t('stats.panel.rounding')} value={String(roundTo)} options={options} onChange={(v) => updateStatsContent({ elevationRoundTo: Number(v) })} />
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

function unavailableReason(def: StatDefinition, stats: RangeStats | null): TKey | undefined {
  if (!stats) return undefined
  if (def.requires === 'time' && stats.durationMs <= 0) return 'stats.panel.noTime'
  if (def.requires === 'elevation' && stats.maxElevationM == null) return 'stats.panel.noElevation'
  return undefined
}

function StatsList() {
  const content = useAppStore((s) => s.statsContent)
  const setStatVisible = useAppStore((s) => s.setStatVisible)
  const moveStat = useAppStore((s) => s.moveStat)
  const { t } = useTranslation()
  const stats = useRangeStats()
  const [dragKey, setDragKey] = useState<StatKey | null>(null)
  const [overKey, setOverKey] = useState<StatKey | null>(null)
  const { order } = content

  return (
    <div className="stat-list" role="list" aria-label={t('stats.section')}>
      {order.map((key, index) => {
        const def = statDefinition(key)
        if (!def) return null
        const Settings = STAT_SETTINGS[key]
        const reason = unavailableReason(def, stats)
        return (
          <div role="listitem" key={key}>
            <StatConfigItem
              label={t(def.label)}
              checked={content.visible[key]}
              onToggle={(v) => setStatVisible(key, v)}
              unavailable={reason && t(reason)}
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

function EstimatedNote() {
  const estimated = useRangeStats()?.estimatedTime
  const { t } = useTranslation()
  return estimated ? <p className="hint">{t('stats.panel.estimatedNote')}</p> : null
}

export default function StatsEditor() {
  const style = useAppStore((s) => s.statsStyle)
  const content = useAppStore((s) => s.statsContent)
  const layout = useAppStore((s) => s.statsLayout)
  const placement = useAppStore((s) => s.placements.stats)
  const updateStatsStyle = useAppStore((s) => s.updateStatsStyle)
  const resetStatsLayout = useAppStore((s) => s.resetStatsLayout)
  const { t } = useTranslation()

  const isLayoutCustom = placement?.x != null || placement?.y != null || Object.keys(layout.chipOffsets).length > 0
  const captioned = style.arrangement !== 'row'
  const hasColumns = style.arrangement === 'columns' || style.arrangement === 'grid'
  const heroOptions: SelectOption<StatKey>[] = content.order
    .filter((key) => content.visible[key])
    .map((key) => {
      const label = STAT_DEFINITIONS.find((d) => d.key === key)?.label
      return { value: key, label: label ? t(label) : key }
    })

  return (
    <>
      <p className="hint">
        {t('stats.panel.dragHint')}
      </p>

      <Section title={t('stats.section')}>
        <StatsList />
        <p className="hint">{t('stats.panel.orderHint')}</p>
        <EstimatedNote />
      </Section>

      <Section
        title={t('stats.panel.look')}
        actions={
          isLayoutCustom && (
            <Button size="sm" variant="ghost" onClick={resetStatsLayout}>
              {t('stats.panel.realign')}
            </Button>
          )
        }
      >
        <SelectField label={t('stats.panel.arrangement')} value={style.arrangement} options={STATS_ARRANGEMENTS.map((a) => ({ value: a.id, label: t(a.label) }))} onChange={(arrangement) => updateStatsStyle({ arrangement })} />
        {style.arrangement === 'hero' && heroOptions.length > 0 && (
          <>
            <SelectField
              label={t('stats.panel.heroStat')}
              value={heroOptions.some((o) => o.value === style.heroKey) ? style.heroKey : heroOptions[0].value}
              options={heroOptions}
              onChange={(heroKey) => updateStatsStyle({ heroKey })}
            />
            <CheckboxField label={t('stats.panel.heroSecondary')} checked={style.heroSecondary} onChange={(heroSecondary) => updateStatsStyle({ heroSecondary })} />
          </>
        )}
        {captioned && <CheckboxField label={t('stats.panel.labels')} checked={style.labels} onChange={(labels) => updateStatsStyle({ labels })} />}
        {hasColumns && (
          <>
            <CheckboxField label={t('stats.panel.dividers')} checked={style.dividers} onChange={(dividers) => updateStatsStyle({ dividers })} />
            <CheckboxField label={t('stats.panel.stretch')} checked={style.stretch} onChange={(stretch) => updateStatsStyle({ stretch })} />
          </>
        )}
        <FontField value={style.fontFamily} onChange={(fontFamily) => updateStatsStyle({ fontFamily })} />
        <ColorField label={t('stats.panel.color')} value={style.color} onChange={(v) => updateStatsStyle({ color: v })} />
        <ShadowField soft={style.shadow} hard={style.hardShadow} onChange={({ soft, hard }) => updateStatsStyle({ shadow: soft, hardShadow: hard })} />
        <SliderField
          label={t('stats.panel.size')}
          unit="px"
          min={16}
          max={90}
          value={style.fontSize}
          defaultValue={DEFAULT_STATS_STYLE.fontSize}
          onChange={(v) => updateStatsStyle({ fontSize: v })}
        />
        {(style.arrangement !== 'columns' || !style.stretch) && (
          <SliderField
            label={t('stats.panel.spacing')}
            unit="px"
            min={0}
            max={150}
            value={style.spacing}
            defaultValue={DEFAULT_STATS_STYLE.spacing}
            onChange={(v) => updateStatsStyle({ spacing: v })}
          />
        )}
        <RotationField value={style.rotation} onChange={(rotation) => updateStatsStyle({ rotation })} />
      </Section>
    </>
  )
}
