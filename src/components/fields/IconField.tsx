import IconSvg from '../place/IconSvg'
import { ICONS, type IconId } from '../place/icons'

export default function IconField({ value, onChange }: { value: IconId | undefined; onChange: (icon: IconId) => void }) {
  return (
    <div className="field">
      <span className="field-label">Ikona</span>
      <div className="icon-grid" role="radiogroup" aria-label="Ikona">
        {ICONS.map((icon) => (
          <button key={icon.id} type="button" role="radio" aria-checked={icon.id === value} aria-label={icon.label} title={icon.label} className={icon.id === value ? 'icon-option active' : 'icon-option'} onClick={() => onChange(icon.id)}>
            <IconSvg icon={icon.id} size={22} />
          </button>
        ))}
      </div>
    </div>
  )
}
