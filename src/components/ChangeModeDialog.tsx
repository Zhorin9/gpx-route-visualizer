import { useAppStore } from '../store/useAppStore'
import { MODE_LABELS, describeModeChange } from '../utils/modeChange'
import Button from './ui/Button'
import Dialog from './ui/Dialog'
import type { ProjectMode } from '../types'

export default function ChangeModeDialog({ from, onClose }: { from: ProjectMode; onClose: () => void }) {
  const to: ProjectMode = from === 'map' ? 'collage' : 'map'
  const routeSource = useAppStore((s) => s.routeSource)
  const waypoints = useAppStore((s) => s.waypoints)
  const collage = useAppStore((s) => s.collage)
  const changeMode = useAppStore((s) => s.changeMode)
  const { keep, lose } = describeModeChange(to, { routeSource, waypoints, collage })
  const losing = lose.length > 0

  return (
    <Dialog onClose={onClose} title={to === 'map' ? 'Dodać mapę do projektu?' : losing ? 'Usunąć trasę i zrobić kolaż?' : 'Zmienić projekt na kolaż?'}>
      <p className="mode-change-route">
        {MODE_LABELS[from]} → {MODE_LABELS[to]}
      </p>
      <div className="mode-change-lists">
        <div>
          <span className="mode-change-kicker">Zostaje</span>
          {keep.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        <div>
          <span className={losing ? 'mode-change-kicker loss' : 'mode-change-kicker'}>{losing ? 'Zniknie' : 'Znika'}</span>
          {(losing ? lose : ['Nic nie znika']).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
      {losing && (
        <p className="mode-change-warn">
          Kolaż nie ma trasy ani mapy, więc te dane zostaną usunięte z projektu. Czy na pewno chcesz kontynuować? Zaraz po zmianie możesz ją cofnąć.
        </p>
      )}
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          Anuluj
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            changeMode(to)
            onClose()
          }}
        >
          {losing ? 'Tak, usuń trasę i zmień na Kolaż' : to === 'map' ? 'Zmień na Mapę' : 'Zmień na Kolaż'}
        </Button>
      </div>
    </Dialog>
  )
}
