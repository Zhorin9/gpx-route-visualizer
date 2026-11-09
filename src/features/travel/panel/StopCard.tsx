import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import TextField from '../../../components/fields/TextField'
import { IconCrosshair, IconTrash } from '../../../components/icons'
import Button from '../../../components/ui/Button'
import Segmented from '../../../components/ui/Segmented'
import { selectRouteParts } from '../../../store/derived'
import { useAppStore } from '../../../store/useAppStore'
import { DEFAULT_PAUSE_S } from '../../animation/model/schedule'
import { makeVia, moveStop, moveStopTo, named, removeStop, repeatAtEnd, updateStop, type Journey } from '../model/journey'
import { stopLetter } from '../useTravel'
import { SecondsField } from './fields'
import { copyCoordinates } from './format'
import PlaceSearch from './PlaceSearch'
import type { Stop } from '../../../types'

export default function StopCard({ stop, journey, change }: { stop: Stop; journey: Journey; change: (j: Journey, label: string) => Promise<void> }) {
  const { t } = useTranslation()
  const stops = named(journey.stops)
  const index = stops.indexOf(stop)
  const last = index === stops.length - 1
  const nextMode = useAppStore((s) => s.nextMode)
  const label = useAppStore((s) => s.waypoints.find((w) => w.stopId === stop.id))
  const stopPos = useAppStore((s) => {
    const part = selectRouteParts(s).find((p) => p.plan?.stops[0].id === stop.id || p.plan?.stops[p.plan.stops.length - 1].id === stop.id)
    return part && (part.plan?.stops[0].id === stop.id ? part.startIdx : part.endIdx)
  })
  const { addWaypoint, updateWaypoint, deleteWaypoint, setActiveTab, select, setTravelPick, setCenterView, showToast } = useAppStore.getState()
  const pause = stop.pause ?? (last ? 0 : DEFAULT_PAUSE_S)

  function showLabel(on: boolean) {
    if (!on && label) return deleteWaypoint(label.id)
    if (on && stopPos != null) updateWaypoint(addWaypoint(stopPos), { text: stop.name, stopId: stop.id })
  }

  return (
    <div className="trip-card">
      <div className="field">
        <span className="field-label">{t('travel.panel.place')}</span>
        <div className="trip-place">
          <PlaceSearch label={stop.name} near={stop} onPick={(p) => change(moveStopTo(journey, stop.id, p, p.name), `place:${stop.id}`)} />
          <button
            type="button"
            className="icon-btn"
            title={t('travel.panel.pickOnMap')}
            aria-label={t('travel.panel.pickOnMap')}
            onClick={() => {
              setCenterView('map')
              setTravelPick(stop.id)
            }}
          >
            <IconCrosshair />
          </button>
        </div>
        <span className="trip-coords">
          {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)} ·{' '}
          <button type="button" className="link-btn" onClick={() => copyCoordinates(stop)}>
            {t('travel.panel.copyCoords')}
          </button>
        </span>
      </div>

      <TextField label={t('travel.panel.labelName')} value={stop.name} onChange={(name) => change(updateStop(journey, stop.id, { name }), `name:${stop.id}`)} />
      <div className="trip-label-row">
        <CheckboxField label={t('travel.panel.labelShow')} checked={Boolean(label)} disabled={!label && stopPos == null} onChange={showLabel} />
        {label && (
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setActiveTab('texts')
              select({ kind: 'waypoint', id: label.id })
            }}
          >
            {t('travel.panel.labelLook')}
          </button>
        )}
      </div>

      <Segmented
        label={t('travel.panel.kind')}
        showLabel
        value="stop"
        options={[
          { value: 'stop', label: t('travel.panel.kinds.stop') },
          { value: 'via', label: t('travel.panel.kinds.via'), disabled: index === 0 || last },
        ]}
        onChange={(v) => v === 'via' && change(makeVia(journey, stop.id), `via:${stop.id}`)}
      />
      {(index === 0 || last) && <p className="hint">{t('travel.panel.endsCantBeVia')}</p>}

      {index > 0 && <SecondsField label={t('travel.panel.stopPause')} value={pause} min={0} max={10} onChange={(p) => change(updateStop(journey, stop.id, { pause: p }), `pause:${stop.id}`)} />}

      <div className="trip-card-actions">
        <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => change(moveStop(journey, stop.id, index - 1), 'move')} title={t('travel.panel.moveUp')} aria-label={t('travel.panel.moveUp')}>
          ↑
        </Button>
        <Button size="sm" variant="ghost" disabled={last} onClick={() => change(moveStop(journey, stop.id, index + 1), 'move')} title={t('travel.panel.moveDown')} aria-label={t('travel.panel.moveDown')}>
          ↓
        </Button>
        <Button size="sm" variant="ghost" onClick={() => change(repeatAtEnd(journey, stop.id, nextMode), 'add')}>
          {t('travel.panel.repeatAtEnd')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<IconTrash />}
          onClick={() => {
            void change(removeStop(journey, stop.id), 'remove').then(() => showToast(t('travel.panel.removed', { name: stop.name || stopLetter(index) }), 'undo'))
          }}
        >
          {t('travel.panel.remove')}
        </Button>
      </div>
    </div>
  )
}
