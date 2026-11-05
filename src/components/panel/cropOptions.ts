import type { SelectOption, SlotCrop } from '../../types'

export const CROP_OPTIONS: SelectOption<SlotCrop>[] = [
  { value: 'fill', label: 'Wypełnij' },
  { value: 'fit', label: 'Dopasuj' },
  { value: 'manual', label: 'Ręcznie' },
]
