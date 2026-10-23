import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { IconRedo, IconSettings, IconUndo } from './icons'
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

// Across the editor: the project's name, undo and redo, versions, settings and the way to the files.
export default function TopBar() {
  const name = useAppStore((s) => s.texts.find((t) => t.role === 'title')?.text || s.routeSource?.name || 'Nowy projekt')
  const canUndo = useAppStore((s) => s.past.length > 0)
  const canRedo = useAppStore((s) => s.future.length > 0)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // A click elsewhere or Escape closes the settings.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false)
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <header className="top-bar">
      <span className="top-bar-name">{name}</span>
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
        <Button variant="primary" onClick={() => setActiveTab('export')}>
          Pobierz
        </Button>
      </div>
    </header>
  )
}
