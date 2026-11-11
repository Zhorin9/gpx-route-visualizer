import { Fragment, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { IconClose, IconDownload, IconGrip, IconPlus, IconReverse } from '../../../components/icons'
import Button from '../../../components/ui/Button'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { selectRouteParts } from '../../../store/derived'
import { useTrackCumKm } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { downloadBlob } from '../../../utils/exportImage'
import { formatDistance } from '../../../core/units'
import { toGpxText } from '../../../utils/gpx'
import { DEFAULT_PAUSE_S } from '../../animation/model/schedule'
import { legName, legPlans, moveStop, named, removeStop, reverseJourney, sameLeg, setLeg, type Journey } from '../model/journey'
import { LINE_LABELS, lineOf, travelMode } from '../model/modes'
import { stopLetter, useTravelActions } from '../useTravel'
import { ModeIcon, ModeTiles } from './fields'
import { formatSpan, seconds, spanOf } from './format'
import LegCard from './LegCard'
import PlaceSearch from './PlaceSearch'
import StopCard from './StopCard'
import type { GpxPoint, RoutePart, Stop } from '../../../types'
import './TravelPanel.css'

interface Drag {
  id: number
  from: number
  to: number
  startY: number
  dy: number
  // Middles of the rows when the drag began.
  mids: number[]
}

function Advanced({ journey, planned, cum }: { journey: Journey; planned: RoutePart[]; cum: Float64Array | null }) {
  const { t } = useTranslation()
  const setJourney = useAppStore((s) => s.setJourney)
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const hasFiles = parts.some((p) => !p.plan)
  const stops = named(journey.stops)

  const totals = new Map<string, number>()
  for (const p of planned) {
    if (!p.plan || !cum) continue
    const label = t(travelMode(p.plan.mode).label)
    totals.set(label, (totals.get(label) ?? 0) + cum[p.endIdx] - cum[p.startIdx])
  }

  function downloadGpx() {
    const points: GpxPoint[] = planned.flatMap((p) => cache[p.sourceKey] ?? [])
    const name = stops.length > 1 ? `${stops[0].name} – ${stops[stops.length - 1].name}` : t('travel.panel.trip')
    downloadBlob(new Blob([toGpxText(name, points)], { type: 'application/gpx+xml' }), `${name}.gpx`)
  }

  return (
    <Section title={t('travel.panel.advanced')} collapseId="travel-advanced" startCollapsed>
      {hasFiles && planned.length > 0 && (
        <Segmented
          label={t('travel.panel.tripPlace')}
          showLabel
          value={parts[0]?.plan ? 'start' : 'end'}
          options={[
            { value: 'start', label: t('travel.panel.beforeFile') },
            { value: 'end', label: t('travel.panel.afterFile') },
          ]}
          onChange={(v) => void setJourney(journey, 'place', { atStart: v === 'start' })}
        />
      )}
      {planned.length > 0 ? (
        <>
          <p className="hint">{[...totals].map(([label, km]) => `${label} ${formatDistance(km, 'metric', 0)}`).join(' · ')}. {t('travel.panel.estimated')}</p>
          <Button icon={<IconDownload />} block onClick={downloadGpx} title={legPlans(journey).map(legName).join(', ')}>
            {t('travel.panel.downloadGpx')}
          </Button>
        </>
      ) : (
        <p className="hint">{t('travel.panel.advancedEmpty')}</p>
      )}
    </Section>
  )
}

export default function TravelPanel() {
  const { t } = useTranslation()
  const { journey, change, addAt } = useTravelActions()
  const busy = useAppStore((s) => s.travelBusy)
  const error = useAppStore((s) => s.travelError)
  const failedLeg = useAppStore((s) => s.travelFailedLeg)
  const selection = useAppStore((s) => s.travelSelection)
  const insert = useAppStore((s) => s.travelInsert)
  const nextMode = useAppStore((s) => s.nextMode)
  const { selectTravel, setTravelInsert, setNextMode, setCenterView, resetRouteTransform, showToast } = useAppStore.getState()
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const cum = useTrackCumKm()
  const [drag, setDrag] = useState<Drag | null>(null)
  const [announce, setAnnounce] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const focusGrip = useRef<number | null>(null)

  const stops = named(journey.stops)
  const plans = legPlans(journey)
  const planned = parts.filter((p) => p.plan)
  const legCount = journey.legs.length
  const selectedStop = selection?.kind === 'stop' ? stops.find((s) => s.id === selection.id) : undefined
  const legIndex = selection?.kind === 'leg' && selection.index < legCount ? selection.index : null
  // A leg is routed once the route holds a part made from the same plan.
  const routed = (i: number) => Boolean(planned[i]?.plan && plans[i] && sameLeg(planned[i].plan!, plans[i]))
  const allRouted = plans.every((_, i) => routed(i))

  // The row picked on the map comes into view.
  useEffect(() => {
    listRef.current?.querySelector('.trip-row.selected')?.scrollIntoView({ block: 'nearest' })
  }, [selection])

  // Focus follows a stop moved from the keyboard.
  useEffect(() => {
    if (focusGrip.current == null) return
    listRef.current?.querySelector<HTMLElement>(`[data-grip="${focusGrip.current}"]`)?.focus()
    focusGrip.current = null
  }, [journey])

  function legMeta(i: number): string {
    if (!routed(i)) return busy ? t('travel.panel.routingLeg') : '—'
    const part = planned[i]
    if (!cum) return ''
    const points = cache[part.sourceKey] ?? []
    const ms = spanOf(points)
    return `${formatDistance(cum[part.endIdx] - cum[part.startIdx], 'metric', 0)} · ${formatSpan(ms)}`
  }

  function summary(): string {
    const count = t('travel.panel.stopCount', { count: stops.length })
    if (stops.length < 2) return count
    if (!allRouted || !cum) return `${count} · ${t('travel.panel.counting')}`
    const km = planned.reduce((sum, p) => sum + cum[p.endIdx] - cum[p.startIdx], 0)
    const ms = planned.reduce((sum, p) => {
      const points = cache[p.sourceKey] ?? []
      return sum + spanOf(points)
    }, 0)
    return `${count} · ${formatDistance(km, 'metric', 0)} · ${formatSpan(ms)}`
  }

  function stopMeta(stop: Stop, i: number): string {
    const last = i === stops.length - 1
    if (i === 0) return t('travel.panel.metaStart')
    const pause = stop.pause ?? (last ? 0 : DEFAULT_PAUSE_S)
    const rest = pause > 0 ? t('travel.panel.rest', { time: seconds(pause) }) : ''
    return last ? [t('travel.panel.metaEnd'), rest].filter(Boolean).join(' · ') : rest || t('travel.panel.noRest')
  }

  function toggle(next: typeof selection) {
    const same = next?.kind === selection?.kind && (next?.kind === 'stop' ? selection?.kind === 'stop' && next.id === selection.id : selection?.kind === 'leg' && next?.index === selection.index)
    selectTravel(same ? null : next)
  }

  function moveFromKeys(stop: Stop, to: number) {
    if (to < 0 || to >= stops.length) return
    focusGrip.current = stop.id
    setAnnounce(t('travel.panel.position', { name: stop.name, n: to + 1, of: stops.length }))
    void change(moveStop(journey, stop.id, to), 'move')
  }

  function remove(stop: Stop, i: number) {
    void change(removeStop(journey, stop.id), 'remove').then(() => showToast(t('travel.panel.removed', { name: stop.name || stopLetter(i) }), 'undo'))
  }

  function startDrag(e: PointerEvent<HTMLButtonElement>, stop: Stop, i: number) {
    if (e.button !== 0) return
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-stop-row]') ?? [])]
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ id: stop.id, from: i, to: i, startY: e.clientY, dy: 0, mids: rows.map((r) => r.getBoundingClientRect().top + r.offsetHeight / 2) })
  }

  function moveDrag(e: PointerEvent) {
    if (!drag) return
    const dy = e.clientY - drag.startY
    const y = drag.mids[drag.from] + dy
    const to = drag.mids.filter((m, k) => k !== drag.from && m < y).length
    setDrag({ ...drag, dy, to })
  }

  function endDrag() {
    if (!drag) return
    if (drag.to !== drag.from) void change(moveStop(journey, drag.id, drag.to), 'move')
    setDrag(null)
  }

  function reverse() {
    void change(reverseJourney(journey), 'reverse').then(() => showToast(t('travel.panel.reversed'), 'undo'))
  }

  const addLabel = stops.length === 0 ? t('travel.panel.addFirst') : stops.length === 1 ? t('travel.panel.addSecond') : t('travel.panel.addStop')
  const between = (i: number) => ({ from: stopLetter(i), to: stopLetter(i + 1) })
  const failed = failedLeg != null && failedLeg < legCount ? failedLeg : null

  return (
    <div className="travel-panel">
      <div className="trip-head">
        <h6>{t('travel.stops')}</h6>
        {stops.length > 1 && (
          <Button variant="ghost" size="sm" icon={<IconReverse />} onClick={reverse}>
            {t('travel.panel.reverse')}
          </Button>
        )}
      </div>
      {stops.length > 0 ? <p className="trip-summary">{summary()}</p> : <p className="hint">{t('travel.panel.empty')}</p>}

      {error && failed != null && (
        <div className="trip-error" role="alert">
          <p>{t('travel.panel.legFailed', between(failed))}</p>
          <p className="hint">{error}</p>
          <div className="trip-card-actions">
            <Button
              size="sm"
              onClick={() => {
                const { line: _line, ...leg } = journey.legs[failed]
                void change(setLeg(journey, failed, leg), `retry:${failed}`)
              }}
            >
              {t('travel.panel.retry')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => useAppStore.setState({ travelError: '', travelFailedLeg: null })}>
              {t('travel.panel.drawStraight')}
            </Button>
          </div>
        </div>
      )}

      <div className="trip-list" role="list" aria-label={t('travel.panel.list')} ref={listRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => setDrag(null)}>
        {stops.map((stop, i) => {
          const selected = selectedStop?.id === stop.id
          const dragged = drag?.id === stop.id
          const dropMark = drag && !dragged && drag.to === i ? (drag.to < drag.from ? 'drop-above' : 'drop-below') : ''
          const leg = journey.legs[i]
          return (
            <Fragment key={stop.id}>
              <div
                role="listitem"
                data-stop-row
                aria-label={`${stopLetter(i)}, ${stop.name}`}
                className={['trip-row trip-stop', selected && 'selected', dragged && 'lifted', dropMark].filter(Boolean).join(' ')}
                style={dragged ? { transform: `translateY(${drag.dy}px) rotate(-1deg)` } : undefined}
                onClick={() => toggle({ kind: 'stop', id: stop.id })}
              >
                <button
                  type="button"
                  className="trip-handle"
                  data-grip={stop.id}
                  aria-label={t('travel.panel.reorder', { name: stop.name })}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => startDrag(e, stop, i)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') moveFromKeys(stop, i - 1)
                    else if (e.key === 'ArrowDown') moveFromKeys(stop, i + 1)
                    else if (e.key === 'Delete') remove(stop, i)
                    else if (e.key === 'Enter') toggle({ kind: 'stop', id: stop.id })
                    else return
                    e.preventDefault()
                  }}
                >
                  <IconGrip />
                </button>
                <span className="trip-letter" aria-hidden="true">
                  {stopLetter(i)}
                </span>
                <span className="trip-text">
                  <span className="trip-title">{stop.name}</span>
                  <span className="trip-meta">{stopMeta(stop, i)}</span>
                </span>
              </div>
              {selected && <StopCard stop={stop} journey={journey} change={change} />}

              {leg && (
                <div role="listitem" className={['trip-row trip-leg', legIndex === i && 'selected', insert === i && 'inserting'].filter(Boolean).join(' ')}>
                  <button
                    type="button"
                    className="trip-insert"
                    aria-label={t('travel.panel.insert', between(i))}
                    title={t('travel.panel.insert', between(i))}
                    aria-expanded={insert === i}
                    onClick={() => setTravelInsert(insert === i ? null : i)}
                  >
                    <IconPlus />
                  </button>
                  <button type="button" className="trip-leg-body" aria-expanded={legIndex === i} onClick={() => toggle({ kind: 'leg', index: i })}>
                    <ModeIcon mode={leg.mode} />
                    <span className="trip-text">
                      <span className="trip-title">
                        {t(travelMode(leg.mode).label)} · {t(LINE_LABELS[lineOf(leg)])}
                      </span>
                      <span className="trip-meta">{legMeta(i)}</span>
                    </span>
                  </button>
                </div>
              )}
              {insert === i && (
                <div className="trip-gap">
                  <span className="trip-letter add" aria-hidden="true">
                    <IconPlus />
                  </span>
                  <PlaceSearch
                    autoFocus
                    label={t('travel.panel.insertHere', between(i))}
                    near={stop}
                    onPick={(p) => addAt({ name: p.name, lat: p.lat, lon: p.lon, via: false }, i)}
                    onCancel={() => setTravelInsert(null)}
                  />
                  <button type="button" className="icon-btn" aria-label={t('travel.panel.cancelInsert')} title={t('travel.panel.cancelInsert')} onClick={() => setTravelInsert(null)}>
                    <IconClose />
                  </button>
                </div>
              )}
              {legIndex === i && <LegCard index={i} journey={journey} change={change} />}
            </Fragment>
          )
        })}

        <div className={stops.length ? 'trip-add' : 'trip-add first'}>
          <span className="trip-letter next" aria-hidden="true">
            {stopLetter(stops.length)}
          </span>
          <div className="trip-add-field">
            <PlaceSearch autoFocus={stops.length === 0} label={addLabel} near={stops[stops.length - 1] ?? null} onPick={(p) => addAt({ name: p.name, lat: p.lat, lon: p.lon, via: false }, null)} />
            <span className="trip-add-hint">{t('travel.panel.addHint')}</span>
          </div>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>

      {stops.length === 1 && <ModeTiles label={t('travel.panel.nextMode', { to: stopLetter(1) })} value={nextMode} onChange={setNextMode} />}

      <Button
        variant="primary"
        block
        disabled={!legCount}
        onClick={() => {
          resetRouteTransform()
          setCenterView('frame')
        }}
      >
        {t('travel.panel.generate')}
      </Button>

      <Advanced journey={journey} planned={planned} cum={cum} />
    </div>
  )
}
