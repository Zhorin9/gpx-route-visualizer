import type { SlotCrop } from '../../types'
import type { TKey } from '../../i18n'

export const CROP_OPTIONS: { value: SlotCrop; label: TKey }[] = [
  { value: 'fill', label: 'cropOptions.fill' },
  { value: 'fit', label: 'cropOptions.fit' },
  { value: 'manual', label: 'cropOptions.manual' },
]
