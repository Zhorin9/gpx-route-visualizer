import Konva from 'konva'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { UI_ONLY } from '../../utils/exportImage'
import { CHROME_ACCENT } from './chrome'
import { snapBox, type Box } from './snap'

// Name of a draggable node others line up with; a child named SNAP_BOX, if any, stands for its bounds.
export const SNAP_TARGET = 'snap-target'
export const SNAP_BOX = 'snap-box'
const GUIDE = 'snap-guide'
// Snap distance in screen pixels, whatever the preview scale.
const SNAP_PX = 6

function boxOf(node: Konva.Node): Box {
  const shape = node instanceof Konva.Container ? (node.findOne(`.${SNAP_BOX}`) ?? node) : node
  return shape.getClientRect({ relativeTo: node.getStage() ?? undefined, skipShadow: true })
}

function clearGuides(stage: Konva.Stage) {
  stage.find(`.${GUIDE}`).forEach((guide) => guide.destroy())
}

// Lines the dragged node up with the frame and the other targets; Alt drags freely.
export function snapDragMove(e: Konva.KonvaEventObject<DragEvent>) {
  const node = e.target
  const stage = node.getStage()
  const layer = node.getLayer()
  if (node !== e.currentTarget || !stage || !layer) return
  clearGuides(stage)
  if (e.evt.altKey) return
  const { aspectKey, slides } = useAppStore.getState()
  const { w, h } = ASPECTS[aspectKey]
  const box = boxOf(node)
  const slide = Math.min(slides.length - 1, Math.max(0, Math.floor((box.x + box.width / 2) / w)))
  const others = stage.find(`.${SNAP_TARGET}`).filter((n) => n !== node && n.isVisible()).map(boxOf)
  const snap = snapBox(box, [{ x: slide * w, y: 0, width: w, height: h }, ...others], SNAP_PX / stage.scaleX())
  node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy })
  for (const points of snap.guides) {
    layer.add(new Konva.Line({ name: `${GUIDE} ${UI_ONLY}`, points, stroke: CHROME_ACCENT, strokeWidth: 1.5, strokeScaleEnabled: false, dash: [6, 4], listening: false }))
  }
}

export function snapDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
  const stage = e.target.getStage()
  if (e.target === e.currentTarget && stage) clearGuides(stage)
}
