import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SelectField from '../../../components/fields/SelectField'
import SliderField from '../../../components/fields/SliderField'
import Button from '../../../components/ui/Button'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { selectRouteParts } from '../../../store/derived'
import { useAppStore } from '../../../store/useAppStore'
import { useCanAnimate } from '../hooks'
import { lookFits, MARKER_LOOKS, markerArt, markerColor, markerOf, markerShadowOn } from '../markers'
import { side } from '../markers/side'
import type { MarkerLook } from '../types'
import { artUrl } from '../vehicleArt'
import { vehicleFor, vehicleList } from '../vehicles'
import type { SelectOption, VehicleId } from '../../../types'
import './MarkerSection.css'

// Looks that clash with a sketched background.
const GLOSSY: MarkerLook[] = ['art', 'flat', 'camper', 'classic']
// "Not now" lasts while the app is open.
let sketchHintDismissed = false

const DOT_THUMB = '<circle r="6" fill="#fff" stroke="#24351f" stroke-width="2"/>'

export default function MarkerSection() {
  const { t } = useTranslation()
  const canAnimate = useCanAnimate()
  const settings = useAppStore((s) => s.animation)
  const parts = useAppStore(selectRouteParts)
  const styleColor = useAppStore((s) => s.statsStyle.color)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const glowColor = useAppStore((s) => s.routeStyle.glowColor)
  const sketched = useAppStore((s) => s.map.kind === 'sketch')
  const collage = useAppStore((s) => s.mode === 'collage')
  const { updatePart, updateAnimation } = useAppStore.getState()
  const [hintHidden, setHintHidden] = useState(sketchHintDismissed)
  if (!canAnimate || collage) return null

  const only = parts.length === 1 && parts[0].vehicle ? parts[0] : null
  const vehicleId = only?.vehicle ?? settings.vehicle
  // What the legs show: a trip's legs carry their own vehicles over the one set for the whole route.
  const shown = parts.find((p) => p.vehicle)?.vehicle ?? vehicleId
  const vehicle = vehicleFor(shown === 'dot' ? 'car' : shown)
  const marker = markerOf(settings)
  const colorChoice = marker.color == null || marker.color === 'style' ? 'style' : marker.color === 'route' ? 'route' : 'custom'
  const color = markerColor(marker.color, { style: styleColor, route: routeColor })
  const looks = MARKER_LOOKS.filter((look) => lookFits(vehicle, look))
  const chosen = shown === 'dot' ? 'dot' : looks.includes(marker.look) ? marker.look : looks[0]
  const setVehicle = (id: VehicleId) => (only ? updatePart(only.id, { vehicle: id }) : updateAnimation({ vehicle: id }))

  function thumb(look: MarkerLook): string {
    const art = look === 'side' ? (vehicle.id === 'car' ? side(color) : null) : markerArt(vehicle, look, color, markerShadowOn(settings, look), marker.color == null)
    return artUrl(art ?? `<g transform="scale(1.6)"><path d="${vehicle.path}" fill="${vehicle.outline ? 'none' : color}" stroke="${vehicle.outline ? color : '#fff'}" stroke-width="1.4"/></g>`)
  }

  function pick(look: MarkerLook | 'dot') {
    if (look === 'dot') return setVehicle('dot')
    if (shown === 'dot') setVehicle('car')
    updateAnimation({ vehicleLook: look })
  }

  const vehicleOptions: SelectOption<VehicleId>[] = vehicleList().map((v) => ({ value: v.id, label: t(v.label) }))
  const partOptions: SelectOption<VehicleId | ''>[] = [{ value: '', label: t('animation.panel.sameAsAbove') }, ...vehicleOptions]
  const swatches = [...new Set([styleColor, routeColor, glowColor ?? routeColor, '#111111', '#ffffff'])]

  return (
    <fieldset className="panel-fieldset" disabled={!settings.enabled || !settings.headDot}>
      <Section title={t('animation.panel.markerSection')}>
        {sketched && GLOSSY.includes(chosen as MarkerLook) && vehicle.id === 'car' && !hintHidden && (
          <div className="marker-hint">
            <p>{t('animation.panel.matchSketch')}</p>
            <div className="marker-hint-actions">
              <Button size="sm" onClick={() => updateAnimation({ vehicleLook: 'sketch' })}>
                {t('animation.panel.useSketch')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  sketchHintDismissed = true
                  setHintHidden(true)
                }}
              >
                {t('animation.panel.notNow')}
              </Button>
            </div>
          </div>
        )}
        <SelectField label={t('animation.panel.marker')} value={shown} options={vehicleOptions} onChange={setVehicle} />
        <div className="marker-grid" role="radiogroup" aria-label={t('animation.panel.markerLook')}>
          {(['dot', ...looks] as const).map((look) => (
            <button key={look} type="button" role="radio" aria-checked={chosen === look} className={chosen === look ? 'marker-opt active' : 'marker-opt'} onClick={() => pick(look)}>
              <img src={look === 'dot' ? artUrl(DOT_THUMB) : thumb(look)} alt="" />
              {t(`animation.looks.${look}`)}
            </button>
          ))}
        </div>
        {parts.length > 1 &&
          parts.map((part) => (
            <SelectField key={part.id} label={part.name} value={part.vehicle ?? ''} options={partOptions} onChange={(v) => updatePart(part.id, { vehicle: v || undefined })} />
          ))}
        {chosen !== 'dot' && (
          <>
            <Segmented
              label={t('animation.panel.color')}
              showLabel
              value={colorChoice}
              disabled={chosen === 'sketch'}
              options={[
                { value: 'style', label: t('animation.panel.colors.style') },
                { value: 'route', label: t('animation.panel.colors.route') },
                { value: 'custom', label: t('animation.panel.colors.custom') },
              ]}
              onChange={(v) => updateAnimation({ vehicleColor: v === 'custom' ? color : v })}
            />
            {colorChoice === 'custom' && chosen !== 'sketch' && (
              <>
                <div className="marker-swatches">
                  {swatches.map((c) => (
                    <button key={c} type="button" className="marker-swatch" style={{ background: c }} aria-label={c} aria-pressed={c === color} onClick={() => updateAnimation({ vehicleColor: c })} />
                  ))}
                </div>
                <ColorField label={t('animation.panel.colors.custom')} value={color} onChange={(vehicleColor) => updateAnimation({ vehicleColor })} />
              </>
            )}
            <SliderField label={t('animation.panel.size')} unit="%" min={60} max={160} step={5} value={Math.round((settings.vehicleScale ?? 1) * 100)} defaultValue={100} onChange={(v) => updateAnimation({ vehicleScale: v / 100 })} />
            {chosen !== 'side' && <CheckboxField label={t('animation.panel.shadow')} checked={markerShadowOn(settings, chosen)} onChange={(vehicleShadow) => updateAnimation({ vehicleShadow })} />}
            {chosen !== 'badge' && (
              <Segmented
                label={t('animation.panel.rotation')}
                showLabel
                value={settings.vehicleUpright ? 'upright' : 'follow'}
                options={[
                  { value: 'follow', label: t('animation.panel.rotations.follow') },
                  { value: 'upright', label: t('animation.panel.rotations.upright') },
                ]}
                onChange={(v) => updateAnimation({ vehicleUpright: v === 'upright' })}
              />
            )}
          </>
        )}
      </Section>
    </fieldset>
  )
}
