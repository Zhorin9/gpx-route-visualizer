import Segmented from '../ui/Segmented'
import { useAppStore } from '../../store/useAppStore'
import type { IconFinish } from '../place/icons'
import type { SelectOption } from '../../types'

const OPTIONS: SelectOption<IconFinish>[] = [
  { value: 'sticker', label: 'Naklejka' },
  { value: 'line', label: 'Kreska' },
  { value: 'ink', label: 'Atrament' },
]

// One finish for every icon in the design.
export default function IconFinishField() {
  const finish = useAppStore((s) => s.iconFinish)
  const setIconFinish = useAppStore((s) => s.setIconFinish)
  return <Segmented label="Wykonanie ikon" showLabel value={finish} options={OPTIONS} onChange={setIconFinish} />
}
