import ColorField from './ColorField'
import Segmented from '../ui/Segmented'
import { STICKER_COLORS } from '../../utils/sticker'
import type { BadgeShape, SelectOption, TextBadge } from '../../types'

type Choice = BadgeShape | 'none'

const OPTIONS: SelectOption<Choice>[] = [
  { value: 'none', label: 'Brak' },
  { value: 'burst', label: 'Wybuch' },
  { value: 'star', label: 'Gwiazda' },
  { value: 'circle', label: 'Koło' },
  { value: 'ribbon', label: 'Wstęga' },
]

export default function BadgeField({ value, onChange }: { value: TextBadge | undefined; onChange: (badge: TextBadge | undefined) => void }) {
  return (
    <>
      <Segmented
        label="Kształt pod napisem"
        showLabel
        wrap
        value={value?.shape ?? 'none'}
        options={OPTIONS}
        onChange={(shape) => onChange(shape === 'none' ? undefined : { color: STICKER_COLORS[0].hex, ...value, shape })}
      />
      {value && (
        <>
          <ColorField label="Kolor odznaki" value={value.color} onChange={(color) => onChange({ ...value, color })} />
          <p className="hint">Ciemny obrys i twardy cień jak na naklejce. W stylu z grupy Naklejki odznaka bierze kolor naklejki.</p>
        </>
      )}
    </>
  )
}
