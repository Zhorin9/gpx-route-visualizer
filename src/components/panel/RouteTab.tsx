import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ColorField from '../fields/ColorField'
import Button from '../ui/Button'
import FileButton from '../ui/FileButton'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import StatusCard from '../ui/StatusCard'
import GpxErrorCard from '../GpxErrorCard'
import { IconClose, IconEye, IconEyeOff, IconPlus, IconUpload } from '../icons'
import KindIcon from '../place/KindIcon'
import SubTabs from '../../core/panel/SubTabs'
import { panelSections } from '../../core/panel/registry'
import RangeTab from './RangeTab'
import StyleTab from './StyleTab'
import PlaceEditor from './PlaceEditor'
import ElementRow from './ElementRow'
import useGpxImport, { GPX_ACCEPT } from '../../hooks/useGpxImport'
import { useHasRoute, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { formatKm } from '../../utils/format'
import { selectTrack, selectRouteDays } from '../../store/derived'
import type { KmInterval, RoutePart } from '../../types'
import type { TKey } from '../../i18n'
import './RouteTab.css'

// The trip planner's page, added by the travel feature.
const TRIP_PAGE = 'stops'

const KM_OPTIONS: { value: string; label: TKey }[] = [
  { value: '10', label: 'routeTab.every10' },
  { value: '25', label: 'routeTab.every25' },
  { value: '50', label: 'routeTab.every50' },
  { value: '0', label: 'routeTab.off' },
]

const LINE_OPTIONS: { value: 'solid' | 'dashed'; label: TKey }[] = [
  { value: 'solid', label: 'routeTab.solid' },
  { value: 'dashed', label: 'routeTab.dashed' },
]

function RouteEmpty() {
  const { t } = useTranslation()
  const gpxError = useAppStore((s) => s.gpxError)
  const setSubTab = useAppStore((s) => s.setSubTab)
  const { importFiles } = useGpxImport()
  if (gpxError) return <GpxErrorCard />
  return (
    <StatusCard
      icon={<IconUpload />}
      title={t('routeTab.emptyTitle')}
      actions={
        <>
          <FileButton accept={GPX_ACCEPT} onFiles={importFiles} variant="primary">
            {t('routeTab.addGpx')}
          </FileButton>
          <Button onClick={() => setSubTab('route', TRIP_PAGE)}>{t('routeTab.planTrip')}</Button>
        </>
      }
    >
      {t('routeTab.emptyText')}
    </StatusCard>
  )
}

function GpxFileButton() {
  const { t } = useTranslation()
  const gpxError = useAppStore((s) => s.gpxError)
  const { importFiles } = useGpxImport()
  return (
    <>
      <FileButton accept={GPX_ACCEPT} onFiles={importFiles} icon={<IconUpload />} block>
        {t('routeTab.changeGpx')}
      </FileButton>
      {gpxError && (
        <p className="error" role="alert">
          {gpxError}
        </p>
      )}
    </>
  )
}

function RoutesSection() {
  const { t } = useTranslation()
  const track = useAppStore(selectTrack)
  const days = useAppStore(selectRouteDays)
  const routeStyle = useAppStore((s) => s.routeStyle)
  const updatePart = useAppStore((s) => s.updatePart)
  const removePart = useAppStore((s) => s.removePart)
  const loadGpxFile = useAppStore((s) => s.loadGpxFile)
  const cum = useTrackCumKm()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (!track || !cum) return null

  const multi = days.length > 1
  // A planned leg is named by its places; a file is one day of the trip.
  const rows: { id: number; name: string; km: number; color: string; visible: boolean }[] = multi
    ? days.map((d, i) => ({ id: d.id, name: d.plan ? d.name : t('routeTab.dayName', { n: i + 1, name: d.name }), km: cum[d.endIdx] - cum[d.startIdx], color: d.color, visible: d.visible }))
    : [{ id: 0, name: track.name ?? t('routeTab.unnamedRoute'), km: cum[cum.length - 1], color: routeStyle.color, visible: true }]
  const total = multi ? cum[cum.length - 1] : 0
  const selected: RoutePart | undefined = multi ? (days.find((d) => d.id === selectedId) ?? days[0]) : undefined

  return (
    <Section title={t('routeTab.routes')}>
      {multi && <p className="hint">{t('routeTab.total', { km: formatKm(total, 1) })}</p>}
      <div className="item-list" role="listbox" aria-label={t('routeTab.routes')}>
        {rows.map((row, i) => (
          <div key={row.id} className={multi && row.id === selected?.id ? 'day-row active' : 'day-row'}>
            <button type="button" className="day-row-main" disabled={!multi} aria-selected={multi && row.id === selected?.id} onClick={() => setSelectedId(row.id)}>
              <span className="day-dot" style={{ background: row.color }} />
              <span className="day-name">{row.name}</span>
              <span className="day-km">{formatKm(row.km, 1)}</span>
            </button>
            {multi && (
              <>
                <button
                  type="button"
                  className="day-icon-btn"
                  aria-label={row.visible ? t('routeTab.hideDay', { n: i + 1 }) : t('routeTab.showDay', { n: i + 1 })}
                  onClick={() => updatePart(row.id, { visible: !row.visible })}
                >
                  {row.visible ? <IconEye /> : <IconEyeOff />}
                </button>
                <button type="button" className="day-icon-btn" aria-label={t('routeTab.removeDay', { n: i + 1 })} onClick={() => removePart(row.id)}>
                  <IconClose width={14} height={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <GpxFileButton />
      <FileButton
        accept={GPX_ACCEPT}
        multiple
        icon={<IconUpload />}
        block
        onFiles={async (files) => {
          for (const file of Array.from(files ?? [])) await loadGpxFile(file, true)
        }}
      >
        {t('routeTab.addGpxDay')}
      </FileButton>

      {selected && (
        <>
          <h6 className="subhead">{t('routeTab.selected', { name: selected.plan ? selected.name : t('routeTab.day',{ n: days.indexOf(selected) + 1 }) })}</h6>
          <ColorField label={t('routeTab.lineColor')} value={selected.color} onChange={(color) => updatePart(selected.id, { color })} />
          <Segmented
            label={t('routeTab.lineStyle')}
            value={selected.dashed ? 'dashed' : 'solid'}
            options={LINE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            onChange={(v) => updatePart(selected.id, { dashed: v === 'dashed' })}
          />
        </>
      )}
      {!multi && <p className="hint">{t('routeTab.lineColorHint')}</p>}
    </Section>
  )
}

function MarkersSection() {
  const { t } = useTranslation()
  const interval = useAppStore((s) => s.kmInterval)
  const setKmInterval = useAppStore((s) => s.setKmInterval)
  return (
    <Section title={t('routeTab.kmMarkers')}>
      <Segmented
        label={t('routeTab.kmMarkers')}
        value={String(interval)}
        options={KM_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={(v) => setKmInterval(Number(v) as KmInterval)}
      />
    </Section>
  )
}

function PoiSection() {
  const { t } = useTranslation()
  const waypoints = useAppStore((s) => s.waypoints)
  const selection = useAppStore((s) => s.selection)
  const adding = useAppStore((s) => s.addingWaypoint)
  const select = useAppStore((s) => s.select)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)
  const cum = useTrackCumKm()
  const selected = selection?.kind === 'waypoint' ? waypoints.find((w) => w.id === selection.id) : undefined

  return (
    <Section title={t('routeTab.places')}>
      {waypoints.length > 0 && (
        <div className="item-list" role="listbox" aria-label={t('routeTab.places')}>
          {waypoints.map((w) => (
            <ElementRow
              key={w.id}
              icon={<KindIcon kind={w.kind} icon={w.icon} />}
              label={w.text || t('routeTab.emptyPlace')}
              meta={cum ? `km ${Math.round(cum[Math.min(cum.length - 1, Math.round(w.trackPos))])}` : ''}
              active={w.id === selected?.id}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
            />
          ))}
        </div>
      )}
      <Button pressed={adding} icon={<IconPlus />} block onClick={() => setAddingWaypoint(!adding)}>
        {adding ? t('routeTab.cancel') : t('routeTab.addPoint')}
      </Button>
    </Section>
  )
}

function RouteLinePage() {
  const selection = useAppStore((s) => s.selection)
  return (
    <>
      <RoutesSection />
      <MarkersSection />
      <PoiSection />
      {selection?.kind === 'waypoint' && <PlaceEditor id={selection.id} />}
      <RangeTab />
      <StyleTab />
    </>
  )
}

// Kolor, Profil and Statystyki are added by their features.
export default function RouteTab() {
  const hasRoute = useHasRoute()
  const mode = useAppStore((s) => s.mode)
  const planning = useAppStore((s) => s.subTabs.route === TRIP_PAGE)
  // Without a route only the trip planner works, so it is shown alone.
  if (!hasRoute) {
    const trip = planning && panelSections('route', mode).find((p) => p.id === TRIP_PAGE)
    return trip ? <trip.Component /> : <RouteEmpty />
  }
  return <SubTabs tab="route" own={[{ id: 'line', label: 'routeTab.line', Component: RouteLinePage }]} />
}
