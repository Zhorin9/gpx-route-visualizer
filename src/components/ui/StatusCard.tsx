import type { ReactNode } from 'react'

// A system state (empty, error, done): an icon, a title, one sentence and the action that moves on.
export default function StatusCard({
  icon,
  title,
  children,
  actions,
  tone = 'empty',
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  actions?: ReactNode
  tone?: 'empty' | 'error'
}) {
  return (
    <div className={`status-card status-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {icon}
      <h3>{title}</h3>
      <p>{children}</p>
      {actions}
    </div>
  )
}
