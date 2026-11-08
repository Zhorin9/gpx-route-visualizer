import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import { IconInfo } from '../../../components/icons'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import PalettePicker from './PalettePicker'
import { DATA_SOURCES, dataSource, type DataSourceId } from '../../../core/data/sources'
import ColorField from '../../../components/fields/ColorField'
import { useAppStore } from '../../../store/useAppStore'
import { selectTrack, selectRouteDays } from '../../../store/derived'
import type { GpxTrack, SelectOption } from '../../../types'
import type { DataColorSettings } from '../types'
import { useActiveDataColor } from '../useDataColoring'

const GLOWS: DataColorSettings['glow'][] = ['follow', 'uniform']

const RANGE_MODES: DataColorSettings['rangeMode'][] = ['auto', 'manual']

function DataPalettePicker() {
  const { t } = useTranslation()
  const current = useAppStore((s) => s.dataColor.palette)
  const inverted = useAppStore((s) => s.dataColor.inverted)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  return <PalettePicker ariaLabel={t('dataColor.palette')} inverted={inverted} isActive={(p) => p.id === current} onPick={(p) => updateDataColor({ palette: p.id })} />
}

// In the source's own (metric) unit; the slider spans what the track contains.
function ManualRange() {
  const { t } = useTranslation()
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
      <SliderField label={t('dataColor.from', { unit })} min={min} max={max} step={step} value={Math.min(settings.min, settings.max)} onChange={(v) => updateDataColor({ min: v })} />
      <SliderField label={t('dataColor.to', { unit })} min={min} max={max} step={step} value={Math.max(settings.min, settings.max)} onChange={(v) => updateDataColor({ max: v })} />
    </>
  )
}

function DataColorSettingsFields() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.dataColor)
  const glowEnabled = useAppStore((s) => s.routeStyle.glowEnabled)
  const track = useAppStore(selectTrack)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const active = useActiveDataColor()

  const missing = DATA_SOURCES.flatMap((src) => {
    const why = track ? src.unavailable(track) : null
    return why ? [`${t(src.label).toLowerCase()} (${t(why)})`] : []
  })
  const options: SelectOption<DataSourceId>[] = DATA_SOURCES.map((src) => ({
    value: src.id,
    label: t(src.label),
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
          <Segmented label={t('dataColor.data')} showLabel value={settings.source} options={options} onChange={(source) => updateDataColor({ source })} />
          {missing.length > 0 && (
            <p className="note">
              <IconInfo />
              {t('dataColor.missing', { list: missing.join(', ') })}
            </p>
          )}
        </>
      )}
      {unavailable && <p className="hint">{t('dataColor.unavailable', { reason: t(unavailable) })}</p>}
      {settings.source !== 'none' && !unavailable && (
        <>
          <DataPalettePicker />
          <CheckboxField label={t('dataColor.invert')} checked={settings.inverted} onChange={(inverted) => updateDataColor({ inverted })} />
          <Segmented label={t('dataColor.range')} showLabel value={settings.rangeMode} options={RANGE_MODES.map((value) => ({ value, label: t(`dataColor.rangeModes.${value}`) }))} onChange={chooseRange} />
          {settings.rangeMode === 'manual' && <ManualRange />}
          {glowEnabled && <Segmented label={t('dataColor.glow')} showLabel value={settings.glow} options={GLOWS.map((value) => ({ value, label: t(`dataColor.glows.${value}`) }))} onChange={(glow) => updateDataColor({ glow })} />}
          <CheckboxField label={t('dataColor.legend')} checked={settings.legend} onChange={(legend) => updateDataColor({ legend })} />
        </>
      )}
    </>
  )
}

const MODES = ['single', 'data'] as const

// Speed and heart rate tell the most about a ride.
function firstAvailable(track: GpxTrack | null): DataSourceId {
  return DATA_SOURCES.find((s) => !track || !s.unavailable(track))?.id ?? 'elevation'
}

function LineColor() {
  const { t } = useTranslation()
  const color = useAppStore((s) => s.routeStyle.color)
  const multiDay = useAppStore((s) => selectRouteDays(s).length > 1)
  const updateRouteStyle = useAppStore((s) => s.updateRouteStyle)
  if (multiDay) return <p className="hint">{t('dataColor.multiDay')}</p>
  return <ColorField label={t('dataColor.color')} value={color} onChange={(c) => updateRouteStyle({ color: c })} />
}

export function ColorPage() {
  const { t } = useTranslation()
  const source = useAppStore((s) => s.dataColor.source)
  const track = useAppStore(selectTrack)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  const mode = source === 'none' ? 'single' : 'data'
  return (
    <Section title={t('dataColor.lineColor')}>
      <Segmented
        label={t('dataColor.lineColor')}
        value={mode}
        options={MODES.map((value) => ({ value, label: t(`dataColor.modes.${value}`) }))}
        onChange={(m) => updateDataColor({ source: m === 'single' ? 'none' : firstAvailable(track) })}
      />
      {mode === 'single' ? <LineColor /> : <DataColorSettingsFields />}
    </Section>
  )
}

export default function ColorLegendEditor() {
  const { t } = useTranslation()
  return (
    <Section title={t('dataColor.label')}>
      <DataColorSettingsFields />
    </Section>
  )
}
