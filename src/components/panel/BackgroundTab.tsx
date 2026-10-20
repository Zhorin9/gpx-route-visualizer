import SliderField from '../fields/SliderField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { useHasPhotos } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_COLLAGE } from '../../store/defaults'
import { GRADIENT_PRESETS } from '../../utils/gradients'
import type { BackgroundKind, SelectOption } from '../../types'

const BACKGROUND_OPTIONS: SelectOption<BackgroundKind>[] = [
  { value: 'color', label: 'Kolor' },
  { value: 'gradient', label: 'Gradient' },
]

const BACKDROP_OPTIONS: SelectOption<'checkerboard' | 'color'>[] = [
  { value: 'checkerboard', label: 'Szachownica' },
  { value: 'color', label: 'Kolor' },
]

// The background is its own layer under the photos: a layout change leaves it alone and vice versa.
export default function BackgroundTab() {
  const collage = useAppStore((s) => s.collage)
  const updateBackground = useAppStore((s) => s.updateBackground)
  const hasPhotos = useHasPhotos()
  const previewBackdrop = useAppStore((s) => s.previewBackdrop)
  const setPreviewBackdrop = useAppStore((s) => s.setPreviewBackdrop)
  const { gradient, bgKind } = collage
  const backdropIsColor = previewBackdrop !== 'checkerboard'

  return (
    <>
      <p className="hint">Tło to osobna warstwa pod zdjęciami: zmiana układu go nie rusza, a zmiana tła nie rusza zdjęć.</p>

      <Section title="Rodzaj tła">
        <Segmented label="Rodzaj tła" value={bgKind} options={BACKGROUND_OPTIONS} onChange={(kind) => updateBackground({ bgKind: kind })} />
        {bgKind === 'color' && (
          <>
            <ColorField label="Kolor tła" value={collage.bgColor} onChange={(bgColor) => updateBackground({ bgColor })} />
            <p className="hint">
              {hasPhotos
                ? 'Kolor widać w marginesach i przerwach kolażu.'
                : 'Bez zdjęć eksport to przezroczysty PNG — gotowy do nałożenia na własne zdjęcie w Instagramie. Wybierz gradient, aby wypełnić całe tło.'}
            </p>
          </>
        )}
      </Section>

      {bgKind === 'gradient' && (
        <>
          <Section title="Gotowe gradienty">
            <div className="gradient-grid" role="group" aria-label="Gotowe gradienty">
              {GRADIENT_PRESETS.map((preset) => {
                const active = preset.from === gradient.from && preset.to === gradient.to
                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={active ? 'gradient-preset active' : 'gradient-preset'}
                    aria-pressed={active}
                    onClick={() => updateBackground({ gradient: { from: preset.from, to: preset.to } })}
                  >
                    <span className="gradient-swatch" style={{ background: `linear-gradient(172deg, ${preset.from}, ${preset.to})` }} />
                    <span>{preset.name}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Dopracowanie">
            <ColorField label="Kolor początkowy" value={gradient.from} onChange={(from) => updateBackground({ gradient: { from } })} />
            <ColorField label="Kolor końcowy" value={gradient.to} onChange={(to) => updateBackground({ gradient: { to } })} />
            <SliderField label="Kąt" unit="°" min={0} max={360} value={gradient.angle} defaultValue={DEFAULT_COLLAGE.gradient.angle} onChange={(angle) => updateBackground({ gradient: { angle } })} />
            <SliderField label="Ziarno filmowe" unit="%" min={0} max={30} value={gradient.grain} defaultValue={DEFAULT_COLLAGE.gradient.grain} onChange={(grain) => updateBackground({ gradient: { grain } })} />
            <CheckboxField label="Wygładź przejście" checked={gradient.smooth} onChange={(smooth) => updateBackground({ gradient: { smooth } })} />
            <CheckboxField label="Automatyczny kontrast tekstu" checked={collage.autoContrast} onChange={(autoContrast) => updateBackground({ autoContrast })} />
            <p className="hint">Na jasnym gradiencie napisy i trasa same przechodzą na ciemny kolor. „Wygładź” usuwa pasy w przejściu, ziarno nadaje papierowy charakter.</p>
          </Section>
        </>
      )}

      {bgKind === 'color' && !hasPhotos && (
        <Section title="Podgląd">
          <Segmented
            label="Tło podglądu"
            showLabel
            value={backdropIsColor ? 'color' : 'checkerboard'}
            options={BACKDROP_OPTIONS}
            onChange={(v) => setPreviewBackdrop(v === 'color' ? (backdropIsColor ? previewBackdrop : '#cfcccc') : 'checkerboard')}
          />
          {backdropIsColor && <ColorField label="Kolor podglądu" value={previewBackdrop} onChange={setPreviewBackdrop} />}
        </Section>
      )}
    </>
  )
}
