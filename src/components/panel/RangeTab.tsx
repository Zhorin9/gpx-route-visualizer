import { useTranslation } from 'react-i18next'
import RangeSliderField from '../fields/RangeSliderField'
import SliderField from '../fields/SliderField'
import Section from '../ui/Section'
import useRouteRange from '../../hooks/useRouteRange'
import { useRangeStats, useTrackDays } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { formatDay, formatDuration, formatElevation, formatKm } from '../../utils/format'
import { selectTrack } from '../../store/derived'

export default function RangeTab() {
  const { t } = useTranslation()
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const setRange = useAppStore((s) => s.setRange)
  const progress = useAppStore((s) => s.progress)
  const setProgress = useAppStore((s) => s.setProgress)
  const selectDay = useAppStore((s) => s.selectDay)
  const isSchematic = useAppStore((s) => s.routeStyle.shape === 'schematic')
  const days = useTrackDays()
  const stats = useRangeStats()
  const { lastIndex, describe } = useRouteRange()

  if (!track) return null

  const isFull = range.start === 0 && range.end === lastIndex

  return (
    <>
      {days.length > 0 && (
        <Section title={t('rangeTab.tripDay')}>
          <div className="chip-list" role="radiogroup" aria-label={t('rangeTab.tripDay')}>
            <button
              type="button"
              role="radio"
              aria-checked={isFull}
              className={isFull ? 'chip active' : 'chip'}
              onClick={() => setRange({ start: 0, end: lastIndex })}
            >
              {t('rangeTab.wholeRoute')}
            </button>
            {days.map((day, i) => {
              const active = range.start === day.startIdx && range.end === day.endIdx
              return (
                <button
                  key={day.startIdx}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={active ? 'chip active' : 'chip'}
                  onClick={() => selectDay(i)}
                >
                  {t('rangeTab.day', { n: i + 1 })}
                  <small>{formatDay(day.date)}</small>
                </button>
              )
            })}
          </div>
          <p className="hint">{t('rangeTab.dayHint')}</p>
        </Section>
      )}

      <Section title={t('rangeTab.visiblePart')}>
        <RangeSliderField
          label={t('rangeTab.range')}
          min={0}
          max={lastIndex}
          start={range.start}
          end={range.end}
          onChange={(start, end) => setRange({ start, end })}
          describe={describe}
        />
        {stats && (
          <dl className="stat-readout">
            <div>
              <dt>{t('rangeTab.distance')}</dt>
              <dd>{formatKm(stats.distanceKm, 1)}</dd>
            </div>
            <div>
              <dt>{t('rangeTab.elevationGain')}</dt>
              <dd>{formatElevation(stats.elevationGainM, 1)}</dd>
            </div>
            <div>
              <dt>{t('rangeTab.time')}</dt>
              <dd>{formatDuration(stats.durationMs)}</dd>
            </div>
          </dl>
        )}
      </Section>

      <Section title={t('rangeTab.progress')}>
        <SliderField
          label={t('rangeTab.covered')}
          unit="%"
          value={progress}
          defaultValue={100}
          onChange={setProgress}
          disabled={isSchematic}
        />
        <p className="hint">
          {isSchematic ? t('rangeTab.schematicHint') : t('rangeTab.progressHint')}
        </p>
      </Section>
    </>
  )
}
