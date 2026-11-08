import { useTranslation } from 'react-i18next'
import IconSvg from '../place/IconSvg'
import { ICONS, type IconId } from '../place/icons'

export default function IconField({ value, onChange }: { value: IconId | undefined; onChange: (icon: IconId) => void }) {
  const { t } = useTranslation()
  return (
    <div className="field">
      <span className="field-label">{t('iconField.icon')}</span>
      <div className="icon-grid" role="radiogroup" aria-label={t('iconField.icon')}>
        {ICONS.map((icon) => (
          <button key={icon.id} type="button" role="radio" aria-checked={icon.id === value} aria-label={t(icon.label)} title={t(icon.label)} className={icon.id === value ? 'icon-option active' : 'icon-option'} onClick={() => onChange(icon.id)}>
            <IconSvg icon={icon.id} size={22} />
          </button>
        ))}
      </div>
    </div>
  )
}
