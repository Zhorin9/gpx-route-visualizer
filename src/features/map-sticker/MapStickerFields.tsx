import ColorField from '../../components/fields/ColorField'
import SliderField from '../../components/fields/SliderField'
import { DEFAULT_MAP_STICKER } from './model'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function MapStickerFields() {
  const sticker = useAppStore((s) => s.mapSticker)
  const update = useAppStore((s) => s.updateMapSticker)
  const size = sticker.size ?? DEFAULT_MAP_STICKER.size
  return (
    <>
      <SliderField
        label="Wielkość"
        unit="%"
        min={20}
        max={95}
        value={Math.round(size * 100)}
        defaultValue={Math.round(DEFAULT_MAP_STICKER.size * 100)}
        onChange={(v) => update({ size: v / 100 })}
      />
      <ColorField label="Ląd" value={sticker.palette.land} onChange={(land) => update({ palette: { ...sticker.palette, land } })} />
      <ColorField label="Trasa" value={sticker.route} onChange={(route) => update({ route })} />
      <ColorField label="Start" value={sticker.start} onChange={(start) => update({ start })} />
      <p className="hint">Mapa okolicy trasy przycięta do jej kształtu. Dopóki naklejka jest na kadrze, sama trasa się nie rysuje.</p>
      <Button onClick={() => update({ shown: false })}>Wróć do zwykłej trasy</Button>
    </>
  )
}
