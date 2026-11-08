import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { useRouteBox } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { CAMERAS, DEFAULT_CAMERA } from '../model/camera'

export default function CameraPanel() {
  const { t } = useTranslation()
  const camera = useAppStore((s) => s.camera)
  const enabled = useAppStore((s) => s.animation.enabled)
  const carousel = useAppStore((s) => s.slides.length > 1)
  const updateCamera = useAppStore((s) => s.updateCamera)
  const [boxW, boxH] = useRouteBox()

  return (
    <fieldset className="panel-fieldset" disabled={!enabled || carousel}>
      <Section title={t('camera.section')}>
        <Segmented label={t('camera.mode')} value={camera.mode} options={CAMERAS.map((c) => ({ value: c.id, label: t(c.label) }))} onChange={(mode) => updateCamera({ mode })} />
        <p className="hint">
          {t(!enabled ? 'camera.needsAnimation' : carousel ? 'camera.offInCarousel' : `camera.hints.${camera.mode}`)}
        </p>
        {camera.mode === 'panorama' && (
          <>
            <Segmented
              label={t('camera.orientation')}
              showLabel
              value={camera.orientation}
              options={[
                { value: 'north', label: t('camera.northUp') },
                { value: 'route', label: t(boxW >= boxH ? 'camera.routeHorizontal' : 'camera.routeVertical') },
              ]}
              onChange={(orientation) => updateCamera({ orientation })}
            />
            <CheckboxField label={t('camera.introOutro')} checked={camera.introOutro} onChange={(introOutro) => updateCamera({ introOutro })} />
            {camera.introOutro && <p className="hint">{t('camera.introOutroHint')}</p>}
          </>
        )}
        {(camera.mode === 'follow' || camera.mode === 'flyover') && (
          <>
            <SliderField label={t('camera.zoom')} unit="×" min={1.5} max={8} step={0.5} value={camera.zoom} defaultValue={DEFAULT_CAMERA.zoom} onChange={(zoom) => updateCamera({ zoom })} />
            <SliderField label={t('camera.smoothing')} unit="s" min={0} max={3} step={0.25} value={camera.smoothing} defaultValue={DEFAULT_CAMERA.smoothing} onChange={(smoothing) => updateCamera({ smoothing })} />
          </>
        )}
        {camera.mode === 'flyover' && (
          <SliderField
            label={t('camera.approach')}
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
