import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import useDismiss from '../../hooks/useDismiss'
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery'
import { FONT_CHOICES, FONT_GROUPS, ensureFontLoaded, fontWeight, type FontGroup } from '../../utils/fonts'
import { foldText } from '../../utils/foldText'
import { IconCheck, IconChevron, IconSearch } from '../icons'
import './FontField.css'

type Filter = FontGroup | 'all'

const PICKER_MIN_WIDTH = 320
const PICKER_MAX_HEIGHT = 460
const PICKER_ROOM_BELOW = 300
const EDGE = 8
const GAP = 6

const fontStyle = (family: string): CSSProperties => ({ fontFamily: `"${family}", var(--font-ui)`, fontWeight: fontWeight(family) })

function placeBelowOrAbove(trigger: DOMRect): CSSProperties {
  const width = Math.min(Math.max(trigger.width, PICKER_MIN_WIDTH), window.innerWidth - EDGE * 2)
  const left = Math.min(Math.max(trigger.left, EDGE), window.innerWidth - width - EDGE)
  const below = window.innerHeight - trigger.bottom - GAP - EDGE
  const above = trigger.top - GAP - EDGE
  if (below >= PICKER_ROOM_BELOW || below >= above) return { left, width, top: trigger.bottom + GAP, maxHeight: Math.min(PICKER_MAX_HEIGHT, below) }
  return { left, width, bottom: window.innerHeight - trigger.top + GAP, maxHeight: Math.min(PICKER_MAX_HEIGHT, above) }
}

function FontOption({ family, id, index, selected, active, onPick, onPoint }: { family: string; id: string; index: number; selected: boolean; active: boolean; onPick: () => void; onPoint: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const row = ref.current
    if (!row) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      void ensureFontLoaded(family)
      observer.disconnect()
    })
    observer.observe(row)
    return () => observer.disconnect()
  }, [family])
  return (
    <li ref={ref} id={id} data-index={index} role="option" aria-selected={selected} className={['font-option', selected && 'is-selected', active && 'is-active'].filter(Boolean).join(' ')} onPointerMove={onPoint} onClick={onPick}>
      <span className="font-option-name" style={fontStyle(family)}>
        {family}
      </span>
      {selected && <IconCheck className="font-option-check" />}
    </li>
  )
}

export default function FontField({ value, onChange }: { value: string; onChange: (font: string) => void }) {
  const { t } = useTranslation()
  const labelId = useId()
  const listId = useId()
  const phone = useMediaQuery(PHONE_QUERY)
  const touch = useMediaQuery('(pointer: coarse)')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const close = useCallback(() => {
    if (pickerRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
    setOpen(false)
  }, [])
  useDismiss(open, pickerRef, close)

  useEffect(() => {
    void ensureFontLoaded(value)
  }, [value])

  const groupLabel = useCallback((group: FontGroup) => t(FONT_GROUPS.find((g) => g.key === group)?.label ?? 'fontField.font'), [t])

  const shown = useMemo(() => {
    const wanted = foldText(query.trim())
    return FONT_CHOICES.filter((f) => (filter === 'all' || f.group === filter) && (!wanted || foldText(f.family).includes(wanted) || foldText(groupLabel(f.group)).includes(wanted)))
  }, [query, filter, groupLabel])

  const grouped = filter === 'all' && !query.trim()
  const optionId = (index: number) => `${listId}-${index}`

  function openPicker() {
    setQuery('')
    setFilter('all')
    setActive(Math.max(0, FONT_CHOICES.findIndex((f) => f.family === value)))
    setOpen(true)
  }

  function pick(family: string) {
    onChange(family)
    triggerRef.current?.focus()
    setOpen(false)
  }

  useLayoutEffect(() => {
    if (!open || phone) return
    const follow = () => triggerRef.current && setPlace(placeBelowOrAbove(triggerRef.current.getBoundingClientRect()))
    follow()
    window.addEventListener('resize', follow)
    window.addEventListener('scroll', follow, true)
    return () => {
      window.removeEventListener('resize', follow)
      window.removeEventListener('scroll', follow, true)
    }
  }, [open, phone])

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, shown])

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => Math.min(Math.max(i + step, 0), shown.length - 1))
    } else if (e.key === 'Enter' && shown[active]) {
      e.preventDefault()
      pick(shown[active].family)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  function search(text: string) {
    setQuery(text)
    setActive(0)
  }

  function chooseFilter(next: Filter) {
    setFilter(next)
    setActive(0)
  }

  const current = FONT_CHOICES.find((f) => f.family === value)

  return (
    <div className="field">
      <span id={labelId} className="field-label">
        {t('fontField.font')}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="font-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span id={`${labelId}-value`} className="font-trigger-name" style={fontStyle(value)}>
          {value}
        </span>
        {current && <span className="font-trigger-group">{groupLabel(current.group)}</span>}
        <IconChevron className="font-trigger-chevron" />
      </button>

      {open &&
        createPortal(
          <div ref={pickerRef} className={phone ? 'font-picker is-sheet' : 'font-picker'} style={phone ? undefined : place} role="dialog" aria-label={t('fontField.font')}>
            <label className="font-picker-search">
              <IconSearch className="font-picker-search-icon" />
              <input
                type="search"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={shown[active] ? optionId(active) : undefined}
                aria-label={t('fontField.search')}
                placeholder={t('fontField.search')}
                autoFocus={!touch}
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => search(e.target.value)}
                onKeyDown={onSearchKey}
              />
            </label>

            <div className="filter-chips font-picker-filters" role="radiogroup" aria-label={t('fontField.styles')}>
              {[{ key: 'all' as const, label: t('fontField.all') }, ...FONT_GROUPS.map((g) => ({ key: g.key, label: t(g.label) }))].map(({ key, label }) => (
                <button key={key} type="button" role="radio" aria-checked={filter === key} className="filter-chip" onClick={() => chooseFilter(key)}>
                  {label}
                </button>
              ))}
            </div>

            {shown.length ? (
              <ul ref={listRef} id={listId} role="listbox" aria-label={t('fontField.fonts')} className="font-picker-list">
                {shown.map((font, index) => (
                  <FontGroupStart key={font.family} show={grouped && font.group !== shown[index - 1]?.group} label={groupLabel(font.group)}>
                    <FontOption family={font.family} id={optionId(index)} index={index} selected={font.family === value} active={index === active} onPick={() => pick(font.family)} onPoint={() => setActive(index)} />
                  </FontGroupStart>
                ))}
              </ul>
            ) : (
              <p className="font-picker-empty" role="status">
                {t('fontField.noMatch', { query: query.trim() })}
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

function FontGroupStart({ show, label, children }: { show: boolean; label: string; children: React.ReactNode }) {
  return (
    <>
      {show && (
        <li role="presentation" className="font-picker-heading">
          {label}
        </li>
      )}
      {children}
    </>
  )
}
