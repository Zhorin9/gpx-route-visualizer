import { useTranslation } from 'react-i18next'
import ColorField from '../../components/fields/ColorField'
import SliderField from '../../components/fields/SliderField'
import CheckboxField from '../../components/fields/CheckboxField'
import Segmented from '../../components/ui/Segmented'
import { useRangeStats, useStickerColor } from '../../store/selectors'
import { selectRouteDays, selectTrack } from '../../store/derived'
import { archiveBaseName } from '../../utils/exportImage'
import type { ElementVariant } from '../../utils/exportElement'
import { DEFAULT_MAP_STICKER, resolvedShape, stickerIdOf, stickerKind, withLook, type MapSticker, type MapStickerEdge, type MapStickerLook, type MapStickerScope, type MapStickerSettings, type MapStickerShadow } from './model'
import RotationField from '../../components/fields/RotationField'
import { IconCopy, IconTrash } from '../../components/icons'
import Button from '../../components/ui/Button'
import ElementPngSection from '../../components/panel/ElementPngSection'
import { useAppStore } from '../../store/useAppStore'

export default function MapStickerFields() {
  const sticker = useAppStore((s) => {
    const id = s.selection?.kind === 'element' ? stickerIdOf(s.selection.element) : null
    return s.mapStickers.find((m) => m.id === id)
  })
  return sticker ? <StickerFields sticker={sticker} /> : null
}

