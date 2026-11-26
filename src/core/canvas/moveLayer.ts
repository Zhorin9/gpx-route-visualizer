import { useAppStore } from '../../store/useAppStore'
import { layerKeyOf, layerKeysOnFrame, movedLayer, type LayerMove } from './layers'

export function moveSelectedLayer(move: LayerMove) {
  const s = useAppStore.getState()
  const key = layerKeyOf(s.selection)
  const keys = layerKeysOnFrame()
  if (!key || !keys.includes(key)) return
  const next = movedLayer(keys, key, move)
  if (next !== keys) s.setLayerOrder(next)
}
