import { useTranslation } from 'react-i18next'
import SliderField from '../fields/SliderField'
import CheckboxField from '../fields/CheckboxField'
import ColorField from '../fields/ColorField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { DEFAULT_ROUTE_STYLE, STYLE_PRESETS } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import type { RouteCasing, RouteEcho, RouteShape, RouteStyle, StylePreset } from '../../types'
import type { TKey } from '../../i18n'

// The line's width plus 80%, at the default 5 px line, with the sticker's ink and offset.
const DEFAULT_CASING: RouteCasing = { width: 4, color: '#241a26', dx: 3, dy: 3 }

// The style board's sketchbook: half as wide, half as strong, a little down and right.
const DEFAULT_ECHO: RouteEcho = { width: 0.45, opacity: 0.5, dx: 3, dy: 6 }

const SHAPE_OPTIONS: { value: RouteShape; label: TKey }[] = [
  { value: 'natural', label: 'styleTab.natural' },
  { value: 'schematic', label: 'styleTab.schematic' },
]

const PRESET_LABELS: Record<StylePreset, TKey> = { flat: 'styleTab.presetFlat', neon: 'styleTab.presetNeon' }

function matchesPreset(style: RouteStyle, preset: StylePreset): boolean {
  return Object.entries(STYLE_PRESETS[preset]).every(([key, value]) => style[key as keyof RouteStyle] === value)
}

