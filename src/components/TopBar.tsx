import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useDismiss from '../hooks/useDismiss'
import { useAppStore } from '../store/useAppStore'
import { IconChevron, IconRedo, IconSettings, IconUndo } from './icons'
import ChangeModeDialog from './ChangeModeDialog'
import ExportDialog from './panel/ExportTab'
import { exportedSlides } from '../utils/series'
import { MODE_LABELS } from '../utils/modeChange'
import Button from './ui/Button'
import type { Units } from '../core/units'
import { LANGUAGES, type Language } from '../i18n'

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
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
            className={o.value === value ? 'view-switch-opt active' : 'view-switch-opt'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SettingsMenu() {
  const units = useAppStore((s) => s.statsContent.units)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const { t, i18n } = useTranslation()
  return (
    <div className="settings-menu" role="dialog" aria-label={t('topBar.settings')}>
      <Choice<Language>
        label={t('topBar.language')}
        value={i18n.language as Language}
        options={LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() }))}
        onChange={(l) => void i18n.changeLanguage(l)}
      />
      <Choice<Units>
        label={t('topBar.units')}
        value={units}
        options={[
          { value: 'metric', label: 'km · m' },
          { value: 'imperial', label: 'mi · ft' },
        ]}
        onChange={(u) => updateStatsContent({ units: u })}
      />
    </div>
  )
}

function ProjectMenu({ name }: { name: string }) {
  const mode = useAppStore((s) => s.mode)
  const [open, setOpen] = useState(false)
  const [changing, setChanging] = useState(false)
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const closeDialog = useCallback(() => setChanging(false), [])
  useDismiss(open, ref, close)

  return (
    <div className="project-menu" ref={ref}>
      <button type="button" className="top-bar-name" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {name}
        <IconChevron width={14} height={14} />
      </button>
      {mode && <span className="tag tag-outline">{MODE_LABELS[mode]}</span>}
      {open && (
        <div className="project-menu-list" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setChanging(true)
            }}
          >
            {t('topBar.changeType')}
          </button>
        </div>
      )}
      {changing && mode && <ChangeModeDialog from={mode} onClose={closeDialog} />}
    </div>
  )
}

export default function TopBar() {
  const { t } = useTranslation()
  const name = useAppStore((s) => s.texts.find((n) => n.role === 'title')?.text || s.routeSource?.name || t('topBar.newProject'))
  const canUndo = useAppStore((s) => s.past.length > 0)
  const canRedo = useAppStore((s) => s.future.length > 0)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  // A series names how many slides go to the files.
  const seriesCount = useAppStore((s) => (s.carouselKind === 'slides' && s.slides.length > 1 ? exportedSlides(s.slides).length : 0))
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
        <Button size="icon" variant="ghost" title={`${t('topBar.undo')} (Ctrl+Z)`} aria-label={t('topBar.undo')} onClick={undo} disabled={!canUndo}>
          <IconUndo />
        </Button>
        <Button size="icon" variant="ghost" title={`${t('topBar.redo')} (Ctrl+Shift+Z)`} aria-label={t('topBar.redo')} onClick={redo} disabled={!canRedo}>
          <IconRedo />
        </Button>
        <div className="settings" ref={menuRef}>
          <button type="button" className={open ? 'settings-toggle open' : 'settings-toggle'} aria-label={t('topBar.settings')} aria-expanded={open} onClick={() => setOpen(!open)}>
            <IconSettings />
          </button>
          {open && <SettingsMenu />}
        </div>
        <Button variant="primary" onClick={() => setExporting(true)}>
          {seriesCount ? t('topBar.exportSeries', { count: seriesCount }) : t('topBar.download')}
        </Button>
      </div>
      {exporting && <ExportDialog onClose={closeExport} />}
    </header>
  )
}
