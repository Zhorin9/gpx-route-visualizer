import ColorField from './ColorField'
import SliderField from './SliderField'
import Segmented from '../ui/Segmented'
import type { HardShadow, SelectOption } from '../../types'

type Kind = 'none' | 'soft' | 'hard'

const OPTIONS: SelectOption<Kind>[] = [
  { value: 'none', label: 'Brak' },
  { value: 'soft', label: 'Miękki' },
  { value: 'hard', label: 'Twardy' },
]

const DEFAULT_HARD_SHADOW: HardShadow = { dx: 5, dy: 5, color: '#241a26' }

export interface ShadowValue {
  soft: boolean
  hard?: HardShadow
}

export default function ShadowField({ soft, hard, onChange }: ShadowValue & { onChange: (value: ShadowValue) => void }) {
  const kind: Kind = hard ? 'hard' : soft ? 'soft' : 'none'
  const setHard = (patch: Partial<HardShadow>) => onChange({ soft: false, hard: { ...DEFAULT_HARD_SHADOW, ...hard, ...patch } })
  return (
    <>
      <Segmented
        label="Cień"
        showLabel
        value={kind}
        options={OPTIONS}
        onChange={(next) => (next === 'hard' ? setHard({}) : onChange({ soft: next === 'soft', hard: undefined }))}
      />
      {hard && (
        <>
          <SliderField label="Przesunięcie w poziomie" unit="px" min={-20} max={20} value={hard.dx} defaultValue={DEFAULT_HARD_SHADOW.dx} onChange={(dx) => setHard({ dx })} />
          <SliderField label="Przesunięcie w pionie" unit="px" min={-20} max={20} value={hard.dy} defaultValue={DEFAULT_HARD_SHADOW.dy} onChange={(dy) => setHard({ dy })} />
          <ColorField label="Kolor cienia" value={hard.color} onChange={(color) => setHard({ color })} />
        </>
      )}
    </>
  )
}
