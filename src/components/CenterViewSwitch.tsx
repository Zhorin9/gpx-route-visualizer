import { useAppStore } from '../store/useAppStore'

const VIEWS = [
  { value: 'frame', label: 'Kadr' },
  { value: 'map', label: 'Mapa' },
] as const

// Kadr / Mapa: what the middle of the editor shows in a tab that has its own workspace.
export default function CenterViewSwitch() {
  const view = useAppStore((s) => s.centerView)
  const setCenterView = useAppStore((s) => s.setCenterView)
  return (
    <div className="view-switch" role="radiogroup" aria-label="Widok">
      {VIEWS.map((v) => (
        <button key={v.value} type="button" role="radio" aria-checked={view === v.value} className={view === v.value ? 'view-switch-opt active' : 'view-switch-opt'} onClick={() => setCenterView(v.value)}>
          {v.label}
        </button>
      ))}
    </div>
  )
}
