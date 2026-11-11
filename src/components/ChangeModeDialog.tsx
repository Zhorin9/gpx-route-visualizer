import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <Dialog onClose={onClose} title={to === 'map' ? t('changeModeDialog.addMapTitle') : losing ? t('changeModeDialog.removeRouteTitle') : t('changeModeDialog.toCollageTitle')}>
      <p className="mode-change-route">
        {t(MODE_LABELS[from])} → {t(MODE_LABELS[to])}
      </p>
      <div className="mode-change-lists">
        <div>
          <span className="mode-change-kicker">{t('changeModeDialog.stays')}</span>
          {keep.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        <div>
          <span className={losing ? 'mode-change-kicker loss' : 'mode-change-kicker'}>{losing ? t('changeModeDialog.willGo') : t('changeModeDialog.goes')}</span>
          {(losing ? lose : [t('changeModeDialog.nothingGoes')]).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
      {losing && (
        <p className="mode-change-warn">
          {t('changeModeDialog.warning')}
        </p>
      )}
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            changeMode(to)
            onClose()
          }}
        >
          {losing ? t('changeModeDialog.confirmRemoveRoute') : to === 'map' ? t('changeModeDialog.toMap') : t('changeModeDialog.toCollage')}
        </Button>
      </div>
    </Dialog>
  )
}
