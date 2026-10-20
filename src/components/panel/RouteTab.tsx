import { useState } from 'react'
import ColorField from '../fields/ColorField'
import Button from '../ui/Button'
import FileButton from '../ui/FileButton'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconClose, IconEye, IconEyeOff, IconMapPin, IconMountain, IconPlus, IconUpload } from '../icons'
import SubTabs from '../../core/panel/SubTabs'
import RangeTab from './RangeTab'
import StyleTab from './StyleTab'
import WaypointEditor from './PlacesTab'
import useGpxImport from '../../hooks/useGpxImport'
import { useHasRoute, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { formatKm } from '../../utils/format'
import type { KmInterval, RouteDay, SelectOption, WaypointKind } from '../../types'

const KM_OPTIONS: SelectOption<string>[] = [
  { value: '10', label: 'Co 10' },
  { value: '25', label: 'Co 25' },
  { value: '50', label: 'Co 50' },
  { value: '0', label: 'Wył.' },
]

const LINE_OPTIONS: SelectOption<'solid' | 'dashed'>[] = [
  { value: 'solid', label: 'Ciągła' },
  { value: 'dashed', label: 'Kreskowana' },
]

function KindIcon({ kind }: { kind: WaypointKind }) {
  return kind === 'point' ? <IconMapPin /> : <IconMountain />
}

// Loads a GPX file in place of the current route (or the first one).
function GpxFileButton() {
  const hasTrack = useAppStore((s) => s.track != null)
  const gpxError = useAppStore((s) => s.gpxError)
  const { importFiles } = useGpxImport()
  return (
    <>
      <FileButton accept=".gpx,application/gpx+xml" onFiles={(files) => importFiles(files)} icon={<IconUpload />} block variant={hasTrack ? 'secondary' : 'primary'}>
        {hasTrack ? 'Zmień plik GPX' : 'Wgraj plik GPX'}
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
  const track = useAppStore((s) => s.track)
  const days = useAppStore((s) => s.routeDays)
  const routeStyle = useAppStore((s) => s.routeStyle)
  const updateDay = useAppStore((s) => s.updateDay)
  const removeDay = useAppStore((s) => s.removeDay)
  const loadGpxFile = useAppStore((s) => s.loadGpxFile)
  const cum = useTrackCumKm()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (!track || !cum) return null

  const multi = days.length > 1
  const rows: { id: number; name: string; km: number; color: string; visible: boolean }[] = multi
    ? days.map((d) => ({ id: d.id, name: d.name, km: cum[d.endIdx] - cum[d.startIdx], color: d.color, visible: d.visible }))
    : [{ id: 0, name: track.name ?? 'Trasa bez nazwy', km: cum[cum.length - 1], color: routeStyle.color, visible: true }]
  const total = multi ? cum[cum.length - 1] : 0
  const selected: RouteDay | undefined = multi ? (days.find((d) => d.id === selectedId) ?? days[0]) : undefined

  return (
    <Section title="Trasy">
      {multi && <p className="hint">Razem {formatKm(total, 1)}</p>}
      <div className="item-list" role="listbox" aria-label="Trasy">
        {rows.map((row, i) => (
          <div key={row.id} className={multi && row.id === selected?.id ? 'day-row active' : 'day-row'}>
            <button type="button" className="day-row-main" disabled={!multi} aria-selected={multi && row.id === selected?.id} onClick={() => setSelectedId(row.id)}>
              <span className="day-dot" style={{ background: row.color }} />
              <span className="day-name">{multi ? `Dzień ${i + 1} · ${row.name}` : row.name}</span>
              <span className="day-km">{formatKm(row.km, 1)}</span>
            </button>
            {multi && (
              <>
                <button
                  type="button"
                  className="day-icon-btn"
                  aria-label={row.visible ? `Ukryj dzień ${i + 1}` : `Pokaż dzień ${i + 1}`}
                  onClick={() => updateDay(row.id, { visible: !row.visible })}
                >
                  {row.visible ? <IconEye /> : <IconEyeOff />}
                </button>
                <button type="button" className="day-icon-btn" aria-label={`Usuń dzień ${i + 1}`} onClick={() => removeDay(row.id)}>
                  <IconClose width={14} height={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <GpxFileButton />
      <FileButton
        accept=".gpx,application/gpx+xml"
        multiple
        icon={<IconUpload />}
        block
        onFiles={async (files) => {
          for (const file of Array.from(files ?? [])) await loadGpxFile(file, true)
        }}
      >
        Dodaj plik GPX (kolejny dzień)
      </FileButton>

      {selected && (
        <>
          <h6 className="subhead">Zaznaczony: Dzień {days.indexOf(selected) + 1}</h6>
          <ColorField label="Kolor linii" value={selected.color} onChange={(color) => updateDay(selected.id, { color })} />
          <Segmented
            label="Styl linii"
            value={selected.dashed ? 'dashed' : 'solid'}
            options={LINE_OPTIONS}
            onChange={(v) => updateDay(selected.id, { dashed: v === 'dashed' })}
          />
        </>
      )}
      {!multi && <p className="hint">Kolor linii ustawisz w podzakładce „Kolor”.</p>}
    </Section>
  )
}

function MarkersSection() {
  const interval = useAppStore((s) => s.kmInterval)
  const setKmInterval = useAppStore((s) => s.setKmInterval)
  return (
    <Section title="Znaczniki kilometrów">
      <Segmented label="Znaczniki kilometrów" value={String(interval)} options={KM_OPTIONS} onChange={(v) => setKmInterval(Number(v) as KmInterval)} />
    </Section>
  )
}

function PoiSection() {
  const waypoints = useAppStore((s) => s.waypoints)
  const selection = useAppStore((s) => s.selection)
  const adding = useAppStore((s) => s.addingWaypoint)
  const select = useAppStore((s) => s.select)
  const setAddingWaypoint = useAppStore((s) => s.setAddingWaypoint)
  const cum = useTrackCumKm()
  const selected = selection?.kind === 'waypoint' ? waypoints.find((w) => w.id === selection.id) : undefined

  return (
    <Section title="Punkty zainteresowania">
      {waypoints.length > 0 && (
        <div className="item-list" role="listbox" aria-label="Punkty zainteresowania">
          {waypoints.map((w) => (
            <button
              key={w.id}
              type="button"
              role="option"
              aria-selected={w.id === selected?.id}
              className={w.id === selected?.id ? 'item-list-item element-row active' : 'item-list-item element-row'}
              onClick={() => select({ kind: 'waypoint', id: w.id })}
            >
              <KindIcon kind={w.kind} />
              <span className="element-row-label">{w.text || '(pusty)'}</span>
              <span className="element-row-meta">{cum ? `km ${Math.round(cum[Math.min(cum.length - 1, Math.round(w.trackPos))])}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      <Button pressed={adding} icon={<IconPlus />} block onClick={() => setAddingWaypoint(!adding)}>
        {adding ? 'Anuluj' : 'Dodaj punkt — kliknij na trasie'}
      </Button>
    </Section>
  )
}

// Trasa → Linia: the route itself — files and days, markers, places, range and line style.
function RouteLinePage() {
  const hasRoute = useHasRoute()
  const selection = useAppStore((s) => s.selection)
  return (
    <>
      {!hasRoute && (
        <Section title="Trasa">
          <p className="hint">Wgraj plik .gpx z Garmina, Stravy lub Komoot. Kolejne pliki możesz potem dodać jako następne dni wyprawy.</p>
          <GpxFileButton />
        </Section>
      )}
      {hasRoute && (
        <>
          <RoutesSection />
          <MarkersSection />
          <PoiSection />
          {selection?.kind === 'waypoint' && <WaypointEditor id={selection.id} />}
        </>
      )}
      <RangeTab />
      <StyleTab />
    </>
  )
}

// Kolor, Profil and Statystyki are added by their features.
export default function RouteTab() {
  return <SubTabs tab="route" own={[{ id: 'line', label: 'Linia', Component: RouteLinePage }]} />
}