function StickerFields({ sticker }: { sticker: MapSticker }) {
  const updateSticker = useAppStore((s) => s.updateMapSticker)
  const duplicate = useAppStore((s) => s.duplicateMapSticker)
  const remove = useAppStore((s) => s.removeMapSticker)
  const update = (patch: Partial<MapStickerSettings>) => updateSticker(sticker.id, patch)
  const kind = stickerKind(sticker.id)
  const { t } = useTranslation()
  const styleStickerColor = useStickerColor(0)
  const dayCount = useAppStore((s) => selectRouteDays(s).length)
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const scope = sticker.scope ?? DEFAULT_MAP_STICKER.scope
  const shape = resolvedShape(sticker.shape ?? DEFAULT_MAP_STICKER.shape, useRangeStats()?.distanceKm ?? 0)
  const scopeValue = scope.kind === 'day' && scope.day < dayCount ? String(scope.day) : 'all'
  const fileBase = `naklejka-mapa-${archiveBaseName(trackName)}`
  const withScope = (other: MapStickerScope) => ({
    mapStickers: useAppStore.getState().mapStickers.map((m) => (m.id === sticker.id ? { ...m, scope: other } : m)),
  })
  const dayVariants = (): ElementVariant[] => [
    ...Array.from({ length: dayCount }, (_, day) => ({
      name: `${fileBase}-dzien-${day + 1}.png`,
      change: withScope({ kind: 'day', day, only: scope.kind === 'day' && scope.only }),
    })),
    { name: `${fileBase}.png`, change: withScope({ kind: 'all' }) },
  ]
  const size = sticker.size ?? DEFAULT_MAP_STICKER.size
  const margin = sticker.margin ?? DEFAULT_MAP_STICKER.margin
  const looks: MapStickerLook[] = ['journal', 'notes', 'sticker', 'sketch']
  const edges: MapStickerEdge[] = ['none', 'white', 'ink']
  const shadows: MapStickerShadow[] = ['none', 'soft', 'hard']
  return (
    <>
      <Segmented
        label={t('mapSticker.shape')}
        showLabel
        value={shape}
        options={[
          { value: 'country', label: t('mapSticker.shapes.country') },
          { value: 'hull', label: t('mapSticker.shapes.hull') },
          { value: 'region', label: t('mapSticker.shapes.regionLater'), disabled: true },
        ]}
        onChange={(v) => v !== 'region' && update({ shape: v })}
      />
      <Segmented
        label={t('mapSticker.look')}
        showLabel
        value={sticker.look ?? DEFAULT_MAP_STICKER.look}
        options={looks.map((value) => ({ value, label: t(`mapSticker.looks.${value}`) }))}
        onChange={(look) => update(withLook(look, styleStickerColor))}
      />
      {dayCount > 1 && (
        <Segmented
          label={t('mapSticker.scope')}
          showLabel
          wrap={dayCount > 3}
          value={scopeValue}
          options={[{ value: 'all', label: t('mapSticker.wholeRoute') }, ...Array.from({ length: dayCount }, (_, day) => ({ value: String(day), label: t('mapSticker.day', { n: day + 1 }) }))]}
          onChange={(v) => update({ scope: v === 'all' ? { kind: 'all' } : { kind: 'day', day: Number(v), only: scope.kind === 'day' && scope.only } })}
        />
      )}
      {scope.kind === 'day' && scopeValue !== 'all' && (
        <CheckboxField label={t('mapSticker.onlyThisDay')} checked={scope.only} onChange={(only) => update({ scope: { ...scope, only } })} />
      )}
      <CheckboxField label={t('mapSticker.labels')} checked={sticker.labels ?? false} onChange={(labels) => update({ labels })} />
      <Segmented
        label={t('mapSticker.edge')}
        showLabel
        value={sticker.edge ?? DEFAULT_MAP_STICKER.edge}
        options={edges.map((value) => ({ value, label: t(`mapSticker.edges.${value}`) }))}
        onChange={(edge) => update({ edge })}
      />
      <Segmented
        label={t('mapSticker.shadow')}
        showLabel
        value={sticker.shadow ?? DEFAULT_MAP_STICKER.shadow}
        options={shadows.map((value) => ({ value, label: t(`mapSticker.shadows.${value}`) }))}
        onChange={(shadow) => update({ shadow })}
      />
      <SliderField
        label={t('mapSticker.size')}
        unit="%"
        min={20}
        max={95}
        value={Math.round(size * 100)}
        defaultValue={Math.round(DEFAULT_MAP_STICKER.size * 100)}
        onChange={(v) => update({ size: v / 100 })}
      />
      <SliderField
        label={t('mapSticker.zoom')}
        unit="%"
        min={100}
        max={400}
        value={Math.round((sticker.zoom ?? 1) * 100)}
        defaultValue={100}
        onChange={(v) => update(v === 100 ? { zoom: 1, pan: { x: 0, y: 0 } } : { zoom: v / 100 })}
      />
      {(sticker.zoom ?? 1) > 1 && <p className="hint">{t('mapSticker.panHint')}</p>}
      <RotationField value={sticker.rotation ?? 0} onChange={(rotation) => update({ rotation })} />
      {shape === 'hull' && (
        <SliderField
          label={t('mapSticker.margin')}
          unit="%"
          min={2}
          max={40}
          value={Math.round(margin * 100)}
          defaultValue={Math.round(DEFAULT_MAP_STICKER.margin * 100)}
          onChange={(v) => update({ margin: v / 100 })}
        />
      )}
      <ColorField label={t('mapSticker.land')} value={sticker.palette.land} onChange={(land) => update({ palette: { ...sticker.palette, land } })} />
      <ColorField label={t('mapSticker.route')} value={sticker.route} onChange={(route) => update({ route })} />
      <ColorField label={t('mapSticker.start')} value={sticker.start} onChange={(start) => update({ start })} />
      {sticker.labels && <ColorField label={t('mapSticker.labelColor')} value={sticker.labelColor} onChange={(labelColor) => update({ labelColor })} />}
      <CheckboxField label={t('mapSticker.routeOutside')} checked={sticker.routeOutside ?? false} onChange={(routeOutside) => update({ routeOutside })} />
      <p className="hint">{t('mapSticker.hint')}</p>
      <div className="button-row">
        <Button icon={<IconCopy />} onClick={() => duplicate(sticker.id)}>
          {t('mapSticker.duplicate')}
        </Button>
        <Button variant="danger" icon={<IconTrash />} onClick={() => remove(sticker.id)}>
          {t('mapSticker.remove')}
        </Button>
      </div>
      <h6 className="subhead">{t('elementExport.heading')}</h6>
      <ElementPngSection
        target={{ kind: 'element', element: kind }}
        more={(png) =>
          dayCount > 1 && (
            <Button block disabled={png.busy} onClick={() => png.downloadVariants(dayVariants(), fileBase)}>
              {t('mapSticker.eachDayZip')}
            </Button>
          )
        }
      />
    </>
  )
}
