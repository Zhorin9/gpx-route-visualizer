import { pickDocument } from './document'
import type { AppState, Commit, DocumentState, GetState, HistorySlice, SetState } from './types'

const COALESCE_MS = 800
const HISTORY_LIMIT = 100

// What the undo toast calls a step: the whole commit key if listed, else its first segment.
const STEP_LABELS: Record<string, string> = {
  'text:add': 'dodanie tekstu',
  'text:delete': 'usunięcie tekstu',
  'waypoint:add': 'dodanie miejscowości',
  'waypoint:delete': 'usunięcie miejscowości',
  'dataColor:palette': 'zmiana palety',
  'route:load': 'wczytanie trasy',
  'route:append': 'dodanie dnia trasy',
  'route:remove': 'usunięcie dnia trasy',
  'slide:add': 'dodanie slajdu',
  'slide:remove': 'usunięcie slajdu',
  'template:save': 'zapis szablonu',
  'template:delete': 'usunięcie szablonu',
  text: 'zmiana tekstu',
  waypoint: 'zmiana miejscowości',
  nudge: 'przesunięcie',
  element: 'przesunięcie elementu',
  route: 'zmiana trasy',
  routeStyle: 'zmiana stylu trasy',
  preset: 'zmiana stylu trasy',
  dataColor: 'zmiana koloru trasy',
  range: 'zmiana zakresu trasy',
  progress: 'zmiana postępu trasy',
  kmInterval: 'zmiana znaczników km',
  profile: 'zmiana profilu wysokości',
  stats: 'zmiana statystyk',
  statsStyle: 'zmiana wyglądu statystyk',
  statsContent: 'zmiana statystyk',
  statVisible: 'zmiana statystyk',
  statOverride: 'zmiana statystyk',
  statOrder: 'zmiana kolejności statystyk',
  photos: 'dodanie zdjęć',
  slot: 'zmiana zdjęcia',
  layout: 'zmiana układu',
  collage: 'zmiana tła',
  frame: 'zmiana ramek',
  dim: 'zmiana przyciemnienia',
  format: 'zmiana formatu',
  carousel: 'zmiana karuzeli',
  animation: 'zmiana animacji',
  globalFont: 'zmiana czcionki',
  template: 'zastosowanie szablonu',
}

function stepLabel(key: string): string {
  return STEP_LABELS[key] ?? STEP_LABELS[key.split(':')[0]] ?? 'zmiana'
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
  const commit: Commit = (key, update) => {
    const now = Date.now()
    if (key !== lastKey || now - lastAt > COALESCE_MS) {
      const s = get()
      set({ past: [...s.past, { doc: pickDocument(s), label: stepLabel(key) }].slice(-HISTORY_LIMIT), future: [] })
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
        ...prev.doc,
        ...validSelection(s, prev.doc),
        past: s.past.slice(0, -1),
        future: [{ doc: pickDocument(s), label: prev.label }, ...s.future].slice(0, HISTORY_LIMIT),
      })
      get().showToast(`Cofnięto: ${prev.label}`, 'redo')
    },
    redo: () => {
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
      get().showToast(`Ponowiono: ${next.label}`, 'undo')
    },
  }

  return { commit, resetHistory, slice }
}
