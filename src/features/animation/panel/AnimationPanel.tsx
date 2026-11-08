import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import SelectField from '../../../components/fields/SelectField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { useCanAnimate } from '../hooks'
import { useAppStore } from '../../../store/useAppStore'
import { PACINGS } from '../model/pacing'
import { selectDuration } from '../model/timeline'
import { DEFAULT_ANIMATION } from '../types'
import { formatTime } from '../ui/formatTime'
import TimelineEditor from './TimelineEditor'
import { selectRouteParts, selectTrack } from '../../../store/derived'
import { vehicleList } from '../vehicles'
import type { SelectOption, VehicleId } from '../../../types'

// A route of one planned leg shows the leg's marker (a plane for a flight), so that is the one set here.
function VehicleFields() {
  const parts = useAppStore(selectRouteParts)
  const fallback = useAppStore((s) => s.animation.vehicle)
  const look = useAppStore((s) => s.animation.vehicleLook)
  const updatePart = useAppStore((s) => s.updatePart)
  const updateAnimation = useAppStore((s) => s.updateAnimation)
  const { t } = useTranslation()
  const only = parts.length === 1 && parts[0].vehicle ? parts[0] : null
  const vehicleOptions: SelectOption<VehicleId>[] = vehicleList().map((v) => ({ value: v.id, label: t(v.label) }))
  const options: SelectOption<VehicleId | ''>[] = [{ value: '', label: t('animation.panel.sameAsAbove') }, ...vehicleOptions]
  return (
    <>
      <SelectField
        label={t('animation.panel.marker')}
        value={only?.vehicle ?? fallback}
        options={vehicleOptions}
        onChange={(vehicle) => (only ? updatePart(only.id, { vehicle }) : updateAnimation({ vehicle }))}
      />
      <Segmented
        label={t('animation.panel.markerLook')}
        showLabel
        value={look ?? 'art'}
        options={[
          { value: 'art', label: t('animation.looks.art') },
          { value: 'route', label: t('animation.looks.route') },
          { value: 'mono', label: t('animation.looks.mono') },
        ]}
        onChange={(vehicleLook) => updateAnimation({ vehicleLook })}
      />
      {parts.length > 1 &&
        parts.map((part) => (
          <SelectField key={part.id} label={part.name} value={part.vehicle ?? ''} options={options} onChange={(v) => updatePart(part.id, { vehicle: v || undefined })} />
        ))}
    </>
  )
}

export function AnimationTimingSection() {
  const { t } = useTranslation()
  const canAnimate = useCanAnimate()
  const collage = useAppStore((s) => s.mode === 'collage')
  const settings = useAppStore((s) => s.animation)
  const duration = useAppStore(selectDuration)
  const track = useAppStore(selectTrack)
  const updateAnimation = useAppStore((s) => s.updateAnimation)
  const setDrawDuration = useAppStore((s) => s.setDrawDuration)
  const setClip = useAppStore((s) => s.setClip)
  if (!canAnimate)
    return <p className="hint">{collage ? t('animation.panel.noPhotos') : t('animation.panel.noRoute')}</p>

  const pacingNote = track ? PACINGS.find((p) => p.id === settings.pacing)?.unavailable?.(track) : null

  return (
    <>
      <Section title={collage ? t('animation.panel.collageTitle') : t('animation.panel.routeTitle')}>
        <CheckboxField label={collage ? t('animation.panel.animatePhotos') : t('animation.panel.animateRoute')} checked={settings.enabled} onChange={(enabled) => updateAnimation({ enabled })} />
        <p className="hint">
          {settings.enabled
            ? t('animation.panel.enabledHint')
            : t('animation.panel.disabledHint')}
        </p>
      </Section>
      {/* A disabled fieldset locks every control inside it at once. */}
      <fieldset className="panel-fieldset" disabled={!settings.enabled}>
      <Section title={t('animation.timeline.title')}>
        <TimelineEditor />
        <p className="hint">{t('animation.panel.totalHint', { time: formatTime(duration) })}</p>
      </Section>
      {collage ? (
        <Section title={t('animation.panel.photos')}>
          <SliderField
            label={t('animation.panel.photosTime')}
            unit="s"
            min={0.5}
            max={15}
            step={0.5}
            value={settings.clips.photos.duration}
            defaultValue={DEFAULT_ANIMATION.clips.photos.duration}
            onChange={(seconds) => setClip('photos', { ...settings.clips.photos, duration: seconds })}
          />
          <p className="hint">{t('animation.panel.photosHint')}</p>
        </Section>
      ) : (
      <Section title={t('animation.panel.drawing')}>
        <SliderField
          label={t('animation.panel.drawTime')}
          unit="s"
          min={2}
          max={30}
          step={0.5}
          value={settings.clips.route.duration}
          defaultValue={DEFAULT_ANIMATION.clips.route.duration}
          onChange={setDrawDuration}
        />
        <Segmented label={t('animation.panel.pacing')} showLabel value={settings.pacing} options={PACINGS.map((p) => ({ value: p.id, label: t(p.label) }))} onChange={(pacing) => updateAnimation({ pacing })} />
        {pacingNote && <p className="hint">{t(pacingNote)}</p>}
        {settings.pacing === 'bySpeed' && !pacingNote && <p className="hint">{t('animation.panel.bySpeedHint')}</p>}
        <CheckboxField label={t('animation.panel.ghost')} checked={settings.ghost} onChange={(ghost) => updateAnimation({ ghost })} />
        <CheckboxField label={t('animation.panel.headDot')} checked={settings.headDot} onChange={(headDot) => updateAnimation({ headDot })} />
        {settings.headDot && (
          <>
            <VehicleFields />
            <SliderField label={t('animation.panel.headSize')} unit="px" min={4} max={24} value={settings.headSize} defaultValue={DEFAULT_ANIMATION.headSize} onChange={(headSize) => updateAnimation({ headSize })} />
          </>
        )}
      </Section>
      )}
      <Section title={t('animation.panel.others')}>
        <Segmented
          label={t('animation.panel.entrance')}
          showLabel
          value={settings.entrance}
          options={[
            { value: 'fade', label: t('animation.entrance.fade') },
            { value: 'slide', label: t('animation.entrance.slide') },
          ]}
          onChange={(entrance) => updateAnimation({ entrance })}
        />
        {!collage && (
          <>
            <CheckboxField label={t('animation.panel.syncWaypoints')} checked={settings.syncWaypoints} onChange={(syncWaypoints) => updateAnimation({ syncWaypoints })} />
            <CheckboxField label={t('animation.panel.countStats')} checked={settings.countStats} onChange={(countStats) => updateAnimation({ countStats })} />
          </>
        )}
        <SliderField label={t('animation.panel.endHold')} unit="s" min={0} max={5} step={0.5} value={settings.endHold} defaultValue={DEFAULT_ANIMATION.endHold} onChange={(endHold) => updateAnimation({ endHold })} />
        <CheckboxField label={t('animation.panel.loop')} checked={settings.loop} onChange={(loop) => updateAnimation({ loop })} />
      </Section>
      </fieldset>
    </>
  )
}
