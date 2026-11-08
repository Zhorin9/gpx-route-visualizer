import { useTranslation } from 'react-i18next'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { useAppStore } from '../../store/useAppStore'
import { STICKER_COLORS, STICKER_INK, type StickerSettings } from '../../utils/sticker'
import type { TKey } from '../../i18n'

const MODES: { value: StickerSettings['mode']; label: TKey }[] = [
  { value: 'manual', label: 'stickerColorSection.manual' },
  { value: 'photo', label: 'stickerColorSection.photo' },
  { value: 'series', label: 'stickerColorSection.series' },
]

const HINTS: Record<StickerSettings['mode'], TKey> = {
  manual: 'stickerColorSection.manualHint',
  photo: 'stickerColorSection.photoHint',
  series: 'stickerColorSection.seriesHint',
}

export default function StickerColorSection() {
  const { t } = useTranslation()
  const sticker = useAppStore((s) => s.sticker)
  const update = useAppStore((s) => s.updateSticker)
  return (
    <Section title={t('stickerColorSection.title')}>
      {sticker ? (
        <>
          <div className="sticker-swatches" role="radiogroup" aria-label={t('stickerColorSection.title')}>
            {STICKER_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={c.hex === sticker.color}
                aria-label={t(c.name)}
                title={t(c.name)}
                className={c.hex === sticker.color ? 'sticker-swatch active' : 'sticker-swatch'}
                style={{ background: c.hex, borderColor: STICKER_INK }}
                onClick={() => update({ color: c.hex })}
              />
            ))}
          </div>
          <Segmented label={t('stickerColorSection.mode')} value={sticker.mode} options={MODES.map((o) => ({ ...o, label: t(o.label) }))} onChange={(mode) => update({ mode })} />
          <p className="hint">{t(HINTS[sticker.mode])}</p>
        </>
      ) : (
        <p className="hint">{t('stickerColorSection.onlyStickers')}</p>
      )}
    </Section>
  )
}