export default function StyleTab() {
  const { t } = useTranslation()
  const style = useAppStore((s) => s.routeStyle)
  const update = useAppStore((s) => s.updateRouteStyle)
  const applyStylePreset = useAppStore((s) => s.applyStylePreset)
  const mapSticker = useAppStore((s) => s.mapSticker)
  const updateMapSticker = useAppStore((s) => s.updateMapSticker)
  const isSchematic = style.shape === 'schematic'
  const casing = style.casing
  const setCasing = (patch: Partial<RouteCasing>) => update({ casing: { ...DEFAULT_CASING, ...casing, ...patch } })

  return (
    <>
      <Section title={t('styleTab.preset')}>
        <div className="button-row">
          {(Object.keys(PRESET_LABELS) as StylePreset[]).map((preset) => (
            <Button key={preset} pressed={matchesPreset(style, preset)} onClick={() => applyStylePreset(preset)}>
              {t(PRESET_LABELS[preset])}
            </Button>
          ))}
        </div>
      </Section>

      <Section title={t('styleTab.shape')}>
        <Segmented label={t('styleTab.routeShape')} value={style.shape} options={SHAPE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(shape) => update({ shape })} />
        {isSchematic && (
          <>
            <p className="hint">{t('styleTab.schematicHint')}</p>
            <SliderField
              label={t('styleTab.simplify')}
              unit="%"
              value={style.schematicSimplify}
              defaultValue={DEFAULT_ROUTE_STYLE.schematicSimplify}
              onChange={(v) => update({ schematicSimplify: v })}
            />
          </>
        )}
      </Section>

      <Section title={t('styleTab.line')}>
        <SliderField
          label={t('styleTab.width')}
          unit="px"
          min={1}
          max={20}
          step={0.5}
          value={style.coreWidth}
          defaultValue={DEFAULT_ROUTE_STYLE.coreWidth}
          onChange={(coreWidth) => update({ coreWidth })}
        />
        <CheckboxField label={t('styleTab.dashed')} checked={style.dashed} onChange={(dashed) => update({ dashed, dotted: false })} />
        <CheckboxField label={t('styleTab.dotted')} checked={style.dotted} onChange={(dotted) => update({ dotted, dashed: false })} />
      </Section>

      <Section title={t('styleTab.mapSticker')}>
        <CheckboxField label={t('styleTab.mapStickerShown')} checked={mapSticker.shown} onChange={(shown) => updateMapSticker({ shown })} />
        <p className="hint">{t('styleTab.mapStickerHint')}</p>
      </Section>

      <Section title={t('styleTab.handDrawn')}>
        <CheckboxField label={t('styleTab.penShake')} checked={!!style.pen} onChange={(on) => update({ pen: on ? 1 : undefined })} />
        {style.pen ? <SliderField label={t('styleTab.shake')} min={0.5} max={2} step={0.1} value={style.pen} defaultValue={1} onChange={(pen) => update({ pen })} /> : null}
        <CheckboxField label={t('styleTab.echo')} checked={!!style.echo} onChange={(on) => update({ echo: on ? DEFAULT_ECHO : undefined })} />
      </Section>

      <Section title={t('styleTab.casingSection')}>
        <CheckboxField label={t('styleTab.casing')} checked={!!casing} onChange={(on) => update({ casing: on ? DEFAULT_CASING : undefined })} />
        {casing && (
          <>
            <SliderField label={t('styleTab.casingWidth')} unit="px" min={1} max={20} step={0.5} value={casing.width} defaultValue={DEFAULT_CASING.width} onChange={(width) => setCasing({ width })} />
            <ColorField label={t('styleTab.casingColor')} value={casing.color} onChange={(color) => setCasing({ color })} />
            <SliderField label={t('styleTab.shadowX')} unit="px" min={-15} max={15} value={casing.dx} defaultValue={DEFAULT_CASING.dx} onChange={(dx) => setCasing({ dx })} />
            <SliderField label={t('styleTab.shadowY')} unit="px" min={-15} max={15} value={casing.dy} defaultValue={DEFAULT_CASING.dy} onChange={(dy) => setCasing({ dy })} />
          </>
        )}
      </Section>

      <Section title={t('styleTab.glowSection')}>
        <CheckboxField label={t('styleTab.glow')} checked={style.glowEnabled} onChange={(glowEnabled) => update({ glowEnabled })} />
        {style.glowEnabled && (
          <>
            <SliderField
              label={t('styleTab.glowWidth')}
              unit="px"
              min={4}
              max={40}
              value={style.glowWidth}
              defaultValue={DEFAULT_ROUTE_STYLE.glowWidth}
              onChange={(glowWidth) => update({ glowWidth })}
            />
            <SliderField
              label={t('styleTab.blur')}
              unit="px"
              min={0}
              max={60}
              value={style.glowBlur}
              defaultValue={DEFAULT_ROUTE_STYLE.glowBlur}
              onChange={(glowBlur) => update({ glowBlur })}
            />
            <SliderField
              label={t('styleTab.opacity')}
              unit="%"
              min={5}
              value={Math.round(style.glowOpacity * 100)}
              defaultValue={Math.round(DEFAULT_ROUTE_STYLE.glowOpacity * 100)}
              onChange={(v) => update({ glowOpacity: v / 100 })}
            />
            <CheckboxField label={t('styleTab.glowSameColor')} checked={style.glowColor == null} onChange={(same) => update({ glowColor: same ? null : style.color })} />
            {style.glowColor != null && <ColorField label={t('styleTab.glowColor')} value={style.glowColor} onChange={(glowColor) => update({ glowColor })} />}
          </>
        )}
      </Section>

      {!isSchematic && (
        <Section title={t('styleTab.remaining')}>
          <CheckboxField
            label={t('styleTab.remainingVisible')}
            checked={style.remainingVisible}
            onChange={(remainingVisible) => update({ remainingVisible })}
          />
          {style.remainingVisible && (
            <>
              <ColorField label={t('styleTab.color')} value={style.remainingColor} onChange={(remainingColor) => update({ remainingColor })} />
              <SliderField
                label={t('styleTab.width')}
                unit="px"
                min={1}
                max={12}
                step={0.5}
                value={style.remainingWidth}
                defaultValue={DEFAULT_ROUTE_STYLE.remainingWidth}
                onChange={(remainingWidth) => update({ remainingWidth })}
              />
              <SliderField
                label={t('styleTab.opacity')}
                unit="%"
                min={5}
                value={Math.round(style.remainingOpacity * 100)}
                defaultValue={Math.round(DEFAULT_ROUTE_STYLE.remainingOpacity * 100)}
                onChange={(v) => update({ remainingOpacity: v / 100 })}
              />
              <CheckboxField label={t('styleTab.dashed')} checked={style.remainingDashed} onChange={(remainingDashed) => update({ remainingDashed })} />
            </>
          )}
        </Section>
      )}
    </>
  )
}
