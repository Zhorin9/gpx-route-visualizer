import type { ReactElement } from 'react'
import type { Photo, PhotoMarker, PointStyle, Waypoint } from '../../../types'
import Film from './Film'
import Polaroid from './Polaroid'
import Round from './Round'
import Square from './Square'

export type PhotoCrop = NonNullable<Waypoint['photoCrop']>

export interface MarkerProps {
  photo: Photo
  width: number
  color: string
  crop: PhotoCrop
  onCrop: (crop: PhotoCrop) => void
}

export interface Size {
  w: number
  h: number
}

export interface NameArea extends Size {
  x: number
  y: number
  rotation: number
}

export type Marker = ((props: MarkerProps) => ReactElement) & {
  size: (width: number) => Size
  nameArea?: (width: number) => NameArea
}

export const MARKER_WIDTHS: Record<PointStyle['size'], number> = { S: 120, M: 180, L: 260 }

export const MARKERS: Record<Exclude<PhotoMarker, 'label'>, Marker> = { polaroid: Polaroid, circle: Round, square: Square, film: Film }
