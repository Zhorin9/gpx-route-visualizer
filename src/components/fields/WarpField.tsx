import { useTranslation } from 'react-i18next'
import SliderField from './SliderField'
import Segmented from '../ui/Segmented'
import type { TextWarp } from '../../types'
import type { TKey } from '../../i18n'

type Kind = TextWarp['kind'] | 'none'

const OPTIONS: { value: Kind; label: TKey }[] = [
  { value: 'none', label: 'warpField.straight' },
  { value: 'wave', label: 'warpField.wave' },
  { value: 'arc', label: 'warpField.arc' },
  { value: 'bulge', label: 'warpField.bulge' },
]

const STARTS: Record<TextWarp['kind'], TextWarp> = {
  wave: { kind: 'wave', amount: 15, length: 3.4 },
  arc: { kind: 'arc', amount: 30 },
  bulge: { kind: 'bulge', amount: 30 },
}

export default function WarpField({ value, onChange }: { value: TextWarp | undefined; onChange: (warp: TextWarp | undefined) => void }) {
  const { t } = useTranslation()
  const set = (patch: Partial<TextWarp>) => value && onChange({ ...value, ...patch })
  return (
    <>
      <Segmented label={t('warpField.shape')} showLabel value={value?.kind ?? 'none'} options={OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(kind) => onChange(kind === 'none' ? undefined : STARTS[kind])} />
      {value?.kind === 'wave' && (
        <>
          <SliderField label={t('warpField.waveHeight')} unit="%" min={-60} max={60} value={value.amount} defaultValue={15} onChange={(amount) => set({ amount })} />
          <SliderField label={t('warpField.waveLength')} unit="em" min={1} max={12} step={0.1} value={value.length ?? 3.4} defaultValue={3.4} onChange={(length) => set({ length })} />
        </>
      )}
      {value?.kind === 'arc' && <SliderField label={t('warpField.bend')} unit="%" min={-80} max={80} value={value.amount} defaultValue={30} onChange={(amount) => set({ amount })} />}
      {value?.kind === 'bulge' && <SliderField label={t('warpField.bulge')} unit="%" min={-60} max={100} value={value.amount} defaultValue={30} onChange={(amount) => set({ amount })} />}
      {value && <p className="hint">{t('warpField.hint')}</p>}
    </>
  )
}
