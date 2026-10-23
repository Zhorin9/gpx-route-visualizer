import { useRef, useState } from 'react'
import ColorField from '../../../components/fields/ColorField'
import Button from '../../../components/ui/Button'
import { mixStops, stopsCss, type GradientStop } from '../../../core/data/palettes'

export interface GradientStopsEditorProps {
  stops: GradientStop[]
  onChange: (stops: GradientStop[]) => void
  // Under the bar: what the start, middle and end mean.
  scale: [string, string, string]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// A gradient bar with a handle per colour: drag a handle to move its colour, click the bar to add one.
export default function GradientStopsEditor({ stops, onChange, scale }: GradientStopsEditorProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected != null && selected < stops.length ? selected : null

  const placeAt = (clientX: number) => {
    const rect = barRef.current!.getBoundingClientRect()
    return clamp((clientX - rect.left) / rect.width, 0, 1)
  }

  // A handle never passes its neighbours, so the order of the stops stays put.
  function move(i: number, at: number) {
    const lo = i > 0 ? stops[i - 1].at : 0
    const hi = i < stops.length - 1 ? stops[i + 1].at : 1
    onChange(stops.map((s, k) => (k === i ? { ...s, at: clamp(at, lo, hi) } : s)))
  }

  function add(at: number) {
    const i = stops.findIndex((s) => s.at > at)
    const index = i < 0 ? stops.length : i
    onChange([...stops.slice(0, index), { at, color: mixStops(stops, at) }, ...stops.slice(index)])
    setSelected(index)
  }

  function remove(i: number) {
    onChange(stops.filter((_, k) => k !== i))
    setSelected(null)
  }

  return (
    <div className="field">
      <div ref={barRef} className="stops-bar" style={{ background: stopsCss(stops) }} onClick={(e) => e.target === e.currentTarget && add(placeAt(e.clientX))}>
        {stops.map((s, i) => (
          <button
            key={i}
            type="button"
            className={i === current ? 'stop-handle active' : 'stop-handle'}
            style={{ left: `${s.at * 100}%`, background: s.color }}
            aria-label={`Kolor ${i + 1} z ${stops.length}, ${Math.round(s.at * 100)}%`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setSelected(i)
            }}
            onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && move(i, placeAt(e.clientX))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault()
                move(i, s.at + (e.key === 'ArrowLeft' ? -0.01 : 0.01))
              } else if ((e.key === 'Delete' || e.key === 'Backspace') && stops.length > 2) remove(i)
            }}
          />
        ))}
      </div>
      <div className="stops-scale">
        {scale.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <p className="hint">Przeciągnij uchwyt, aby przesunąć kolor. Kliknij pasek, aby dodać kolor.</p>
      {current != null && (
        <div className="stops-selected">
          <ColorField label="Kolor uchwytu" value={stops[current].color} onChange={(color) => onChange(stops.map((s, k) => (k === current ? { ...s, color } : s)))} />
          {stops.length > 2 && (
            <Button variant="ghost" onClick={() => remove(current)}>
              Usuń kolor
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
