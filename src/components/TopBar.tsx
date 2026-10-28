import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useAppStore } from '../store/useAppStore'
import { IconChevron, IconRedo, IconSettings, IconUndo } from './icons'
import ChangeModeDialog from './ChangeModeDialog'
import ExportDialog from './panel/ExportTab'
import { MODE_LABELS } from '../utils/modeChange'
import Button from './ui/Button'
import type { Units } from '../core/units'

const SOON = 'Wkrótce'

// One choice of a settings row; `soon` marks what is only sketched so far.
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; soon?: boolean }[]; onChange?: (value: T) => void }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="view-switch" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={o.soon}
            title={o.soon ? SOON : undefined}
            className={o.value === value ? 'view-switch-opt active' : 'view-switch-opt'}
            onClick={() => onChange?.(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Settings that apply to the whole project, behind the gear. Units work; theme, language,
// shortcuts and help are laid out for later.
function SettingsMenu({ onClose }: { onClose: () => void }) {
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  return (
    <div className="settings-menu" role="dialog" aria-label="Ustawienia">
      <Choice
        label="Motyw"
        value="light"
        options={[
          { value: 'light', label: 'Jasny' },
          { value: 'dark', label: 'Ciemny', soon: true },
          { value: 'auto', label: 'Auto', soon: true },
        ]}
      />
      <div className="settings-row">
        <span className="settings-label">Język</span>
        <select className="settings-select" aria-label="Język" value="pl" disabled title={SOON} onChange={() => undefined}>
          <option value="pl">Polski</option>
        </select>
      </div>
      <Choice<Units>
        label="Jednostki"
        value={units}
        options={[
          { value: 'metric', label: 'km · m' },
          { value: 'imperial', label: 'mi · ft' },
        ]}
        onChange={(u) => updateStatsContent({ units: u })}
      />
      <div className="settings-links">
        <button type="button" disabled title={SOON} onClick={onClose}>
          <span>Skróty klawiszowe</span>
          <span className="text-muted">?</span>
        </button>
        <button type="button" disabled title={SOON} onClick={onClose}>
          Pomoc i przewodnik
        </button>
      </div>
    </div>
  )
}

// A click elsewhere or Escape closes an open menu.
function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close()
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', escape)
    }
  }, [open, ref, close])
}

// The project's name opens what can be done to the project. Changing its type works; the rest is laid out for later.
function ProjectMenu({ name }: { name: string }) {
  const mode = useAppStore((s) => s.mode)
  const [open, setOpen] = useState(false)
  const [changing, setChanging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const closeDialog = useCallback(() => setChanging(false), [])
  useDismiss(open, ref, close)
  const soon = (label: string) => (
    <button key={label} type="button" role="menuitem" disabled title={SOON}>
      {label}
    </button>
  )

  return (
    <div className="project-menu" ref={ref}>
      <button type="button" className="top-bar-name" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {name}
        <IconChevron width={14} height={14} />
      </button>
      {mode && <span className="tag tag-outline">{MODE_LABELS[mode]}</span>}
      {open && (
        <div className="project-menu-list" role="menu">
          {soon('Zmień nazwę')}
          {soon('Duplikuj projekt')}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setChanging(true)
            }}
          >
            Zmień typ…
          </button>
          {soon('Historia wersji')}
          {soon('Usuń projekt')}
        </div>
      )}
      {changing && mode && <ChangeModeDialog from={mode} onClose={closeDialog} />}
    </div>
  )
}

// Across the editor: the project's name, undo and redo, versions, settings and the way to the files.
export default function TopBar() {
  const name = useAppStore((s) => s.texts.find((t) => t.role === 'title')?.text || s.routeSource?.name || 'Nowy projekt')
  const canUndo = useAppStore((s) => s.past.length > 0)
  const canRedo = useAppStore((s) => s.future.length > 0)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeSettings = useCallback(() => setOpen(false), [])
  const closeExport = useCallback(() => setExporting(false), [])
  useDismiss(open, menuRef, closeSettings)

  return (
    <header className="top-bar">
      <ProjectMenu name={name} />
      <div className="top-bar-actions">
        <Button size="icon" variant="ghost" title="Cofnij (Ctrl+Z)" aria-label="Cofnij" onClick={undo} disabled={!canUndo}>
          <IconUndo />
        </Button>
        <Button size="icon" variant="ghost" title="Ponów (Ctrl+Shift+Z)" aria-label="Ponów" onClick={redo} disabled={!canRedo}>
          <IconRedo />
        </Button>
        <button type="button" className="tag tag-outline top-bar-ab" disabled title={`Porównanie wersji A/B — ${SOON.toLowerCase()}`}>
          A/B
        </button>
        <div className="settings" ref={menuRef}>
          <button type="button" className={open ? 'settings-toggle open' : 'settings-toggle'} aria-label="Ustawienia" aria-expanded={open} onClick={() => setOpen(!open)}>
            <IconSettings />
          </button>
          {open && <SettingsMenu onClose={() => setOpen(false)} />}
        </div>
        <Button variant="primary" onClick={() => setExporting(true)}>
          Pobierz
        </Button>
      </div>
      {exporting && <ExportDialog onClose={closeExport} />}
    </header>
  )
}
