import CheckboxField from '../../../components/fields/CheckboxField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { PACINGS } from '../model/pacing'
import { totalDuration } from '../model/timeline'
import { DEFAULT_ANIMATION, type Entrance, type PacingId } from '../types'
import { formatTime } from '../ui/formatTime'
import TimelineEditor from './TimelineEditor'
import type { SelectOption } from '../../../types'

const PACING_OPTIONS: SelectOption<PacingId>[] = PACINGS.map((p) => ({ value: p.id, label: p.label }))

const ENTRANCE_OPTIONS: SelectOption<Entrance>[] = [
  { value: 'fade', label: 'Pojawianie' },
  { value: 'slide', label: 'Wysunięcie' },
]

export function AnimationTimingSection() {
  const hasRoute = useHasRoute()
  const settings = useAppStore((s) => s.animation)
  const track = useAppStore((s) => s.track)
  const updateAnimation = useAppStore((s) => s.updateAnimation)
  const setDrawDuration = useAppStore((s) => s.setDrawDuration)
  if (!hasRoute) return <p className="hint">Wgraj plik GPX, aby animować trasę.</p>

  const pacingNote = track ? PACINGS.find((p) => p.id === settings.pacing)?.unavailable?.(track) : null

  return (
    <>
      <Section title="Animacja trasy">
        <CheckboxField label="Włącz animację trasy" checked={settings.enabled} onChange={(enabled) => updateAnimation({ enabled })} />
        <p className="hint">
          {settings.enabled
            ? 'Pod kadrem jest pasek odtwarzania, a w zakładce Eksport możesz zapisać film.'
            : 'Animacja jest wyłączona: grafika jest statyczna, a eksport wideo niedostępny.'}
        </p>
      </Section>
      {/* A disabled fieldset locks every control inside it at once. */}
      <fieldset className="panel-fieldset" disabled={!settings.enabled}>
      <Section title="Oś czasu">
        <TimelineEditor />
        <p className="hint">Długość całej animacji: {formatTime(totalDuration(settings))}. Przeciągnij pasek, aby zmienić początek, a uchwyt z prawej — długość.</p>
      </Section>
      <Section title="Rysowanie trasy">
        <SliderField
          label="Czas rysowania"
          unit="s"
          min={2}
          max={30}
          step={0.5}
          value={settings.clips.route.duration}
          defaultValue={DEFAULT_ANIMATION.clips.route.duration}
          onChange={setDrawDuration}
        />
        <Segmented label="Tempo" showLabel value={settings.pacing} options={PACING_OPTIONS} onChange={(pacing) => updateAnimation({ pacing })} />
        {pacingNote && <p className="hint">{pacingNote}</p>}
        {settings.pacing === 'bySpeed' && !pacingNote && <p className="hint">Szybkie zjazdy mijają szybko, podjazdy trwają dłużej. Postoje są pomijane.</p>}
        <CheckboxField label="Duch reszty trasy" checked={settings.ghost} onChange={(ghost) => updateAnimation({ ghost })} />
        <CheckboxField label="Świecący punkt na końcu linii" checked={settings.headDot} onChange={(headDot) => updateAnimation({ headDot })} />
        {settings.headDot && (
          <SliderField label="Wielkość punktu" unit="px" min={4} max={24} value={settings.headSize} defaultValue={DEFAULT_ANIMATION.headSize} onChange={(headSize) => updateAnimation({ headSize })} />
        )}
      </Section>
      <Section title="Pozostałe elementy">
        <Segmented label="Wejście elementów" showLabel value={settings.entrance} options={ENTRANCE_OPTIONS} onChange={(entrance) => updateAnimation({ entrance })} />
        <CheckboxField label="Punkty pojawiają się, gdy dotrze do nich linia" checked={settings.syncWaypoints} onChange={(syncWaypoints) => updateAnimation({ syncWaypoints })} />
        <CheckboxField label="Statystyki liczą się razem z trasą" checked={settings.countStats} onChange={(countStats) => updateAnimation({ countStats })} />
        <SliderField label="Pauza na końcu" unit="s" min={0} max={5} step={0.5} value={settings.endHold} defaultValue={DEFAULT_ANIMATION.endHold} onChange={(endHold) => updateAnimation({ endHold })} />
        <CheckboxField label="Zapętlaj podgląd" checked={settings.loop} onChange={(loop) => updateAnimation({ loop })} />
      </Section>
      </fieldset>
    </>
  )
}
