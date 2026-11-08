import { useTranslation } from 'react-i18next'
import ColorField from '../../components/fields/ColorField'
import SliderField from '../../components/fields/SliderField'
import { DEFAULT_MAP_STICKER } from './model'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function MapStickerFields() {
  const sticker = useAppStore((s) => s.mapSticker)
  const update = useAppStore((s) => s.updateMapSticker)
  const { t } = useTranslation()
  const size = sticker.size ?? DEFAULT_MAP_STICKER.size
  return (
    <>
      <SliderField
        label={t('mapSticker.size')}
        unit="%"
        min={20}
        max={95}
        value={Math.round(size * 100)}
        defaultValue={Math.round(DEFAULT_MAP_STICKER.size * 100)}
        onChange={(v) => update({ size: v / 100 })}
      />
      <ColorField label={t('mapSticker.land')} value={sticker.palette.land} onChange={(land) => update({ palette: { ...sticker.palette, land } })} />
      <ColorField label={t('mapSticker.route')} value={sticker.route} onChange={(route) => update({ route })} />
      <ColorField label={t('mapSticker.start')} value={sticker.start} onChange={(start) => update({ start })} />
      <p className="hint">{t('mapSticker.hint')}</p>
      <Button onClick={() => update({ shown: false })}>{t('mapSticker.back')}</Button>
    </>
  )
}
