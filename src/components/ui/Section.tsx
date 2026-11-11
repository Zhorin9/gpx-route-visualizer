import { useState, type ReactNode } from 'react'
import { IconChevron } from '../icons'

const foldedWhileOpen = new Map<string, boolean>()

export interface SectionProps {
  title?: string
  children: ReactNode
  actions?: ReactNode
  // Makes the heading a button that folds the content away.
  collapseId?: string
  startCollapsed?: boolean
}

export default function Section({ title, children, actions, collapseId, startCollapsed = false }: SectionProps) {
  const [collapsed, setCollapsed] = useState(() => (collapseId ? (foldedWhileOpen.get(collapseId) ?? startCollapsed) : false))

  function toggle() {
    if (!collapseId) return
    foldedWhileOpen.set(collapseId, !collapsed)
    setCollapsed(!collapsed)
  }

  return (
    <section className="section">
      {(title || actions) && (
        <header className="section-header">
          {title && collapseId ? (
            <button type="button" className="section-toggle" aria-expanded={!collapsed} onClick={toggle}>
              <h2>{title}</h2>
              <IconChevron className={collapsed ? 'chevron collapsed' : 'chevron'} />
            </button>
          ) : (
            title && <h2>{title}</h2>
          )}
          {actions}
        </header>
      )}
      {!collapsed && children}
    </section>
  )
}
