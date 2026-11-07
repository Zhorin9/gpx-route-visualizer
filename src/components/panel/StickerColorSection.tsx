import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { useAppStore } from '../../store/useAppStore'
import { STICKER_COLORS, STICKER_INK, type StickerSettings } from '../../utils/sticker'
import type { SelectOption } from '../../types'

const MODES: SelectOption<StickerSettings['mode']>[] = [
  { value: 'manual', label: 'Ręcznie' },
  { value: 'photo', label: 'Ze zdjęcia' },
  { value: 'series', label: 'Seria' },
]

const HINTS: Record<StickerSettings['mode'], string> = {
  manual: 'Jeden kolor dla wszystkich elementów stylu: tytuł, data, trasa, ikony, liczby.',
  photo: 'Z zestawu wybieram kolor o największym kontraście do tła pod elementami. Nad zdjęciem zostaje kolor wybrany ręcznie.',
  series: 'Każdy kolejny slajd dostaje kolejny kolor z zestawu, zaczynając od wybranego.',
}

export default function StickerColorSection() {
  const sticker = useAppStore((s) => s.sticker)
  const update = useAppStore((s) => s.updateSticker)
  return (
    <Section title="Kolor naklejki">
      {sticker ? (
        <>
          <div className="sticker-swatches" role="radiogroup" aria-label="Kolor naklejki">
            {STICKER_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={c.hex === sticker.color}
                aria-label={c.name}
                title={c.name}
                className={c.hex === sticker.color ? 'sticker-swatch active' : 'sticker-swatch'}
                style={{ background: c.hex, borderColor: STICKER_INK }}
                onClick={() => update({ color: c.hex })}
              />
            ))}
          </div>
          <Segmented label="Tryb koloru naklejki" value={sticker.mode} options={MODES} onChange={(mode) => update({ mode })} />
          <p className="hint">{HINTS[sticker.mode]}</p>
        </>
      ) : (
        <p className="hint">Kolor naklejki widać tylko przy stylach z grupy Naklejki.</p>
      )}
    </Section>
  )
}
