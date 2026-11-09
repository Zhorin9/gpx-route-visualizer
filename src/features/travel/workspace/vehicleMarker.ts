import { lookFits, markerArt, markerColor, markerOf, markerShadowOn } from '../../animation/markers'
import type { AnimationSettings } from '../../animation/types'
import { artUrl } from '../../animation/vehicleArt'
import type { VehicleDef } from '../../animation/vehicles'

// The leg's vehicle on the planning map, drawn as the frame draws it.
export function vehicleMarkerHtml(vehicle: VehicleDef, settings: AnimationSettings, colors: { style: string; route: string }, angle: number): { html: string; art: boolean } {
  const marker = markerOf(settings)
  const look = lookFits(vehicle, marker.look) ? marker.look : vehicle.art ? 'art' : 'side'
  const west = Math.abs(angle) > 90
  const upright = look === 'badge' || Boolean(settings.vehicleUpright)
  const art = look === 'side' ? null : markerArt(vehicle, look, markerColor(marker.color, colors), markerShadowOn(settings, look), marker.color == null)
  if (art) {
    const turn = upright ? (west && look !== 'badge' ? 'scaleX(-1)' : 'none') : `rotate(${angle}deg)`
    return { html: `<img src="${artUrl(art)}" width="34" height="17" alt="" style="transform:${turn}">`, art: true }
  }
  const flip = upright ? (west ? ' scaleX(-1)' : '') : vehicle.flipWhenWest && west ? ' scaleY(-1)' : ''
  const turn = `transform:${upright ? '' : `rotate(${angle}deg)`}${flip}`
  const color = marker.color == null ? 'currentColor' : markerColor(marker.color, colors)
  const paint = vehicle.outline ? `fill="none" stroke="${color}" stroke-width="2"` : `fill="${color}"`
  return { html: `<svg viewBox="-12 -12 24 24" width="18" height="18" style="${turn}"><path d="${vehicle.path}" ${paint}/></svg>`, art: false }
}
