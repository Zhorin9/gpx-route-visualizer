import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import ColorField from '../../../components/fields/ColorField'
import SliderField from '../../../components/fields/SliderField'
import Section from '../../../components/ui/Section'
import Button from '../../../components/ui/Button'
import { useAppStore } from '../../../store/useAppStore'
import { MOODS, moodOf } from '../model/mood'
import { creditFor, MAP_STYLES, mapStyle, OFM_TERMS, paletteFrom, type MapSwatch } from '../model/styles'
import Segmented from '../../../components/ui/Segmented'
import { selectTrack } from '../../../store/derived'
import { seedOf } from '../../../store/derived'
import { DEFAULT_MAP, type SketchSettings } from '../types'
import type { TKey } from '../../../i18n'

const SKETCH = 'sketch'
const SKETCH_SWATCH: MapSwatch = { land: '#f3ead6', water: '#dce3dd', road: '#3b342b' }

function MapSwatchPicture({ swatch }: { swatch: MapSwatch }) {
  return (
    <svg className="preset-swatch" viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true">
      <rect width="60" height="40" fill={swatch.land} />
      <path d="M0 28C12 22 22 34 34 30S52 22 60 26V40H0Z" fill={swatch.water} />
      <path d="M8 0C14 12 30 9 36 19S47 33 52 40" fill="none" stroke={swatch.road} strokeWidth="3" />
    </svg>
  )
}

function MapStylePicker() {
  const { t } = useTranslation()
  const kind = useAppStore((s) => s.map.kind)
  const styleId = useAppStore((s) => s.map.styleId)
  const updateMap = useAppStore((s) => s.updateMap)
  const chosen = kind === 'sketch' ? SKETCH : styleId
  const tiles: { id: string; label: TKey; swatch: MapSwatch }[] = [...MAP_STYLES, { id: SKETCH, label: 'map.kinds.sketch', swatch: SKETCH_SWATCH }]
  return (
    <div className="field">
      <span className="field-label">{t('map.kind')}</span>
      <div className="preset-grid" role="radiogroup" aria-label={t('map.kind')}>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          role="radio"
          aria-checked={tile.id === chosen}
          className={tile.id === chosen ? 'preset-tile active' : 'preset-tile'}
          onClick={() => updateMap(tile.id === SKETCH ? { kind: 'sketch' } : { kind: 'tiles', styleId: tile.id })}
        >
          <MapSwatchPicture swatch={tile.swatch} />
          <span>{t(tile.label)}</span>
        </button>
      ))}
      </div>
    </div>
  )
}

const WATERS: SketchSettings['water'][] = ['hatch', 'wash', 'none']

export function MapCreditFields() {
  const { t } = useTranslation()
  const map = useAppStore((s) => s.map)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const updateMap = useAppStore((s) => s.updateMap)
  return (
    <>
      <SliderField label={t('map.creditSize')} unit="px" min={8} max={24} value={map.creditSize} defaultValue={DEFAULT_MAP.creditSize} onChange={(creditSize) => updateMap({ creditSize })} />
      <ColorField label={t('map.creditColor')} value={map.creditColor ?? textColor} onChange={(creditColor) => updateMap({ creditColor })} />
    </>
  )
}

