import type { DragEvent, ReactNode } from 'react'

const LAYER_DRAG_TYPE = 'application/x-tripcard-layer'
import { IconTrash } from '../icons'

export default function ElementRow({
  icon,
  label,
  meta,
  active,
  onClick,
  onDelete,
  deleteLabel,
  layer,
  onDropLayer,
}: {
  icon: ReactNode
  label: string
  meta: string
  active: boolean
  onClick: () => void
  onDelete?: () => void
  deleteLabel?: string
  layer?: string
  onDropLayer?: (dragged: string) => void
}) {
  const deletable = active && onDelete
  const drag = layer && onDropLayer
    ? {
        draggable: true,
        onDragStart: (e: DragEvent<HTMLDivElement>) => e.dataTransfer.setData(LAYER_DRAG_TYPE, layer),
        onDragOver: (e: DragEvent<HTMLDivElement>) => e.dataTransfer.types.includes(LAYER_DRAG_TYPE) && e.preventDefault(),
        onDrop: (e: DragEvent<HTMLDivElement>) => {
          const dragged = e.dataTransfer.getData(LAYER_DRAG_TYPE)
          if (dragged) onDropLayer(dragged)
        },
      }
    : null
  return (
    <div className="element-row-slot" {...drag}>
      <button
        type="button"
        role="option"
        aria-selected={active}
        className={['item-list-item element-row', active && 'active', deletable && 'has-delete'].filter(Boolean).join(' ')}
        onClick={onClick}
      >
        {icon}
        <span className="element-row-label">{label}</span>
        <span className="element-row-meta">{meta}</span>
      </button>
      {deletable && (
        <button type="button" className="element-row-delete" aria-label={deleteLabel} title={`${deleteLabel} (Del)`} onClick={onDelete}>
          <IconTrash />
        </button>
      )}
    </div>
  )
}
