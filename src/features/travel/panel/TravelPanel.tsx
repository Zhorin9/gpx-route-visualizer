import { useState, type DragEvent } from 'react'
import CheckboxField from '../../../components/fields/CheckboxField'
import TextField from '../../../components/fields/TextField'
import { IconDownload, IconTrash } from '../../../components/icons'
import Button from '../../../components/ui/Button'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { selectRouteParts } from '../../../store/derived'
import { useTrackCumKm } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { downloadBlob } from '../../../utils/exportImage'
import { formatKm } from '../../../utils/format'
import { toGpxText } from '../../../utils/gpx'
import { DEFAULT_LEG_S, DEFAULT_PAUSE_S } from '../../animation/model/schedule'
import { legName, legPlans, moveStop, named, removeStop, setLeg, updateStop, type Journey } from '../model/journey'
import { LINE_LABELS, lineOf, travelMode, travelModes } from '../model/modes'
import { stopLetter, useTravelActions } from '../useTravel'
import { TRAVEL_SEARCH_ID } from '../workspace/TravelWorkspace'
import type { GpxPoint, LineKind, RoutePart, Stop, TravelModeId } from '../../../types'
import './TravelPanel.css'


const LINE_ORDER: LineKind[] = ['road', 'straight', 'arc']
const LINE_NAMES: Record<LineKind, string> = { road: 'Po drodze', straight: 'Prosta', arc: 'Łuk' }

// "2 h 10 m", or "45 m" under an hour.
function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  const h = Math.floor(minutes / 60)
  return h ? `${h} h ${minutes % 60} m` : `${minutes} m`
}

const seconds = (value: number) => `${String(value).replace('.', ',')} s`

// Seconds in half steps between the given limits.
function SecondsField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="seconds-field">
      <span>{label}</span>
      <span className="seconds-stepper">
        <button type="button" aria-label={`${label}: krócej`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 0.5))}>
          −
        </button>
        <span className="seconds-value">{seconds(value)}</span>
        <button type="button" aria-label={`${label}: dłużej`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 0.5))}>
          +
        </button>
      </span>
    </div>
  )
}

