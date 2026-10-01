import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { tabId, tabPanelId } from './tabIds'

export interface TabDef<K extends string> {
  key: K
  label: string
  // Fits under the icon; `label` is used for the tooltip and panel heading.
  shortLabel?: string
  icon: ReactNode
}

export interface TabsProps<K extends string> {
  tabs: TabDef<K>[]
  active: K
  onChange: (key: K) => void
}

export default function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  const listRef = useRef<HTMLDivElement>(null)

  // WAI-ARIA tabs pattern: arrow keys move between tabs.
  function handleKeyDown(e: KeyboardEvent) {
    const index = tabs.findIndex((t) => t.key === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].key)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label="Sekcje ustawień" ref={listRef} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            id={tabId(tab.key)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={tabPanelId(tab.key)}
            tabIndex={selected ? 0 : -1}
            title={tab.label}
            className={selected ? 'tab active' : 'tab'}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon}
            <span className="tab-label">{tab.shortLabel ?? tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
