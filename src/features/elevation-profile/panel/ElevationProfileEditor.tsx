import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { paletteStops } from '../../../core/data/palettes'
import { dataSource, type DataSourceId } from '../../../core/data/sources'
import { distanceUnit, formatGain, type Units } from '../../../core/units'
import { formatNumber } from '../../../utils/format'
import { selectGroundInRange, selectTrack } from '../../../store/derived'
import { useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { DEFAULT_PROFILE, PROFILE_KIND, type ProfileChartStyle, type ProfileColorMode, type ProfileLayout, type ProfileSettings } from '../types'
import { paletteSource, sampledSource, sourceDomain, useProfileData } from '../useProfile'
import GradientStopsEditor from './GradientStopsEditor'
import PalettePicker from '../../data-color/panel/PalettePicker'
import type { SelectOption } from '../../../types'
import './ElevationProfileEditor.css'

const COLOR_MODES: ProfileColorMode[] = ['route', 'palette', 'single']

const COLOR_BY: DataSourceId[] = ['elevation', 'grade', 'speed', 'heartRate']

const STYLES: ProfileChartStyle[] = ['line', 'area', 'bars', 'steps']

const LAYOUTS: ProfileLayout[] = ['low', 'tall', 'overlay']

const SCALES: ProfileSettings['scale'][] = ['auto', 'zero']

const UNIT_OPTIONS: SelectOption<Units>[] = [
  { value: 'metric', label: 'm / km' },
  { value: 'imperial', label: 'ft / mi' },
]

function ClimbSummary() {
  const { t } = useTranslation()
  const units = useAppStore((s) => s.statsContent.units)
  const data = useProfileData(64)
  if (!data) return null
  if (!data.climbs.length) return <p className="hint">{t('elevationProfile.noClimbs')}</p>
  return (
    <p className="hint">
      {t('elevationProfile.climbs', { count: data.climbs.length, list: data.climbs.map((c) => `${formatGain(c.gainM, units, 5)} (${formatNumber(c.avgGrade, 1)}%)`).join(', ') })}
    </p>
  )
}

function GradeColoringToggle() {
  const { t } = useTranslation()
  const source = useAppStore((s) => s.dataColor.source)
  const updateDataColor = useAppStore((s) => s.updateDataColor)
  return (
    <CheckboxField
      label={t('elevationProfile.colorRouteByGrade')}
      checked={source === 'grade'}
      onChange={(on) => updateDataColor({ source: on ? 'grade' : 'none' })}
    />
  )
}

function OwnPalette() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const track = useAppStore(selectTrack)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const data = useProfileData(64)
  if (!track) return null

  const options = COLOR_BY.map((id) => ({ value: id, label: t(dataSource(id).label), disabled: dataSource(id).unavailable(track) != null }))
  const source = paletteSource(track, settings.colorBy)
  const [lo, hi] = data ? sourceDomain(sampledSource(data, source), source) : [0, 1]
  const format = (v: number) => dataSource(source).format(v, units)
  const stopsKey = JSON.stringify(settings.stops)

  return (
    <>
      <Segmented label={t('elevationProfile.colorBy')} showLabel value={source} options={options} onChange={(colorBy) => updateProfile({ colorBy })} />
      <PalettePicker ariaLabel={t('elevationProfile.palette')} isActive={(p) => JSON.stringify(paletteStops(p)) === stopsKey} onPick={(p) => updateProfile({ stops: paletteStops(p) })} />
      <span className="field-label">{t('elevationProfile.customGradient')}</span>
      <GradientStopsEditor stops={settings.stops} onChange={(stops) => updateProfile({ stops })} scale={[format(lo), format((lo + hi) / 2), format(hi)]} />
    </>
  )
}

