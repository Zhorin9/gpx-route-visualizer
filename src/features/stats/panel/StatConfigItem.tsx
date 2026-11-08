import type { DragEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import { IconChevron } from '../../../components/icons'

export interface StatConfigItemProps {
  label: string
  checked: boolean
  onToggle: (checked: boolean) => void
  // Why the stat can't be shown (e.g. no timestamps in the file).
  unavailable?: string
  onMove?: (step: -1 | 1) => void
  isFirst?: boolean
  isLast?: boolean
  dragProps?: {
    draggable: true
    onDragStart: (e: DragEvent) => void
    onDragOver: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
    onDragEnd: () => void
  }
  dropTarget?: boolean
  children?: ReactNode
}

export default function StatConfigItem({ label, checked, onToggle, unavailable, onMove, isFirst, isLast, dragProps, dropTarget, children }: StatConfigItemProps) {
  const { t } = useTranslation()
  const classes = ['stat-config-item', dragProps && 'is-sortable', dropTarget && 'is-drop-target'].filter(Boolean).join(' ')
  return (
    <div className={classes} {...dragProps}>
      <div className="stat-config-head">
        {dragProps && <span className="stat-grip" aria-hidden="true" title={t('stats.panel.dragToReorder')} />}
        <CheckboxField label={label} checked={checked && !unavailable} onChange={onToggle} disabled={Boolean(unavailable)} />
        {unavailable && <span className="stat-config-note">{unavailable}</span>}
        {onMove && (
          <span className="stat-move">
            <button type="button" className="day-icon-btn" aria-label={t('stats.panel.moveUp', { label })} disabled={isFirst} onClick={() => onMove(-1)}>
              <IconChevron style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button type="button" className="day-icon-btn" aria-label={t('stats.panel.moveDown', { label })} disabled={isLast} onClick={() => onMove(1)}>
              <IconChevron />
            </button>
          </span>
        )}
      </div>
      {checked && !unavailable && children && <div className="stat-config-detail">{children}</div>}
    </div>
  )
}
