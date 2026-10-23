import SliderField from '../fields/SliderField'
import CheckboxField from '../fields/CheckboxField'
import ColorField from '../fields/ColorField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { DEFAULT_ROUTE_STYLE, STYLE_PRESETS } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import type { RouteShape, RouteStyle, SelectOption, StylePreset } from '../../types'

const SHAPE_OPTIONS: SelectOption<RouteShape>[] = [
  { value: 'natural', label: 'Naturalny' },
  { value: 'schematic', label: 'Schematyczny' },
]

const PRESET_LABELS: Record<StylePreset, string> = { flat: 'Płaska linia', neon: 'Neon' }

function matchesPreset(style: RouteStyle, preset: StylePreset): boolean {
  return Object.entries(STYLE_PRESETS[preset]).every(([key, value]) => style[key as keyof RouteStyle] === value)
}

export default function StyleTab() {
  const style = useAppStore((s) => s.routeStyle)
  const update = useAppStore((s) => s.updateRouteStyle)
  const applyStylePreset = useAppStore((s) => s.applyStylePreset)
  const isSchematic = style.shape === 'schematic'

  return (
    <>
      <Section title="Preset">
        <div className="button-row">
          {(Object.keys(PRESET_LABELS) as StylePreset[]).map((preset) => (
            <Button key={preset} pressed={matchesPreset(style, preset)} onClick={() => applyStylePreset(preset)}>
              {PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Kształt">
        <Segmented label="Kształt trasy" value={style.shape} options={SHAPE_OPTIONS} onChange={(shape) => update({ shape })} />
        {isSchematic && (
          <>
            <p className="hint">Trasa uproszczona do kątów prostych, jak schemat obwodu.</p>
            <SliderField
              label="Uproszczenie"
              unit="%"
              value={style.schematicSimplify}
              defaultValue={DEFAULT_ROUTE_STYLE.schematicSimplify}
              onChange={(v) => update({ schematicSimplify: v })}
            />
          </>
        )}
      </Section>

      <Section title="Linia">
        <SliderField
          label="Grubość"
          unit="px"
          min={1}
          max={20}
          step={0.5}
          value={style.coreWidth}
          defaultValue={DEFAULT_ROUTE_STYLE.coreWidth}
          onChange={(coreWidth) => update({ coreWidth })}
        />
        <CheckboxField label="Linia przerywana" checked={style.dashed} onChange={(dashed) => update({ dashed, dotted: false })} />
        <CheckboxField label="Linia kropkowana" checked={style.dotted} onChange={(dotted) => update({ dotted, dashed: false })} />
      </Section>

      <Section title="Poświata i obrys">
        <CheckboxField label="Efekt neonu lub obrys" checked={style.glowEnabled} onChange={(glowEnabled) => update({ glowEnabled })} />
        {style.glowEnabled && (
          <>
            <SliderField
              label="Szerokość"
              unit="px"
              min={4}
              max={40}
              value={style.glowWidth}
              defaultValue={DEFAULT_ROUTE_STYLE.glowWidth}
              onChange={(glowWidth) => update({ glowWidth })}
            />
            <SliderField
              label="Rozmycie"
              unit="px"
              min={0}
              max={60}
              value={style.glowBlur}
              defaultValue={DEFAULT_ROUTE_STYLE.glowBlur}
              onChange={(glowBlur) => update({ glowBlur })}
            />
            <SliderField
              label="Krycie"
              unit="%"
              min={5}
              value={Math.round(style.glowOpacity * 100)}
              defaultValue={Math.round(DEFAULT_ROUTE_STYLE.glowOpacity * 100)}
              onChange={(v) => update({ glowOpacity: v / 100 })}
            />
            <CheckboxField label="Kolor jak linia" checked={style.glowColor == null} onChange={(same) => update({ glowColor: same ? null : style.color })} />
            {style.glowColor != null && <ColorField label="Kolor obrysu" value={style.glowColor} onChange={(glowColor) => update({ glowColor })} />}
          </>
        )}
      </Section>

      {!isSchematic && (
        <Section title="Pozostała trasa">
          <CheckboxField
            label="Pokazuj odcinek przed Tobą"
            checked={style.remainingVisible}
            onChange={(remainingVisible) => update({ remainingVisible })}
          />
          {style.remainingVisible && (
            <>
              <ColorField label="Kolor" value={style.remainingColor} onChange={(remainingColor) => update({ remainingColor })} />
              <SliderField
                label="Grubość"
                unit="px"
                min={1}
                max={12}
                step={0.5}
                value={style.remainingWidth}
                defaultValue={DEFAULT_ROUTE_STYLE.remainingWidth}
                onChange={(remainingWidth) => update({ remainingWidth })}
              />
              <SliderField
                label="Krycie"
                unit="%"
                min={5}
                value={Math.round(style.remainingOpacity * 100)}
                defaultValue={Math.round(DEFAULT_ROUTE_STYLE.remainingOpacity * 100)}
                onChange={(v) => update({ remainingOpacity: v / 100 })}
              />
              <CheckboxField label="Linia przerywana" checked={style.remainingDashed} onChange={(remainingDashed) => update({ remainingDashed })} />
            </>
          )}
        </Section>
      )}
    </>
  )
}