function ModeGrid({ value, onChange }: { value: TravelModeId; onChange: (id: TravelModeId) => void }) {
  return (
    <div className="mode-grid" role="radiogroup" aria-label="Środek transportu">
      {travelModes().map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={m.id === value} className={m.id === value ? 'mode-opt active' : 'mode-opt'} onClick={() => onChange(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  )
}

// The leg's way of travelling, the shape of its line and the time it takes to draw.
function LegBox({ index, journey, change }: { index: number; journey: Journey; change: (j: Journey, label: string) => void }) {
  const leg = journey.legs[index]
  const plan = legPlans(journey)[index]
  const mode = travelMode(leg.mode)
  const line = lineOf(leg)
  const vias = plan ? plan.stops.length - 2 : 0
  return (
    <div className="leg-box">
      <h6>
        Odcinek {stopLetter(index)} → {stopLetter(index + 1)}
      </h6>
      {/* Another mode starts with its own line shape and keeps the leg's time. */}
      <ModeGrid value={leg.mode} onChange={(id) => change(setLeg(journey, index, { mode: id, ...(leg.duration ? { duration: leg.duration } : null) }), `mode:${index}`)} />
      <div className="line-kinds" role="radiogroup" aria-label="Kształt linii">
        {LINE_ORDER.map((kind) => {
          const allowed = mode.lines.includes(kind)
          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={kind === line}
              disabled={!allowed}
              title={allowed ? undefined : `${mode.label}: tylko prosta albo łuk`}
              className={kind === line ? 'tag tag-accent' : 'tag tag-outline'}
              onClick={() => change(setLeg(journey, index, { ...leg, line: kind }), `line:${index}`)}
            >
              {LINE_NAMES[kind]}
            </button>
          )
        })}
      </div>
      <SecondsField label="Czas w animacji" value={leg.duration ?? DEFAULT_LEG_S} min={0.5} max={30} onChange={(duration) => change(setLeg(journey, index, { ...leg, duration }), `time:${index}`)} />
      {vias > 0 && plan && (
        <div className="leg-vias">
          <span className="text-muted">Punkty pośrednie: {vias}</span>
          <button type="button" className="link-btn" onClick={() => change({ ...journey, stops: journey.stops.filter((s) => !s.via || !plan.stops.includes(s)) }, `vias:${index}`)}>
            Usuń
          </button>
        </div>
      )}
    </div>
  )
}

// A stop's name, its rest in the animation and its removal.
function StopBox({ stop, index, last, journey, change }: { stop: Stop; index: number; last: boolean; journey: Journey; change: (j: Journey, label: string) => void }) {
  const pause = stop.pause ?? (last ? 0 : DEFAULT_PAUSE_S)
  return (
    <div className="leg-box">
      <h6>Przystanek {stopLetter(index)}</h6>
      <TextField label="Nazwa" value={stop.name} onChange={(name) => change(updateStop(journey, stop.id, { name }), `name:${stop.id}`)} />
      {index > 0 && <SecondsField label="Postój w animacji" value={pause} min={0} max={10} onChange={(p) => change(updateStop(journey, stop.id, { pause: p }), `pause:${stop.id}`)} />}
      <Button variant="danger" size="sm" icon={<IconTrash />} onClick={() => change(removeStop(journey, stop.id), 'remove')}>
        Usuń przystanek
      </Button>
    </div>
  )
}

// While the trip has one stop: how the leg to the next one will be travelled.
function NextLegBox() {
  const nextMode = useAppStore((s) => s.nextMode)
  const setNextMode = useAppStore((s) => s.setNextMode)
  return (
    <div className="leg-box">
      <h6>Następny odcinek</h6>
      <ModeGrid value={nextMode} onChange={setNextMode} />
    </div>
  )
}

// Route options of the selected leg (tolls, the bike's kind), where the trip sits next to GPX files, the file.
function Advanced({ journey, change, legIndex, planned, cum }: { journey: Journey; change: (j: Journey, label: string) => void; legIndex: number | null; planned: RoutePart[]; cum: Float64Array | null }) {
  const setJourney = useAppStore((s) => s.setJourney)
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const leg = legIndex != null ? journey.legs[legIndex] : undefined
  const mode = leg && travelMode(leg.mode)
  const hasFiles = parts.some((p) => !p.plan)
  const stops = named(journey.stops)

  const totals = new Map<string, number>()
  for (const p of planned) {
    if (!p.plan || !cum) continue
    const label = travelMode(p.plan.mode).label
    totals.set(label, (totals.get(label) ?? 0) + cum[p.endIdx] - cum[p.startIdx])
  }

  function downloadGpx() {
    const points: GpxPoint[] = planned.flatMap((p) => cache[p.sourceKey] ?? [])
    const name = stops.length > 1 ? `${stops[0].name} – ${stops[stops.length - 1].name}` : 'Podróż'
    downloadBlob(new Blob([toGpxText(name, points)], { type: 'application/gpx+xml' }), `${name}.gpx`)
  }

  return (
    <Section title="Zaawansowane" collapseId="travel-advanced" startCollapsed>
      {leg && mode && legIndex != null && lineOf(leg) === 'road' && (
        <>
          {mode.profiles && (
            <Segmented
              label="Rodzaj roweru"
              showLabel
              value={leg.profile ?? mode.profiles[0].id}
              options={mode.profiles.map((p) => ({ value: p.id, label: p.label }))}
              onChange={(profile) => change(setLeg(journey, legIndex, { ...leg, profile }), `profile:${legIndex}`)}
            />
          )}
          {mode.options?.map((option) => {
            const on = leg.options?.includes(option.id) ?? false
            const options = on ? (leg.options ?? []).filter((o) => o !== option.id) : [...(leg.options ?? []), option.id]
            return <CheckboxField key={option.id} label={option.label} checked={on} onChange={() => change(setLeg(journey, legIndex, { ...leg, options }), `options:${legIndex}`)} />
          })}
          {leg.mode === 'car' && <p className="hint">Trasa jedzie najszybszą drogą. Żeby poprowadzić ją inaczej (np. A1 przez Toruń), przeciągnij linię na mapie.</p>}
          {leg.mode === 'train' && <p className="hint">Po torach, od stacji najbliższej każdemu przystankowi. Czas szacowany przy średnio {mode.avgSpeedKmh} km/h.</p>}
        </>
      )}
      {hasFiles && planned.length > 0 && (
        <Segmented
          label="Miejsce podróży"
          showLabel
          value={parts[0]?.plan ? 'start' : 'end'}
          options={[
            { value: 'start', label: 'Przed trasą z pliku' },
            { value: 'end', label: 'Po trasie z pliku' },
          ]}
          onChange={(v) => void setJourney(journey, 'place', { atStart: v === 'start' })}
        />
      )}
      {planned.length > 0 ? (
        <>
          <p className="hint">{[...totals].map(([label, km]) => `${label} ${formatKm(km, 0)}`).join(' · ')}. Czas przejazdu jest szacowany.</p>
          <Button icon={<IconDownload />} block onClick={downloadGpx} title={legPlans(journey).map(legName).join(', ')}>
            Pobierz jako GPX
          </Button>
        </>
      ) : (
        <p className="hint">Tu będą opcje odcinka (np. omijanie płatnych dróg) i zapis trasy do pliku GPX.</p>
      )}
    </Section>
  )
}

export default function TravelPanel() {
  const { journey, change } = useTravelActions()
  const busy = useAppStore((s) => s.travelBusy)
  const error = useAppStore((s) => s.travelError)
  const selection = useAppStore((s) => s.travelSelection)
  const selectTravel = useAppStore((s) => s.selectTravel)
  const setCenterView = useAppStore((s) => s.setCenterView)
  const resetRouteTransform = useAppStore((s) => s.resetRouteTransform)
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const cum = useTrackCumKm()
  const [dragId, setDragId] = useState<number | null>(null)

  const stops = named(journey.stops)
  const planned = parts.filter((p) => p.plan)
  const legCount = journey.legs.length
  // The selected leg or stop, if it still exists; otherwise the last leg.
  const selectedStop = selection?.kind === 'stop' ? stops.find((s) => s.id === selection.id) : undefined
  const legIndex = selection?.kind === 'leg' && selection.index < legCount ? selection.index : !selectedStop && legCount ? legCount - 1 : null

  function legMeta(i: number): string {
    const part = planned[i]
    if (!part || !cum) return ''
    const points = cache[part.sourceKey] ?? []
    const ms = (points[points.length - 1]?.time ?? 0) - (points[0]?.time ?? 0)
    return `${formatKm(cum[part.endIdx] - cum[part.startIdx], 0)} · ${formatSpan(ms)}`
  }

  function stopMeta(stop: Stop, i: number): string {
    const last = i === stops.length - 1
    if (i === 0) return 'start'
    const pause = stop.pause ?? (last ? 0 : DEFAULT_PAUSE_S)
    const rest = pause > 0 ? `postój ${seconds(pause)}` : ''
    return last ? ['meta', rest].filter(Boolean).join(' · ') : rest || 'bez postoju'
  }

  function onDrop(e: DragEvent, index: number) {
    e.preventDefault()
    if (dragId != null) change(moveStop(journey, dragId, index), 'move')
    setDragId(null)
  }

  function addStop() {
    setCenterView('map')
    // The search is in the map's toolbar, which appears with the map.
    requestAnimationFrame(() => document.getElementById(TRAVEL_SEARCH_ID)?.focus())
  }

  return (
    <div className="travel-panel">
      <h6>Przystanki</h6>
      {stops.length === 0 && <p className="hint">Zaplanuj trasę bez pliku GPX: dodaj miejsca, przez które prowadzi podróż, i wybierz, czym ją pokonujesz.</p>}
      {stops.length > 0 && (
        <div className="trip-list" role="list" aria-label="Przystanki i odcinki">
          {stops.map((stop, i) => [
            <div
              key={stop.id}
              role="listitem"
              className={['trip-row', selectedStop?.id === stop.id && 'selected', dragId === stop.id && 'dragging'].filter(Boolean).join(' ')}
              draggable
              onDragStart={() => setDragId(stop.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => dragId != null && e.preventDefault()}
              onDrop={(e) => onDrop(e, i)}
              onClick={() => selectTravel({ kind: 'stop', id: stop.id })}
            >
              <span className="trip-letter">{stopLetter(i)}</span>
              <span className="trip-text">
                <span className="trip-title">{stop.name}</span>
                <span className="trip-meta">{stopMeta(stop, i)}</span>
              </span>
              <button
                type="button"
                className="trip-handle"
                aria-label={`${stop.name}: zmień kolejność (strzałki w górę i w dół)`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null
                  if (to == null) return
                  e.preventDefault()
                  change(moveStop(journey, stop.id, to), 'move')
                }}
              >
                ⋮⋮
              </button>
            </div>,
            i < legCount && (
              <button key={`leg-${i}`} type="button" className={legIndex === i ? 'trip-row trip-leg selected' : 'trip-row trip-leg'} onClick={() => selectTravel({ kind: 'leg', index: i })}>
                <span className="trip-leg-mark" aria-hidden="true" />
                <span className="trip-text">
                  <span className="trip-title">
                    {travelMode(journey.legs[i].mode).label} · {LINE_LABELS[lineOf(journey.legs[i])]}
                  </span>
                  <span className="trip-meta">{legMeta(i)}</span>
                </span>
              </button>
            ),
          ])}
        </div>
      )}
      <button type="button" className="add-stop" onClick={addStop}>
        + Dodaj przystanek (lub kliknij mapę)
      </button>

      {selectedStop ? (
        <StopBox stop={selectedStop} index={stops.indexOf(selectedStop)} last={stops.indexOf(selectedStop) === stops.length - 1} journey={journey} change={change} />
      ) : legIndex != null ? (
        <LegBox index={legIndex} journey={journey} change={change} />
      ) : (
        stops.length === 1 && <NextLegBox />
      )}

      {busy && (
        <p className="hint" role="status">
          Wyznaczam trasę…
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        block
        disabled={!legCount}
        onClick={() => {
          resetRouteTransform()
          setCenterView('frame')
        }}
      >
        Generuj trasę
      </Button>

      <Advanced journey={journey} change={change} legIndex={legIndex} planned={planned} cum={cum} />
    </div>
  )
}
