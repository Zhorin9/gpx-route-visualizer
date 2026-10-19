import { useState, type ReactNode } from 'react'
import { IconChevron } from '../icons'

// Remembered per section while the app is open, so switching tabs doesn't reopen it.
const collapsedIds = new Set<string>()

export interface SectionProps {
  title?: string
  children: ReactNode
  actions?: ReactNode
  // Makes the heading a button that folds the content away.
  collapseId?: string
}

export default function Section({ title, children, actions, collapseId }: SectionProps) {
  const [collapsed, setCollapsed] = useState(() => (collapseId ? collapsedIds.has(collapseId) : false))

  function toggle() {
    if (!collapseId) return
    if (collapsedIds.has(collapseId)) collapsedIds.delete(collapseId)
    else collapsedIds.add(collapseId)
    setCollapsed(collapsedIds.has(collapseId))
  }

  return (
    <section className="section">
      {(title || actions) && (
        <header className="section-header">
          {title && collapseId ? (
            <button type="button" className="section-toggle" aria-expanded={!collapsed} onClick={toggle}>
              <h3>{title}</h3>
              <IconChevron className={collapsed ? 'chevron collapsed' : 'chevron'} />
            </button>
          ) : (
            title && <h3>{title}</h3>
          )}
          {actions}
        </header>
      )}
      {!collapsed && children}
    </section>
  )
}
