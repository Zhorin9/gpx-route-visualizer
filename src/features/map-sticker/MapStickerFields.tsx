import { useTranslation } from 'react-i18next'
import ColorField from '../../components/fields/ColorField'
import SliderField from '../../components/fields/SliderField'
import CheckboxField from '../../components/fields/CheckboxField'
import Segmented from '../../components/ui/Segmented'
import { useStickerColor } from '../../store/selectors'
import { DEFAULT_MAP_STICKER, MAP_STICKER_KIND, withLook, type MapStickerEdge, type MapStickerLook, type MapStickerShadow } from './model'
import Button from '../../components/ui/Button'
import ElementPngSection from '../../components/panel/ElementPngSection'
import { useAppStore } from '../../store/useAppStore'

export default function MapStickerFields() {
  const sticker = useAppStore((s) => s.mapSticker)
  const update = useAppStore((s) => s.updateMapSticker)
  const { t } = useTranslation()
  const styleStickerColor = useStickerColor(0)
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
      <CheckboxField label={t('mapSticker.routeOutside')} checked={sticker.routeOutside ?? false} onChange={(routeOutside) => update({ routeOutside })} />
      <p className="hint">{t('mapSticker.hint')}</p>
      <Button onClick={() => update({ shown: false })}>{t('mapSticker.back')}</Button>
      <h6 className="subhead">{t('elementExport.heading')}</h6>
      <ElementPngSection target={{ kind: 'element', element: MAP_STICKER_KIND }} />
    </>
  )
}
