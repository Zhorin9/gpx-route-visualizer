import type { ReactNode } from 'react'
import { IconTrash } from '../icons'

export default function ElementRow({
  icon,
  label,
  meta,
  active,
  onClick,
  onDelete,
  deleteLabel,
}: {
  icon: ReactNode
  label: string
  meta: string
  active: boolean
  onClick: () => void
  onDelete?: () => void
  deleteLabel?: string
}) {
  const deletable = active && onDelete
  return (
    <div className="element-row-slot">
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
