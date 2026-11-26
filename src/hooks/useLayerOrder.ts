import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { canvasElements, type CanvasElementDefinition } from '../core/canvas/registry'
import { ROUTE_LAYER, elementLayer, orderedLayers, slotLayer, textLayer, type LayerKey } from '../core/canvas/layers'
import { useShownSlots } from '../components/PhotoLayer'
import { useHasRoute } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

function useElementLayers(def: CanvasElementDefinition): LayerKey[] {
  const available = def.useIsAvailable()
  const instances = def.useInstances?.()
  if (instances) return instances.map(elementLayer)
  return available ? [elementLayer(def.kind)] : []
}

export default function useLayerOrder(): LayerKey[] {
  const shown = useShownSlots()
  const hasRoute = useHasRoute()
  const routeHidden = useAppStore((s) => s.mapStickers.some((m) => !m.routeOutside))
  const textIds = useAppStore(useShallow((s) => s.texts.map((t) => t.id)))
  const stored = useAppStore((s) => s.layerOrder)
  const elements = canvasElements().flatMap((def) => useElementLayers(def))
  const framed = (shown ?? []).flatMap((slots, slide) => slots.filter((s) => s.kind === 'framed').map((s) => slotLayer(slide, s.index)))
  const signature = [...framed, ...(hasRoute && !routeHidden ? [ROUTE_LAYER] : []), ...elements, ...textIds.map(textLayer)].join('|')
  return useMemo(() => orderedLayers(signature ? signature.split('|') : [], stored), [signature, stored])
}
