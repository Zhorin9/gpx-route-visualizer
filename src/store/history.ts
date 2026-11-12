import i18n, { type TKey } from '../i18n'
import { pickDocument } from './document'
import type { AppState, Commit, DocumentState, GetState, HistorySlice, SetState } from './types'

const COALESCE_MS = 800
const HISTORY_LIMIT = 100

// What the undo toast calls a step: the whole commit key if listed, else its first segment.
const STEP_LABELS: Record<string, TKey> = {
  'text:add': 'history.textAdd',
  'text:delete': 'history.textDelete',
  'caption:add': 'history.textAdd',
  'waypoint:add': 'history.waypointAdd',
  'waypoint:delete': 'history.waypointDelete',
  'waypoint:captions': 'history.waypointCaptions',
  'dataColor:palette': 'history.dataColorPalette',
  'route:load': 'history.routeLoad',
  mode: 'history.mode',
  'route:append': 'history.routeAppend',
  'route:remove': 'history.routeRemove',
  'slide:add': 'history.slideAdd',
  'slide:remove': 'history.slideRemove',
  'slide:dup': 'history.slideDup',
  'slide:move': 'history.slideMove',
  'slide:skip': 'history.slideSkip',
  'slide:apply': 'history.slideApply',
  'slide:apply:bg': 'history.slideApplyBg',
  slide: 'history.slide',
  'photos:slides': 'history.photosSlides',
  text: 'history.text',
  waypoint: 'history.waypoint',
  nudge: 'history.nudge',
  element: 'history.element',
  route: 'history.route',
  routeStyle: 'history.routeStyle',
  preset: 'history.routeStyle',
  dataColor: 'history.dataColor',
  range: 'history.range',
  progress: 'history.progress',
  kmInterval: 'history.kmInterval',
  profile: 'history.profile',
  stats: 'history.stats',
  statsStyle: 'history.statsStyle',
  statsContent: 'history.stats',
  statVisible: 'history.stats',
  statOverride: 'history.stats',
  statOrder: 'history.statOrder',
  photos: 'history.photos',
  slot: 'history.slot',
  layout: 'history.layout',
  collage: 'history.collage',
  frame: 'history.frame',
  dim: 'history.dim',
  format: 'history.format',
  carousel: 'history.carousel',
  animation: 'history.animation',
  globalFont: 'history.globalFont',
  template: 'history.template',
  photoTheme: 'history.photoTheme',
  iconFinish: 'history.iconFinish',
  sticker: 'history.sticker',
  photoLook: 'history.photoLook',
  stamp: 'history.stamp',
  kicker: 'history.kicker',
  mapSticker: 'history.mapSticker',
  wrapper: 'history.wrapper',
  travel: 'history.travel',
  camera: 'history.camera',
  map: 'history.map',
}

function stepLabel(key: string): TKey {
  return STEP_LABELS[key] ?? STEP_LABELS[key.split(':')[0]] ?? 'history.change'
}

// Undo/redo restores a snapshot, so a selection may point at something gone.
function validSelection(s: AppState, doc: DocumentState): Partial<AppState> {
  const sel = s.selection
  if (!sel || sel.kind === 'element') return {}
  if (sel.kind === 'slot') return doc.slides[sel.slide] ? {} : { selection: null }
  const list = sel.kind === 'text' ? doc.texts : doc.waypoints
  return list.some((item) => item.id === sel.id) ? {} : { selection: null }
}

export function createHistory(set: SetState, get: GetState) {
  let lastKey: string | null = null
  let lastAt = 0

  // Rapid repeats of the same action (slider drag, typing, arrow nudges)
  // collapse into one undo step; a different action always starts a new one.
  // A step taken while a template is previewed keeps the template first, so neither is lost.
  const commit: Commit = (key, update) => {
    get().keepPreview()
    const s = get()
    const now = Date.now()
    const newStep = key !== lastKey || now - lastAt > COALESCE_MS
    lastKey = key
    lastAt = now
    const patch = typeof update === 'function' ? update(s) : update
    const next = { ...s, ...patch }
    set({
      ...(newStep ? { past: [...s.past, { doc: pickDocument(s), label: stepLabel(key) }].slice(-HISTORY_LIMIT), future: [] } : null),
      ...patch,
      ...validSelection(next, next),
    })
  }

  const breakCoalescing = () => {
    lastKey = null
  }

  const resetHistory = () => {
    breakCoalescing()
    set({ past: [], future: [] })
  }

  const slice: HistorySlice = {
    past: [],
    future: [],
    undo: () => {
      get().endPreview()
      const s = get()
      const prev = s.past[s.past.length - 1]
      if (!prev) return
      breakCoalescing()
      set({
        ...prev.doc,
        ...validSelection(s, prev.doc),
        past: s.past.slice(0, -1),
        future: [{ doc: pickDocument(s), label: prev.label }, ...s.future].slice(0, HISTORY_LIMIT),
      })
      get().showToast(i18n.t('history.undone', { step: i18n.t(prev.label) }), 'redo')
    },
    redo: () => {
      get().endPreview()
      const s = get()
      const next = s.future[0]
      if (!next) return
      breakCoalescing()
      set({
        ...next.doc,
        ...validSelection(s, next.doc),
        past: [...s.past, { doc: pickDocument(s), label: next.label }].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
      })
      get().showToast(i18n.t('history.redone', { step: i18n.t(next.label) }), 'undo')
    },
  }

  return { commit, resetHistory, slice }
}
