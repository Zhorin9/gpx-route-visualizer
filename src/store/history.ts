import type { AppState, Commit, DocumentState, GetState, HistorySlice, SetState } from './types'

const COALESCE_MS = 800
const HISTORY_LIMIT = 100

export function pickDocument(s: DocumentState): DocumentState {
  return {
    aspectKey: s.aspectKey,
    routeStyle: s.routeStyle,
    routeTransform: s.routeTransform,
    range: s.range,
    progress: s.progress,
    statsStyle: s.statsStyle,
    statsContent: s.statsContent,
    statsLayout: s.statsLayout,
    texts: s.texts,
    waypoints: s.waypoints,
    bgAdjust: s.bgAdjust,
    dimOpacity: s.dimOpacity,
  }
}

// Undo/redo restores a snapshot, so a selection may point at something gone.
function validSelection(s: AppState, doc: DocumentState): Partial<AppState> {
  const sel = s.selection
  if (!sel) return {}
  const list = sel.kind === 'text' ? doc.texts : doc.waypoints
  return list.some((item) => item.id === sel.id) ? {} : { selection: null }
}

export function createHistory(set: SetState, get: GetState) {
  let lastKey: string | null = null
  let lastAt = 0

  // Rapid repeats of the same action (slider drag, typing, arrow nudges)
  // collapse into one undo step; a different action always starts a new one.
  const commit: Commit = (key, update) => {
    const now = Date.now()
    if (key !== lastKey || now - lastAt > COALESCE_MS) {
      const s = get()
      set({ past: [...s.past, pickDocument(s)].slice(-HISTORY_LIMIT), future: [] })
    }
    lastKey = key
    lastAt = now
    set(update)
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
      const s = get()
      const prev = s.past[s.past.length - 1]
      if (!prev) return
      breakCoalescing()
      set({
        ...prev,
        ...validSelection(s, prev),
        past: s.past.slice(0, -1),
        future: [pickDocument(s), ...s.future].slice(0, HISTORY_LIMIT),
      })
    },
    redo: () => {
      const s = get()
      const next = s.future[0]
      if (!next) return
      breakCoalescing()
      set({
        ...next,
        ...validSelection(s, next),
        past: [...s.past, pickDocument(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
      })
    },
  }

  return { commit, resetHistory, slice }
}
