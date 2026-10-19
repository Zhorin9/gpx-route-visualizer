import RangeSliderField from '../fields/RangeSliderField'
import SliderField from '../fields/SliderField'
import Section from '../ui/Section'
import useRouteRange from '../../hooks/useRouteRange'
import { useRangeStats, useTrackDays } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { formatDay, formatDuration, formatElevation, formatKm } from '../../utils/format'

export default function RangeTab() {
  const track = useAppStore((s) => s.track)
  const range = useAppStore((s) => s.range)
  const setRange = useAppStore((s) => s.setRange)
  const progress = useAppStore((s) => s.progress)
  const setProgress = useAppStore((s) => s.setProgress)
  const selectDay = useAppStore((s) => s.selectDay)
  const isSchematic = useAppStore((s) => s.routeStyle.shape === 'schematic')
  const days = useTrackDays()
  const stats = useRangeStats()
  const { lastIndex, describe } = useRouteRange()

  if (!track) return <p className="hint">Wgraj plik GPX, aby wybrać fragment trasy.</p>

  const isFull = range.start === 0 && range.end === lastIndex

  return (
    <>
      {days.length > 0 && (
        <Section title="Dzień wyprawy">
          <div className="chip-list" role="radiogroup" aria-label="Dzień wyprawy">
            <button
              type="button"
              role="radio"
              aria-checked={isFull}
              className={isFull ? 'chip active' : 'chip'}
              onClick={() => setRange({ start: 0, end: lastIndex })}
            >
              Cała trasa
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
                  Dzień {i + 1}
                  <small>{formatDay(day.date)}</small>
                </button>
              )
            })}
          </div>
          <p className="hint">Wybranie dnia ustawia też numer w etykiecie nagłówka.</p>
        </Section>
      )}

      <Section title="Widoczny fragment">
        <RangeSliderField
          label="Zakres"
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
              <dt>Dystans</dt>
              <dd>{formatKm(stats.distanceKm, 1)}</dd>
            </div>
            <div>
              <dt>Przewyższenie</dt>
              <dd>{formatElevation(stats.elevationGainM, 1)}</dd>
            </div>
            <div>
              <dt>Czas</dt>
              <dd>{formatDuration(stats.durationMs)}</dd>
            </div>
          </dl>
        )}
      </Section>

      <Section title="Postęp">
        <SliderField
          label="Przejechane"
          unit="%"
          value={progress}
          defaultValue={100}
          onChange={setProgress}
          disabled={isSchematic}
        />
        <p className="hint">
          {isSchematic
            ? 'W trybie schematycznym cała trasa jest rysowana jedną linią — postęp nie ma zastosowania.'
            : 'Część trasy po tym punkcie jest rysowana jako „pozostała” (jej wygląd ustawisz niżej, w sekcji „Pozostała trasa”).'}
        </p>
      </Section>
    </>
  )
}
