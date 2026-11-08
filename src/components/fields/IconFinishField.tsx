import { useTranslation } from 'react-i18next'
import Segmented from '../ui/Segmented'
import { useAppStore } from '../../store/useAppStore'
import type { IconFinish } from '../place/icons'
import type { TKey } from '../../i18n'

const OPTIONS: { value: IconFinish; label: TKey }[] = [
  { value: 'sticker', label: 'iconFinishField.sticker' },
  { value: 'line', label: 'iconFinishField.line' },
  { value: 'ink', label: 'iconFinishField.ink' },
]

// One finish for every icon in the design.
export default function IconFinishField() {
  const finish = useAppStore((s) => s.iconFinish)
  const setIconFinish = useAppStore((s) => s.setIconFinish)
  const { t } = useTranslation()
  return <Segmented label={t('iconFinishField.finish')} showLabel value={finish} options={OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={setIconFinish} />
}
