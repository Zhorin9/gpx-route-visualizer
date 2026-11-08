import { useTranslation } from 'react-i18next'
import ColorField from './ColorField'
import SliderField from './SliderField'
import Segmented from '../ui/Segmented'
import type { HardShadow } from '../../types'
import type { TKey } from '../../i18n'

type Kind = 'none' | 'soft' | 'hard'

const OPTIONS: { value: Kind; label: TKey }[] = [
  { value: 'none', label: 'shadowField.none' },
  { value: 'soft', label: 'shadowField.soft' },
  { value: 'hard', label: 'shadowField.hard' },
]

const DEFAULT_HARD_SHADOW: HardShadow = { dx: 5, dy: 5, color: '#241a26' }

export interface ShadowValue {
  soft: boolean
  hard?: HardShadow
}

export default function ShadowField({ soft, hard, onChange }: ShadowValue & { onChange: (value: ShadowValue) => void }) {
  const { t } = useTranslation()
  const kind: Kind = hard ? 'hard' : soft ? 'soft' : 'none'
  const setHard = (patch: Partial<HardShadow>) => onChange({ soft: false, hard: { ...DEFAULT_HARD_SHADOW, ...hard, ...patch } })
  return (
    <>
      <Segmented
        label={t('shadowField.shadow')}
        showLabel
        value={kind}
        options={OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={(next) => (next === 'hard' ? setHard({}) : onChange({ soft: next === 'soft', hard: undefined }))}
      />
      {hard && (
        <>
          <SliderField label={t('shadowField.offsetX')} unit="px" min={-20} max={20} value={hard.dx} defaultValue={DEFAULT_HARD_SHADOW.dx} onChange={(dx) => setHard({ dx })} />
          <SliderField label={t('shadowField.offsetY')} unit="px" min={-20} max={20} value={hard.dy} defaultValue={DEFAULT_HARD_SHADOW.dy} onChange={(dy) => setHard({ dy })} />
          <ColorField label={t('shadowField.color')} value={hard.color} onChange={(color) => setHard({ color })} />
        </>
      )}
    </>
  )
}
