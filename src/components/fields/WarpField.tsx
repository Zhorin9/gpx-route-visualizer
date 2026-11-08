import SliderField from './SliderField'
import Segmented from '../ui/Segmented'
import type { SelectOption, TextWarp } from '../../types'

type Kind = TextWarp['kind'] | 'none'

const OPTIONS: SelectOption<Kind>[] = [
  { value: 'none', label: 'Prosto' },
  { value: 'wave', label: 'Fala' },
  { value: 'arc', label: 'Łuk' },
  { value: 'bulge', label: 'Wybrzuszenie' },
]

const STARTS: Record<TextWarp['kind'], TextWarp> = {
  wave: { kind: 'wave', amount: 15, length: 3.4 },
  arc: { kind: 'arc', amount: 30 },
  bulge: { kind: 'bulge', amount: 30 },
}

export default function WarpField({ value, onChange }: { value: TextWarp | undefined; onChange: (warp: TextWarp | undefined) => void }) {
  const set = (patch: Partial<TextWarp>) => value && onChange({ ...value, ...patch })
  return (
    <>
      <Segmented label="Kształt napisu" showLabel value={value?.kind ?? 'none'} options={OPTIONS} onChange={(kind) => onChange(kind === 'none' ? undefined : STARTS[kind])} />
      {value?.kind === 'wave' && (
        <>
          <SliderField label="Wysokość fali" unit="%" min={-60} max={60} value={value.amount} defaultValue={15} onChange={(amount) => set({ amount })} />
          <SliderField label="Długość fali" unit="em" min={1} max={12} step={0.1} value={value.length ?? 3.4} defaultValue={3.4} onChange={(length) => set({ length })} />
        </>
      )}
      {value?.kind === 'arc' && <SliderField label="Wygięcie (minus w dół)" unit="%" min={-80} max={80} value={value.amount} defaultValue={30} onChange={(amount) => set({ amount })} />}
      {value?.kind === 'bulge' && <SliderField label="Wybrzuszenie" unit="%" min={-60} max={100} value={value.amount} defaultValue={30} onChange={(amount) => set({ amount })} />}
      {value && <p className="hint">Napis układa się w jedną linię. Dwuklik na kadrze nadal edytuje treść.</p>}
    </>
  )
}
