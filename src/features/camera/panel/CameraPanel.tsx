import CheckboxField from '../../../components/fields/CheckboxField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { useRouteBox } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { CAMERAS, DEFAULT_CAMERA, type CameraId } from '../model/camera'
import type { SelectOption } from '../../../types'

const MODE_OPTIONS: SelectOption<CameraId>[] = CAMERAS.map((c) => ({ value: c.id, label: c.label }))

const MODE_HINTS: Record<CameraId, string> = {
  static: 'Kadr pokazuje całą trasę przez cały film.',
  follow: 'Kadr jest przybliżony i płynnie podąża za końcem linii.',
  flyover: 'Film zaczyna się od całej trasy, przybliża się do linii, prowadzi ją i na końcu oddala.',
  panorama: 'Kamera jedzie za kropką i trzyma ją w środku kadru. Przybliżenie dobiera sama, z długości trasy.',
}

export default function CameraPanel() {
  const camera = useAppStore((s) => s.camera)
  const enabled = useAppStore((s) => s.animation.enabled)
  const carousel = useAppStore((s) => s.slides.length > 1)
  const updateCamera = useAppStore((s) => s.updateCamera)
  const [boxW, boxH] = useRouteBox()

  return (
    <fieldset className="panel-fieldset" disabled={!enabled || carousel}>
      <Section title="Kamera">
        <Segmented label="Tryb kamery" value={camera.mode} options={MODE_OPTIONS} onChange={(mode) => updateCamera({ mode })} />
        <p className="hint">
          {!enabled ? 'Kamera działa w animacji: włącz ją w podzakładce „Animacja”.' : carousel ? 'W karuzeli kamera jest wyłączona, bo trasa przechodzi przez granice slajdów.' : MODE_HINTS[camera.mode]}
        </p>
        {camera.mode === 'panorama' && (
          <>
            <Segmented
              label="Orientacja mapy"
              showLabel
              value={camera.orientation}
              options={[
                { value: 'north', label: 'Północ u góry' },
                { value: 'route', label: boxW >= boxH ? 'Trasa poziomo' : 'Trasa pionowo' },
              ]}
              onChange={(orientation) => updateCamera({ orientation })}
            />
            <CheckboxField label="Zbliżenie na wejściu, oddalenie na końcu" checked={camera.introOutro} onChange={(introOutro) => updateCamera({ introOutro })} />
            {camera.introOutro && <p className="hint">Zbliżenie trwa do startu linii, a oddalenie do końca filmu: ustawisz je na osi czasu. Po włączeniu linia rusza po 1,5 s.</p>}
          </>
        )}
        {(camera.mode === 'follow' || camera.mode === 'flyover') && (
          <>
            <SliderField label="Przybliżenie" unit="×" min={1.5} max={8} step={0.5} value={camera.zoom} defaultValue={DEFAULT_CAMERA.zoom} onChange={(zoom) => updateCamera({ zoom })} />
            <SliderField label="Płynność" unit="s" min={0} max={3} step={0.25} value={camera.smoothing} defaultValue={DEFAULT_CAMERA.smoothing} onChange={(smoothing) => updateCamera({ smoothing })} />
          </>
        )}
        {camera.mode === 'flyover' && (
          <SliderField
            label="Wejście i wyjście"
            unit="%"
            min={5}
            max={45}
            value={Math.round(camera.approach * 100)}
            defaultValue={DEFAULT_CAMERA.approach * 100}
            onChange={(v) => updateCamera({ approach: v / 100 })}
          />
        )}
      </Section>
    </fieldset>
  )
}
