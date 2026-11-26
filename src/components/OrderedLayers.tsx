import { useEffect } from 'react'
import { canvasElement } from '../core/canvas/registry'
import { ROUTE_LAYER, publishLayerKeys } from '../core/canvas/layers'
import useLayerOrder from '../hooks/useLayerOrder'
import { useAppStore } from '../store/useAppStore'
import EditableText from './EditableText'
import { FramedPhoto } from './PhotoLayer'
import LooseIcon from './place/LooseIcon'
import RouteGroup from './RouteGroup'
import SlideBox from './SlideBox'

function TextLayer({ id }: { id: number }) {
  const node = useAppStore((s) => s.texts.find((t) => t.id === id))
  if (!node) return null
  return node.icon ? <LooseIcon node={node} /> : <EditableText node={node} />
}

function LayerNode({ layer }: { layer: string }) {
  if (layer === ROUTE_LAYER) {
    return (
      <SlideBox slide={0}>
        <RouteGroup />
      </SlideBox>
    )
  }
  const [kind, ...rest] = layer.split(':')
  if (kind === 'slot') return <FramedPhoto slide={Number(rest[0])} index={Number(rest[1])} />
  if (kind === 'text') return <TextLayer id={Number(rest[0])} />
  const element = rest.join(':')
  const def = canvasElement(element)
  return def ? <def.Node instance={element} /> : null
}

export default function OrderedLayers() {
  const keys = useLayerOrder()
  useEffect(() => publishLayerKeys(keys), [keys])
  return keys.map((key) => <LayerNode key={key} layer={key} />)
}