export default function MapPanel() {
  const { t } = useTranslation()
  const map = useAppStore((s) => s.map)
  const gradient = useAppStore((s) => s.collage.gradient)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const updateMap = useAppStore((s) => s.updateMap)
  const sketch = map.kind === 'sketch'
  // undefined while fetching, null when the features couldn't be fetched.
  const layers = useAppStore((s) => {
    const points = selectTrack(s)?.points
    return points ? s.sketchLayers[seedOf(points)] : false
  })
  const loadSketchLayers = useAppStore((s) => s.loadSketchLayers)

  return (
    <>
      <Section title={t('map.label')}>
        <MapStylePicker />
        {sketch && (
          <>
            <CheckboxField label={t('map.sketch.paper')} checked={map.sketch.paper} onChange={(paper) => updateMap({ sketch: { ...map.sketch, paper } })} />
            {!map.sketch.paper && <p className="hint">{t('map.sketch.noPaperHint')}</p>}
            <CheckboxField label={t('map.sketch.lines')} checked={map.sketch.lines} onChange={(lines) => updateMap({ sketch: { ...map.sketch, lines } })} />
            {!map.sketch.lines && <p className="hint">{t('map.sketch.noLinesHint')}</p>}
            <CheckboxField label={t('map.sketch.names')} checked={map.labels} onChange={(labels) => updateMap({ labels })} />
            {!map.labels && <p className="hint">{t('map.sketch.noNamesHint')}</p>}
            <Segmented label={t('map.sketch.water')} showLabel value={map.sketch.water} options={WATERS.map((value) => ({ value, label: t(`map.sketch.waters.${value}`) }))} onChange={(water) => updateMap({ sketch: { ...map.sketch, water } })} />
            <CheckboxField label={t('map.sketch.shores')} checked={map.sketch.shores} onChange={(shores) => updateMap({ sketch: { ...map.sketch, shores } })} />
            {map.sketch.water === 'none' && !map.sketch.shores && <p className="hint">{t('map.sketch.noWaterHint')}</p>}
            <SliderField
              label={t('map.sketch.roughness')}
              unit="%"
              min={50}
              max={200}
              value={Math.round(map.sketch.roughness * 100)}
              defaultValue={100}
              onChange={(v) => updateMap({ sketch: { ...map.sketch, roughness: v / 100 } })}
            />
          </>
        )}
        <CheckboxField label={t('map.paletteFromStyle')} checked={map.palette != null} onChange={(on) => updateMap({ palette: on ? paletteFrom(gradient, textColor) : null })} />
        {map.palette && (
          <Button size="sm" onClick={() => updateMap({ palette: paletteFrom(gradient, textColor) })}>
            {t('map.refreshPalette')}
          </Button>
        )}
        {sketch ? (
          <>
            {layers === undefined && <p className="hint">{t('map.sketch.loading')}</p>}
            {layers === null && (
              <>
                <p className="hint">{t('map.sketch.failed')}</p>
                <Button size="sm" onClick={() => loadSketchLayers(true)}>
                  {t('map.sketch.retry')}
                </Button>
              </>
            )}
            <p className="hint">{t('map.sketch.fetchedOnce')}</p>
          </>
        ) : (
          <>
            <CheckboxField label={t('map.labels')} checked={map.labels} onChange={(labels) => updateMap({ labels })} />
            <CheckboxField label={t('map.hillshade')} checked={map.hillshade} onChange={(hillshade) => updateMap({ hillshade })} />
          </>
        )}
        <p className="hint">{t('map.hint')}</p>
      </Section>
      <MoodSection />
      {!sketch && <MapLookSection />}
      <Section title={t('map.credit')}>
        <p className="hint">
          {t('map.creditHint', { credit: creditFor(map) })} {t(sketch ? OFM_TERMS : mapStyle(map.styleId).terms)}
        </p>
        <MapCreditFields />
      </Section>
    </>
  )
}

function MoodSection() {
  const { t } = useTranslation()
  const map = useAppStore((s) => s.map)
  const updateMap = useAppStore((s) => s.updateMap)
  const current = moodOf(map)
  return (
    <Section title={t('map.mood')}>
      <Segmented
        label={t('map.mood')}
        value={current ?? ''}
        options={MOODS.map(({ id, label }) => ({ value: id, label: t(label) }))}
        onChange={(id) => {
          const mood = MOODS.find((m) => m.id === id)?.mood
          if (mood) updateMap(mood)
        }}
      />
      <SliderField label={t('map.opacity')} unit="%" min={10} max={100} step={5} value={Math.round(map.opacity * 100)} defaultValue={100} onChange={(v) => updateMap({ opacity: v / 100 })} />
      <ColorField label={t('map.ground')} value={map.ground} onChange={(ground) => updateMap({ ground })} />
      <SliderField label={t('map.vignette')} unit="%" min={0} max={100} value={Math.round(map.vignette * 100)} defaultValue={0} onChange={(v) => updateMap({ vignette: v / 100 })} />
      <SliderField label={t('map.sepia')} unit="%" min={0} max={100} value={Math.round(map.sepia * 100)} defaultValue={0} onChange={(v) => updateMap({ sepia: v / 100 })} />
      <SliderField label={t('map.grain')} unit="%" min={0} max={40} value={Math.round(map.grain * 100)} defaultValue={0} onChange={(v) => updateMap({ grain: v / 100 })} />
      <p className="hint">{t('map.moodHint')}</p>
    </Section>
  )
}

function MapLookSection() {
  const { t } = useTranslation()
  const map = useAppStore((s) => s.map)
  const updateMap = useAppStore((s) => s.updateMap)
  return (
      <Section title={t('map.look')}>
        <SliderField label={t('map.dim')} unit="%" min={-80} max={80} value={Math.round(map.dim * 100)} defaultValue={0} onChange={(v) => updateMap({ dim: v / 100 })} />
        <SliderField label={t('map.saturation')} unit="%" min={0} max={200} value={Math.round(map.saturation * 100)} defaultValue={100} onChange={(v) => updateMap({ saturation: v / 100 })} />
        <SliderField label={t('map.blur')} unit="px" min={0} max={12} value={map.blur} defaultValue={DEFAULT_MAP.blur} onChange={(blur) => updateMap({ blur })} />
      </Section>
  )
}
