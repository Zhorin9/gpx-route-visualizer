import { konvaFontStyle } from '../../utils/fonts'
import { measureTextWidth } from '../../utils/measureText'
import type { Photo, PointStyle, Waypoint } from '../../types'
import type { Box } from '../../utils/geometry'
import type { LeaderElement } from './leader'
import { MARKER_WIDTHS, MARKERS, type Marker, type NameArea } from './markers'

export interface PinnedMarker {
  photo: Photo
  Marker: Marker
  width: number
  top: number
}

export interface PlaceLayout {
  marker: PinnedMarker | null
  name: Box
  nameOnMarker: (NameArea & { top: number }) | null
  underlined: boolean
  leader: LeaderElement | null
}

const isNamed = (waypoint: Waypoint) => waypoint.text.trim() !== ''

function measureName(waypoint: Waypoint): Box {
  const lines = waypoint.text.split('\n')
  const widest = Math.max(...lines.map((line) => measureTextWidth(line, waypoint.fontFamily, waypoint.fontSize, konvaFontStyle(waypoint.fontFamily))))
  return { x: 0, y: 0, w: widest, h: lines.length * waypoint.fontSize }
}

export const DEFAULT_ICON_SIZE = 44

export const iconLabel = (waypoint: Waypoint) => (waypoint.kind === 'icon' && waypoint.iconAsLabel && waypoint.icon ? waypoint.icon : null)

export function placeLayout(waypoint: Waypoint, photo: Photo | undefined, style: PointStyle): PlaceLayout {
  const layout = layoutParts(waypoint, photo, style)
  return waypoint.leaderEnabled === false ? { ...layout, leader: null } : layout
}

function layoutParts(waypoint: Waypoint, photo: Photo | undefined, style: PointStyle): PlaceLayout {
  if (iconLabel(waypoint)) {
    const size = waypoint.iconSize ?? DEFAULT_ICON_SIZE
    const box = { x: 0, y: 0, w: size, h: size }
    return { marker: null, name: box, nameOnMarker: null, underlined: false, leader: { kind: 'text', box } }
  }
  const name = measureName(waypoint)
  if (!photo || style.marker === 'label') {
    return { marker: null, name, nameOnMarker: null, underlined: Boolean(photo) && isNamed(waypoint), leader: isNamed(waypoint) ? { kind: 'text', box: name } : null }
  }
  const Marker = MARKERS[style.marker]
  const width = MARKER_WIDTHS[style.size]
  const size = Marker.size(width)
  const top = -size.h - waypoint.fontSize * 0.4
  const area = Marker.nameArea?.(width)
  return {
    marker: { photo, Marker, width, top },
    name,
    nameOnMarker: area ? { ...area, top } : null,
    underlined: false,
    leader: { kind: 'photo', box: { x: 0, y: top, ...size } },
  }
}