function ElevationProfileSettings() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const routeByData = useAppStore((s) => s.dataColor.source !== 'none')
  const placedByHand = useAppStore((s) => s.placements[PROFILE_KIND] != null)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setProfileLayout = useAppStore((s) => s.setProfileLayout)
  const filled = settings.style === 'area' || settings.style === 'steps'

  return (
    <>
      <h6 className="subhead">{t('elevationProfile.color')}</h6>
      <Segmented label={t('elevationProfile.color')} value={settings.colorMode} options={COLOR_MODES.map((value) => ({ value, label: t(`elevationProfile.colorModes.${value}`) }))} onChange={(colorMode) => updateProfile({ colorMode })} />
      {settings.colorMode === 'route' && <p className="hint">{t(routeByData ? 'elevationProfile.routeColorsByData' : 'elevationProfile.routeColor')}</p>}
      {settings.colorMode === 'palette' && <OwnPalette />}
      {settings.colorMode === 'single' && <ColorField label={t('elevationProfile.chartColor')} value={settings.color} onChange={(color) => updateProfile({ color })} />}
      {filled && (
        <SliderField
          label={t('elevationProfile.fillOpacity')}
          unit="%"
          min={5}
          value={Math.round(settings.fillOpacity * 100)}
          defaultValue={Math.round(DEFAULT_PROFILE.fillOpacity * 100)}
          onChange={(v) => updateProfile({ fillOpacity: v / 100 })}
        />
      )}

      <Segmented label={t('elevationProfile.style')} showLabel value={settings.style} options={STYLES.map((value) => ({ value, label: t(`elevationProfile.styles.${value}`) }))} onChange={(style) => updateProfile({ style })} />
      <Segmented label={t('elevationProfile.layout')} showLabel value={settings.layout} options={LAYOUTS.map((value) => ({ value, label: t(`elevationProfile.layouts.${value}`) }))} onChange={setProfileLayout} />
      {placedByHand && <p className="hint">{t('elevationProfile.placedByHand')}</p>}

      <h6 className="subhead">{t('elevationProfile.markings')}</h6>
      <CheckboxField label={t('elevationProfile.peak')} checked={settings.peak} onChange={(peak) => updateProfile({ peak })} />
      <CheckboxField label={t('elevationProfile.startFinish')} checked={settings.startFinish} onChange={(startFinish) => updateProfile({ startFinish })} />
      <CheckboxField label={t('elevationProfile.ticks', { unit: distanceUnit(units) })} checked={settings.kmTicks} onChange={(kmTicks) => updateProfile({ kmTicks })} />
      <CheckboxField label={t('elevationProfile.steep')} checked={settings.steep} onChange={(steep) => updateProfile({ steep })} />
      {settings.steep && (
        <SliderField label={t('elevationProfile.steepGrade')} unit="%" min={2} max={20} value={settings.steepGrade} defaultValue={DEFAULT_PROFILE.steepGrade} onChange={(steepGrade) => updateProfile({ steepGrade })} />
      )}
      <CheckboxField label={t('elevationProfile.showTotal')} checked={settings.showTotal} onChange={(showTotal) => updateProfile({ showTotal })} />
      <CheckboxField label={t('elevationProfile.showMinMax')} checked={settings.showMinMax} onChange={(showMinMax) => updateProfile({ showMinMax })} />
      {settings.layout !== 'overlay' && (
        <CheckboxField label={t('elevationProfile.showDistance')} checked={settings.showDistance} onChange={(showDistance) => updateProfile({ showDistance })} />
      )}
      <CheckboxField label={t('elevationProfile.highlightClimbs')} checked={settings.highlightClimbs} onChange={(highlightClimbs) => updateProfile({ highlightClimbs })} />
      {settings.highlightClimbs && (
        <>
          <CheckboxField label={t('elevationProfile.climbLabels')} checked={settings.climbLabels} onChange={(climbLabels) => updateProfile({ climbLabels })} />
          <ClimbSummary />
        </>
      )}
      <GradeColoringToggle />
      <CheckboxField label={t('elevationProfile.marker')} checked={settings.marker} onChange={(marker) => updateProfile({ marker })} />
      {settings.marker && (
        <SliderField
          label={t('elevationProfile.markerAt')}
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

function ElevationProfileAdvanced() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.profile)
  const units = useAppStore((s) => s.statsContent.units)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  return (
    <Section title={t('elevationProfile.advanced')} collapseId="profile-advanced">
      <Segmented label={t('elevationProfile.scale')} showLabel value={settings.scale} options={SCALES.map((value) => ({ value, label: t(`elevationProfile.scales.${value}`) }))} onChange={(scale) => updateProfile({ scale })} />
      <SliderField
        label={t('elevationProfile.exaggeration')}
        unit="×"
        min={0.5}
        max={3}
        step={0.1}
        value={settings.exaggeration}
        defaultValue={DEFAULT_PROFILE.exaggeration}
        onChange={(exaggeration) => updateProfile({ exaggeration })}
      />
      <SliderField label={t('elevationProfile.smoothing')} min={0} max={10} value={settings.smoothing} defaultValue={DEFAULT_PROFILE.smoothing} onChange={(smoothing) => updateProfile({ smoothing })} />
      <CheckboxField label={t('elevationProfile.grid')} checked={settings.grid} onChange={(grid) => updateProfile({ grid })} />
      {settings.layout !== 'overlay' && (
        <SliderField label={t('elevationProfile.width')} unit="%" min={30} max={100} value={settings.widthPct} defaultValue={DEFAULT_PROFILE.widthPct} onChange={(widthPct) => updateProfile({ widthPct })} />
      )}
      <Segmented label={t('elevationProfile.units')} showLabel value={units} options={UNIT_OPTIONS} onChange={(u) => updateStatsContent({ units: u })} />
    </Section>
  )
}

export function ElevationProfileSection() {
  const { t } = useTranslation()
  const hasRoute = useHasRoute()
  const enabled = useAppStore((s) => s.profile.enabled)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const ground = useAppStore(selectGroundInRange)
  if (!hasRoute) return null
  return (
    <>
      <Section title={t('elevationProfile.label')} collapseId="profile">
        <CheckboxField label={t('elevationProfile.show')} checked={enabled} onChange={(on) => updateProfile({ enabled: on })} />
        {enabled && !ground && <p className="hint">{t('elevationProfile.noGround')}</p>}
        {enabled && <ElevationProfileSettings />}
      </Section>
      {enabled && <ElevationProfileAdvanced />}
    </>
  )
}

export default function ElevationProfileEditor() {
  const { t } = useTranslation()
  const updateProfile = useAppStore((s) => s.updateProfile)
  const select = useAppStore((s) => s.select)
  return (
    <>
      <Section title={t('elevationProfile.label')}>
        <ElevationProfileSettings />
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            updateProfile({ enabled: false })
            select(null)
          }}
        >
          {t('elevationProfile.remove')}
        </button>
      </Section>
      <ElevationProfileAdvanced />
    </>
  )
}
