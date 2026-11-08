import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'

const VIEWS = [
  { value: 'frame', label: 'centerViewSwitch.frame' },
  { value: 'map', label: 'centerViewSwitch.map' },
] as const

export default function CenterViewSwitch() {
  const view = useAppStore((s) => s.centerView)
  const setCenterView = useAppStore((s) => s.setCenterView)
  const { t } = useTranslation()
  return (
    <div className="view-switch" role="radiogroup" aria-label={t('centerViewSwitch.view')}>
      {VIEWS.map((v) => (
        <button key={v.value} type="button" role="radio" aria-checked={view === v.value} className={view === v.value ? 'view-switch-opt active' : 'view-switch-opt'} onClick={() => setCenterView(v.value)}>
          {t(v.label)}
        </button>
      ))}
    </div>
  )
}
