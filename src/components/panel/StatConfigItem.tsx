import type { ReactNode } from 'react'
import CheckboxField from '../fields/CheckboxField'

export interface StatConfigItemProps {
  label: string
  checked: boolean
  onToggle: (checked: boolean) => void
  children?: ReactNode
}

export default function StatConfigItem({ label, checked, onToggle, children }: StatConfigItemProps) {
  return (
    <div className="stat-config-item">
      <CheckboxField label={label} checked={checked} onChange={onToggle} />
      {checked && children && <div className="stat-config-detail">{children}</div>}
    </div>
  )
}
