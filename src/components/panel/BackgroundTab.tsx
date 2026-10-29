import SliderField from '../fields/SliderField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import Button from '../ui/Button'
import { useHasPhotos, usePhotoBackground } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_COLLAGE } from '../../store/defaults'
import { GRADIENT_PRESETS } from '../../utils/gradients'
import { backgroundKind, backgroundKinds } from '../../core/background/registry'
import type { BackgroundKind, BackgroundPattern, SelectOption } from '../../types'
import './BackgroundTab.css'

const BACKGROUND_OPTIONS: SelectOption<BackgroundKind>[] = [
  { value: 'transparent', label: 'Przezroczyste' },
  { value: 'color', label: 'Kolor' },
  { value: 'gradient', label: 'Gradient' },
]

const PATTERN_OPTIONS: SelectOption<BackgroundPattern>[] = [
  { value: 'none', label: 'Brak' },
  { value: 'grid', label: 'Siatka' },
  { value: 'contours', label: 'Poziomice' },
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
  const photoBackground = usePhotoBackground()
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  // A collage has no map.
  const collageMode = useAppStore((s) => s.mode === 'collage')
  const { gradient, bgKind } = collage
  const backdropIsColor = previewBackdrop !== 'checkerboard'
  // Kinds added by features (the map) follow the built-in ones and bring their own settings.
  const kindOptions = collageMode ? BACKGROUND_OPTIONS : [...BACKGROUND_OPTIONS, ...backgroundKinds().map((k) => ({ value: k.kind, label: k.label }))]
  const added = backgroundKind(bgKind)

  // A photo covers the whole frame: a colour or gradient underneath could never be seen.
  if (photoBackground) {
    return (
      <Section title="Tło">
        <p className="hint">Tłem jest zdjęcie wypełniające cały kadr, więc kolor ani gradient pod nim nie byłyby widoczne. Jasność zdjęcia zmienisz suwakiem „Przyciemnienie”.</p>
        <Button block onClick={() => setActiveTab('media')}>
          Przejdź do zdjęć
        </Button>
      </Section>
    )
  }

  return (
    <>
      {!collageMode && <p className="hint">Tło to osobna warstwa pod zdjęciami: zmiana układu go nie rusza, a zmiana tła nie rusza zdjęć.</p>}

      <Section title="Rodzaj tła">
        <Segmented label="Rodzaj tła" value={bgKind} options={kindOptions} onChange={(kind) => (backgroundKind(kind)?.select ?? (() => updateBackground({ bgKind: kind })))()} />
        {bgKind === 'color' && (
          <>
            <ColorField label="Kolor tła" value={collage.bgColor} onChange={(bgColor) => updateBackground({ bgColor })} />
            <CheckboxField label="Automatyczny kontrast tekstu" checked={collage.autoContrast} onChange={(autoContrast) => updateBackground({ autoContrast })} />
            <p className="hint">Kolor wypełnia cały kadr{hasPhotos ? ', a między zdjęciami widać go w przerwach i marginesach' : ''}. Grafikę zapiszesz jako PNG albo JPG.</p>
          </>
        )}
        {bgKind === 'transparent' && (
          <p className="hint">
            {hasPhotos
              ? 'Przerwy i marginesy kolażu zostają przezroczyste.'
              : 'Eksport to przezroczysty PNG — gotowy do nałożenia na własne zdjęcie w Instagramie.'}
          </p>
        )}
      </Section>

      {added && <added.Panel />}

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
            <Segmented label="Wzór" showLabel value={gradient.pattern ?? 'none'} options={PATTERN_OPTIONS} onChange={(pattern) => updateBackground({ gradient: { pattern } })} />
            <CheckboxField label="Automatyczny kontrast tekstu" checked={collage.autoContrast} onChange={(autoContrast) => updateBackground({ autoContrast })} />
            <p className="hint">Na jasnym gradiencie napisy i trasa same przechodzą na ciemny kolor. „Wygładź” usuwa pasy w przejściu, ziarno nadaje papierowy charakter.</p>
          </Section>
        </>
      )}

      {bgKind === 'transparent' && !hasPhotos && (
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
