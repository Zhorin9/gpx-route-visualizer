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
import { useTranslation } from 'react-i18next'
import type { BackgroundKind, BackgroundPattern } from '../../types'
import type { TKey } from '../../i18n'
import './BackgroundTab.css'

const BACKGROUND_OPTIONS: { value: BackgroundKind; label: TKey }[] = [
  { value: 'transparent', label: 'backgroundTab.transparent' },
  { value: 'color', label: 'backgroundTab.color' },
  { value: 'gradient', label: 'backgroundTab.gradient' },
]

const PATTERN_OPTIONS: { value: BackgroundPattern; label: TKey }[] = [
  { value: 'none', label: 'backgroundTab.patternNone' },
  { value: 'grid', label: 'backgroundTab.patternGrid' },
  { value: 'contours', label: 'backgroundTab.patternContours' },
]

const BACKDROP_OPTIONS: { value: 'checkerboard' | 'color'; label: TKey }[] = [
  { value: 'checkerboard', label: 'backgroundTab.checkerboard' },
  { value: 'color', label: 'backgroundTab.color' },
]

export default function BackgroundTab() {
  const { t } = useTranslation()
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
  const kindOptions = (collageMode ? BACKGROUND_OPTIONS : [...BACKGROUND_OPTIONS, ...backgroundKinds().map((k) => ({ value: k.kind, label: k.label }))]).map((o) => ({ ...o, label: t(o.label) }))
  const added = backgroundKind(bgKind)

  // A photo covers the whole frame: a colour or gradient underneath could never be seen.
  if (photoBackground) {
    return (
      <Section title={t('backgroundTab.background')}>
        <p className="hint">{t('backgroundTab.photoBackgroundHint')}</p>
        <Button block onClick={() => setActiveTab('media')}>
          {t('backgroundTab.goToPhotos')}
        </Button>
      </Section>
    )
  }

  return (
    <>
      {!collageMode && <p className="hint">{t('backgroundTab.layerHint')}</p>}

      <Section title={t('backgroundTab.kind')}>
        <Segmented label={t('backgroundTab.kind')} value={bgKind} options={kindOptions} onChange={(kind) => (backgroundKind(kind)?.select ?? (() => updateBackground({ bgKind: kind })))()} />
        {bgKind === 'color' && (
          <>
            <ColorField label={t('backgroundTab.bgColor')} value={collage.bgColor} onChange={(bgColor) => updateBackground({ bgColor })} />
            <CheckboxField label={t('backgroundTab.autoContrast')} checked={collage.autoContrast} onChange={(autoContrast) => updateBackground({ autoContrast })} />
            <p className="hint">{hasPhotos ? t('backgroundTab.colorHintPhotos') : t('backgroundTab.colorHint')}</p>
          </>
        )}
        {bgKind === 'transparent' && (
          <p className="hint">
            {hasPhotos
              ? t('backgroundTab.transparentHintPhotos')
              : t('backgroundTab.transparentHint')}
          </p>
        )}
      </Section>

      {added && <added.Panel />}

      {bgKind === 'gradient' && (
        <>
          <Section title={t('backgroundTab.gradientPresets')}>
            <div className="gradient-grid" role="group" aria-label={t('backgroundTab.gradientPresets')}>
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
                    <span>{t(preset.name)}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title={t('backgroundTab.refine')}>
            <ColorField label={t('backgroundTab.fromColor')} value={gradient.from} onChange={(from) => updateBackground({ gradient: { from } })} />
            <ColorField label={t('backgroundTab.toColor')} value={gradient.to} onChange={(to) => updateBackground({ gradient: { to } })} />
            <SliderField label={t('backgroundTab.angle')} unit="°" min={0} max={360} value={gradient.angle} defaultValue={DEFAULT_COLLAGE.gradient.angle} onChange={(angle) => updateBackground({ gradient: { angle } })} />
            <SliderField label={t('backgroundTab.grain')} unit="%" min={0} max={30} value={gradient.grain} defaultValue={DEFAULT_COLLAGE.gradient.grain} onChange={(grain) => updateBackground({ gradient: { grain } })} />
            <CheckboxField label={t('backgroundTab.smooth')} checked={gradient.smooth} onChange={(smooth) => updateBackground({ gradient: { smooth } })} />
            <Segmented label={t('backgroundTab.pattern')} showLabel value={gradient.pattern ?? 'none'} options={PATTERN_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(pattern) => updateBackground({ gradient: { pattern } })} />
            <CheckboxField label={t('backgroundTab.autoContrast')} checked={collage.autoContrast} onChange={(autoContrast) => updateBackground({ autoContrast })} />
            <p className="hint">{t('backgroundTab.gradientHint')}</p>
          </Section>
        </>
      )}

      {bgKind === 'transparent' && !hasPhotos && (
        <Section title={t('backgroundTab.preview')}>
          <Segmented
            label={t('backgroundTab.previewBackdrop')}
            showLabel
            value={backdropIsColor ? 'color' : 'checkerboard'}
            options={BACKDROP_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            onChange={(v) => setPreviewBackdrop(v === 'color' ? (backdropIsColor ? previewBackdrop : '#cfcccc') : 'checkerboard')}
          />
          {backdropIsColor && <ColorField label={t('backgroundTab.previewColor')} value={previewBackdrop} onChange={setPreviewBackdrop} />}
        </Section>
      )}
    </>
  )
}
