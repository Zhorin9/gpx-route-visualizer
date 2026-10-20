import { canvasElements, type CanvasElementDefinition } from './registry'

function ElementSlot({ def }: { def: CanvasElementDefinition }) {
  const available = def.useIsAvailable()
  return available ? <def.Node /> : null
}

// Every registered element, in drawing order.
export default function CanvasElements() {
  return canvasElements().map((def) => <ElementSlot key={def.kind} def={def} />)
}
