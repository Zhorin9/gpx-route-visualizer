import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import Segmented from '../../../components/ui/Segmented'
import { selectRouteParts } from '../../../store/derived'
import { useAppStore } from '../../../store/useAppStore'
import { DEFAULT_LEG_S } from '../../animation/model/schedule'
import { vehicleFor } from '../../animation/vehicles'
import { legPlans, setLeg, type Journey } from '../model/journey'
import { lineOf, travelMode } from '../model/modes'
import { ModeTiles, SecondsField } from './fields'
import type { LineKind, Stop } from '../../../types'

const LINE_ORDER: LineKind[] = ['road', 'straight', 'arc']

export default function LegCard({ index, journey, change }: { index: number; journey: Journey; change: (j: Journey, label: string) => Promise<void> }) {
  const { t } = useTranslation()
  const leg = journey.legs[index]
  const plan = legPlans(journey)[index]
  const mode = travelMode(leg.mode)
  const line = lineOf(leg)
  const vias = plan ? plan.stops.length - 2 : 0
  // The leg's part on the route, found by its end stops: it holds the marker the animation draws.
  const ends = (stops: Stop[]) => `${stops[0]?.id}-${stops[stops.length - 1]?.id}`
  const part = useAppStore((s) => (plan ? selectRouteParts(s).find((p) => p.plan && ends(p.plan.stops) === ends(plan.stops)) : undefined))
  const updatePart = useAppStore((s) => s.updatePart)
  const hasOptions = line === 'road' && (mode.profiles || mode.options || leg.mode === 'car' || leg.mode === 'train')

  return (
    <div className="trip-card">
      {/* Another mode starts with its own line shape and keeps the leg's time. */}
      <ModeTiles label={t('travel.panel.mode')} value={leg.mode} onChange={(id) => change(setLeg(journey, index, { mode: id, ...(leg.duration ? { duration: leg.duration } : null) }), `mode:${index}`)} />
      <Segmented
        label={t('travel.panel.lineShape')}
        showLabel
        value={line}
        options={LINE_ORDER.map((kind) => ({ value: kind, label: t(`travel.lines.${kind}`), disabled: !mode.lines.includes(kind) }))}
        onChange={(kind) => change(setLeg(journey, index, { ...leg, line: kind }), `line:${index}`)}
      />
      {mode.lines.length < LINE_ORDER.length && <p className="hint">{t('travel.panel.onlyStraightOrArc', { mode: t(mode.label) })}</p>}
      {part && mode.vehicle !== 'dot' && (
        <Segmented
          label={t('travel.panel.marker')}
          showLabel
          value={part.vehicle === 'dot' ? 'dot' : 'mode'}
          options={[
            { value: 'mode', label: t(vehicleFor(mode.vehicle).label) },
            { value: 'dot', label: t('animation.vehicles.dot') },
          ]}
          onChange={(v) => updatePart(part.id, { vehicle: v === 'dot' ? 'dot' : mode.vehicle })}
        />
      )}
      <SecondsField label={t('travel.panel.legTime')} value={leg.duration ?? DEFAULT_LEG_S} min={0.5} max={30} onChange={(duration) => change(setLeg(journey, index, { ...leg, duration }), `time:${index}`)} />
      {vias > 0 && plan && (
        <div className="leg-vias">
          <span className="text-muted">{t('travel.panel.vias', { n: vias })}</span>
          <button type="button" className="link-btn" onClick={() => change({ ...journey, stops: journey.stops.filter((s) => !s.via || !plan.stops.includes(s)) }, `vias:${index}`)}>
            {t('travel.panel.removeAll')}
          </button>
        </div>
      )}
      {hasOptions && (
        <details className="trip-options">
          <summary>{t('travel.panel.routeOptions')}</summary>
          {mode.profiles && (
            <Segmented
              label={t('travel.panel.bikeKind')}
              showLabel
              value={leg.profile ?? mode.profiles[0].id}
              options={mode.profiles.map((p) => ({ value: p.id, label: t(p.label) }))}
              onChange={(profile) => change(setLeg(journey, index, { ...leg, profile }), `profile:${index}`)}
            />
          )}
          {mode.options?.map((option) => {
            const on = leg.options?.includes(option.id) ?? false
            const options = on ? (leg.options ?? []).filter((o) => o !== option.id) : [...(leg.options ?? []), option.id]
            return <CheckboxField key={option.id} label={t(option.label)} checked={on} onChange={() => change(setLeg(journey, index, { ...leg, options }), `options:${index}`)} />
          })}
          {leg.mode === 'car' && <p className="hint">{t('travel.panel.carHint')}</p>}
          {leg.mode === 'train' && <p className="hint">{t('travel.panel.trainHint', { speed: mode.avgSpeedKmh })}</p>}
        </details>
      )}
    </div>
  )
}
