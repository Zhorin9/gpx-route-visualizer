import { PALETTES, paletteCss, type Palette } from '../../../core/data/palettes'
import './PalettePicker.css'

interface Props {
  ariaLabel: string
  isActive: (p: Palette) => boolean
  onPick: (p: Palette) => void
  inverted?: boolean
}

export default function PalettePicker({ ariaLabel, isActive, onPick, inverted }: Props) {
  return (
    <div className="field">
      <span className="field-label">Paleta</span>
      <div className="palette-picker" role="radiogroup" aria-label={ariaLabel}>
        {PALETTES.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={isActive(p)} className={isActive(p) ? 'palette-option active' : 'palette-option'} onClick={() => onPick(p)}>
            <span className="palette-swatch" style={{ background: paletteCss(p, inverted) }} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
