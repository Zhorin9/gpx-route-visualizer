import { useTranslation } from 'react-i18next'
import ColorField from './ColorField'
import Segmented from '../ui/Segmented'
import { STICKER_COLORS } from '../../utils/sticker'
import type { BadgeShape, TextBadge } from '../../types'
import type { TKey } from '../../i18n'

type Choice = BadgeShape | 'none'

const OPTIONS: { value: Choice; label: TKey }[] = [
  { value: 'none', label: 'badgeField.none' },
  { value: 'burst', label: 'badgeField.burst' },
  { value: 'star', label: 'badgeField.star' },
  { value: 'circle', label: 'badgeField.circle' },
  { value: 'ribbon', label: 'badgeField.ribbon' },
]

export default function BadgeField({ value, onChange }: { value: TextBadge | undefined; onChange: (badge: TextBadge | undefined) => void }) {
  const { t } = useTranslation()
  return (
    <>
      <Segmented
        label={t('badgeField.shape')}
        showLabel
        wrap
        value={value?.shape ?? 'none'}
        options={OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={(shape) => onChange(shape === 'none' ? undefined : { color: STICKER_COLORS[0].hex, ...value, shape })}
      />
      {value && (
        <>
          <ColorField label={t('badgeField.color')} value={value.color} onChange={(color) => onChange({ ...value, color })} />
          <p className="hint">{t('badgeField.hint')}</p>
        </>
      )}
    </>
  )
}
