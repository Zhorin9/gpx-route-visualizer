import type { ReactNode } from 'react'

export default function ElementRow({
  icon,
  label,
  meta,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  meta: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? 'item-list-item element-row active' : 'item-list-item element-row'}
      onClick={onClick}
    >
      {icon}
      <span className="element-row-label">{label}</span>
      <span className="element-row-meta">{meta}</span>
    </button>
  )
}
