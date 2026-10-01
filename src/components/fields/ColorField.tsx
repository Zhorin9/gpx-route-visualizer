import { useEffect, useId, useRef, useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { IconEyedropper } from '../icons'

const supportsEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window

export interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const swatchRef = useRef<HTMLButtonElement>(null)
  const popoverId = useId()

  useEffect(() => {
    if (!open) return
    function handleOutside(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      swatchRef.current?.focus()
    }
    window.addEventListener('pointerdown', handleOutside, true)
    window.addEventListener('keydown', handleKey, true)
    return () => {
      window.removeEventListener('pointerdown', handleOutside, true)
      window.removeEventListener('keydown', handleKey, true)
    }
  }, [open])

  async function pickFromScreen() {
    try {
      if (!window.EyeDropper) return
      const result = await new window.EyeDropper().open()
      onChange(result.sRGBHex)
    } catch {
      // Cancelled by the user — nothing to do.
    }
  }

  return (
    <div className="field color-field" ref={wrapperRef}>
      <span className="field-label">{label}</span>
      <div className="color-row">
        <button
          ref={swatchRef}
          type="button"
          className="color-swatch"
          style={{ background: value }}
          onClick={() => setOpen((v) => !v)}
          aria-label={`${label}: ${value}`}
          aria-expanded={open}
          aria-controls={popoverId}
        />
        <HexColorInput color={value} onChange={onChange} prefixed className="color-hex-input" aria-label={`${label} – kod HEX`} />
        {supportsEyeDropper && (
          <button type="button" className="icon-btn" title="Pobierz kolor z ekranu" aria-label="Pobierz kolor z ekranu" onClick={pickFromScreen}>
            <IconEyedropper />
          </button>
        )}
      </div>

      {open && (
        <div className="color-popover" id={popoverId}>
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
