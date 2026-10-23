import { DEFAULT_COLLAGE, DEFAULT_POINT_STYLE, DEFAULT_ROUTE_STYLE, DEFAULT_SLIDES, DEFAULT_STATS_CONTENT, DEFAULT_STATS_LAYOUT, DEFAULT_STATS_STYLE, DEFAULT_TITLE_STYLE, IDENTITY_TRANSFORM } from './defaults'
import { DEFAULT_ANIMATION } from '../features/animation/types'
import { DEFAULT_DATA_COLOR } from '../features/data-color/types'
import { DEFAULT_PROFILE } from '../features/elevation-profile/types'
import type { DocumentState } from './types'

// The one list of what a document is: undo/redo, the export snapshot and the preview
// all take their keys from here, so a new field can't be left out of any of them.
export const INITIAL_DOCUMENT: DocumentState = {
  aspectKey: '9:16',
  routeStyle: DEFAULT_ROUTE_STYLE,
  routeSource: null,
  routeTransform: IDENTITY_TRANSFORM,
  range: { start: 0, end: 0 },
  progress: 100,
  statsStyle: DEFAULT_STATS_STYLE,
  titleStyle: DEFAULT_TITLE_STYLE,
  statsContent: DEFAULT_STATS_CONTENT,
  statsLayout: DEFAULT_STATS_LAYOUT,
  placements: {},
  texts: [],
  waypoints: [],
  pointStyle: DEFAULT_POINT_STYLE,
  slides: DEFAULT_SLIDES,
  collage: DEFAULT_COLLAGE,
  carouselKind: 'panorama',
  kmInterval: 0,
  sourceLayout: null,
  layoutOverrides: {},
  dimOpacity: 0,
  profile: DEFAULT_PROFILE,
  dataColor: DEFAULT_DATA_COLOR,
  animation: DEFAULT_ANIMATION,
}

export const DOCUMENT_KEYS = Object.keys(INITIAL_DOCUMENT) as (keyof DocumentState)[]

export function pickDocument(s: DocumentState): DocumentState {
  const doc: Partial<Record<keyof DocumentState, unknown>> = {}
  for (const key of DOCUMENT_KEYS) doc[key] = s[key]
  return doc as DocumentState
}
