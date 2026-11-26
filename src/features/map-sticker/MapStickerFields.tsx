import { useTranslation } from 'react-i18next'
import ColorField from '../../components/fields/ColorField'
import SliderField from '../../components/fields/SliderField'
import CheckboxField from '../../components/fields/CheckboxField'
import Segmented from '../../components/ui/Segmented'
import { useStickerColor } from '../../store/selectors'
import { selectRouteDays, selectTrack } from '../../store/derived'
import { archiveBaseName } from '../../utils/exportImage'
import type { ElementVariant } from '../../utils/exportElement'
import { DEFAULT_MAP_STICKER, MAP_STICKER_KIND, withLook, type MapStickerEdge, type MapStickerLook, type MapStickerShadow } from './model'
import Button from '../../components/ui/Button'
import ElementPngSection from '../../components/panel/ElementPngSection'
import { useAppStore } from '../../store/useAppStore'

export default function MapStickerFields() {
  const sticker = useAppStore((s) => s.mapSticker)
  const update = useAppStore((s) => s.updateMapSticker)
  const { t } = useTranslation()
  const styleStickerColor = useStickerColor(0)
  const dayCount = useAppStore((s) => selectRouteDays(s).length)
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const scope = sticker.scope ?? DEFAULT_MAP_STICKER.scope
  const scopeValue = scope.kind === 'day' && scope.day < dayCount ? String(scope.day) : 'all'
  const fileBase = `naklejka-mapa-${archiveBaseName(trackName)}`
  const dayVariants = (): ElementVariant[] => [
    ...Array.from({ length: dayCount }, (_, day) => ({
      name: `${fileBase}-dzien-${day + 1}.png`,
      change: { mapSticker: { ...sticker, scope: { kind: 'day' as const, day, only: scope.kind === 'day' && scope.only } } },
    })),
    { name: `${fileBase}.png`, change: { mapSticker: { ...sticker, scope: { kind: 'all' as const } } } },
  ]
  const size = sticker.size ?? DEFAULT_MAP_STICKER.size
  const margin = sticker.margin ?? DEFAULT_MAP_STICKER.margin
  const looks: MapStickerLook[] = ['journal', 'notes', 'sticker', 'sketch']
  const edges: MapStickerEdge[] = ['none', 'white', 'ink']
  const shadows: MapStickerShadow[] = ['none', 'soft', 'hard']
  return (
    <>
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
        label={t('mapSticker.margin')}
        unit="%"
        min={2}
        max={40}
        value={Math.round(margin * 100)}
        defaultValue={Math.round(DEFAULT_MAP_STICKER.margin * 100)}
        onChange={(v) => update({ margin: v / 100 })}
      />
      <ColorField label={t('mapSticker.land')} value={sticker.palette.land} onChange={(land) => update({ palette: { ...sticker.palette, land } })} />
      <ColorField label={t('mapSticker.route')} value={sticker.route} onChange={(route) => update({ route })} />
      <ColorField label={t('mapSticker.start')} value={sticker.start} onChange={(start) => update({ start })} />
      {sticker.labels && <ColorField label={t('mapSticker.labelColor')} value={sticker.labelColor} onChange={(labelColor) => update({ labelColor })} />}
      <CheckboxField label={t('mapSticker.routeOutside')} checked={sticker.routeOutside ?? false} onChange={(routeOutside) => update({ routeOutside })} />
      <p className="hint">{t('mapSticker.hint')}</p>
      <Button onClick={() => update({ shown: false })}>{t('mapSticker.back')}</Button>
      <h6 className="subhead">{t('elementExport.heading')}</h6>
      <ElementPngSection
        target={{ kind: 'element', element: MAP_STICKER_KIND }}
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
