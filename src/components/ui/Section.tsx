import { useState, type ReactNode } from 'react'
import { IconChevron } from '../icons'

// Remembered per section while the app is open, so switching tabs doesn't reopen it.
const collapsedIds = new Set<string>()
// Sections the person has folded or opened; the others start as `startCollapsed` says.
const touchedIds = new Set<string>()

export interface SectionProps {
  title?: string
  children: ReactNode
  actions?: ReactNode
  // Makes the heading a button that folds the content away.
  collapseId?: string
  // Folded until opened ('Zaawansowane').
  startCollapsed?: boolean
}

export default function Section({ title, children, actions, collapseId, startCollapsed = false }: SectionProps) {
  const [collapsed, setCollapsed] = useState(() => (collapseId ? (touchedIds.has(collapseId) ? collapsedIds.has(collapseId) : startCollapsed) : false))

  function toggle() {
    if (!collapseId) return
    if (!touchedIds.has(collapseId) && startCollapsed) collapsedIds.add(collapseId)
    touchedIds.add(collapseId)
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
