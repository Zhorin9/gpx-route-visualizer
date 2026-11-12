import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import { PANELS } from './panels'
import StylePanel from './StylePanel'
import TemplatesPage from './TemplatesPage'
import useSheetDrag, { type SheetState } from './useSheetDrag'
import { useAppStore } from '../../store/useAppStore'
import { IconChevron, IconImage, IconMore, IconPalette, IconType } from '../icons'
import type { PanelTab, ProjectMode } from '../../types'
import type { TKey } from '../../i18n'

type PhoneTab = 'look' | 'texts' | 'media' | 'more'
type MoreGroup = Extract<PanelTab, 'route' | 'style' | 'animation'>

const PHONE_TABS: (TabDef<PhoneTab> & { label: TKey })[] = [
  { key: 'look', label: 'controlPanel.look', icon: <IconPalette /> },
  { key: 'texts', label: 'controlPanel.texts', icon: <IconType /> },
  { key: 'media', label: 'controlPanel.photos', icon: <IconImage /> },
  { key: 'more', label: 'controlPanel.more', icon: <IconMore /> },
]

const MORE_GROUPS: { tab: MoreGroup; label: TKey; desc: TKey; modes?: ProjectMode[] }[] = [
  { tab: 'route', label: 'controlPanel.routeGroup', desc: 'controlPanel.routeGroupDesc', modes: ['map'] },
  { tab: 'style', label: 'controlPanel.colorsGroup', desc: 'controlPanel.colorsGroupDesc' },
  { tab: 'animation', label: 'controlPanel.animation', desc: 'controlPanel.animationGroupDesc' },
]

const TEMPLATES_PAGE = 'presets'
const FIRST_STYLE_PAGE = 'colors'
const SELECTED_ROW = '.tab-panel .element-row.active'
const TAP_SLOP = 8
const SHEET_SETTLE_MS = 260

function phoneTabFor(tab: PanelTab, stylePage: string | undefined): PhoneTab {
  if (tab === 'texts' || tab === 'media') return tab
  if (tab === 'style' && (stylePage ?? TEMPLATES_PAGE) === TEMPLATES_PAGE) return 'look'
  return 'more'
}

function MoreMenu({ onPick }: { onPick: (group: MoreGroup) => void }) {
  const { t } = useTranslation()
  const mode = useAppStore((s) => s.mode ?? 'map')
  return (
    <nav className="more-menu" aria-label={t('controlPanel.moreSettings')}>
      {MORE_GROUPS.filter((group) => !group.modes || group.modes.includes(mode)).map((group) => (
        <button key={group.tab} type="button" className="more-menu-item" onClick={() => onPick(group.tab)}>
          <span className="more-menu-text">
            <span className="more-menu-label">{t(group.label)}</span>
            <span className="more-menu-desc">{t(group.desc)}</span>
          </span>
          <IconChevron className="more-menu-chevron" />
        </button>
      ))}
    </nav>
  )
}

function GroupPage({ group, onBack }: { group: MoreGroup; onBack: () => void }) {
  const { t } = useTranslation()
  const label = MORE_GROUPS.find((g) => g.tab === group)?.label
  const Panel = PANELS[group]
  return (
    <>
      <button type="button" className="more-back" aria-label={t('controlPanel.back')} onClick={onBack}>
        <IconChevron className="more-back-chevron" />
        {label && t(label)}
      </button>
      {group === 'style' ? <StylePanel withTemplates={false} /> : <Panel />}
    </>
  )
}

export default function PhonePanel() {
  const { t } = useTranslation()
  const activeTab = useAppStore((s) => s.activeTab)
  const stylePage = useAppStore((s) => s.subTabs.style)
  const selection = useAppStore((s) => s.selection)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setSubTab = useAppStore((s) => s.setSubTab)
  const [phoneTab, setPhoneTab] = useState<PhoneTab>('look')
  const [group, setGroup] = useState<MoreGroup | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
  const panelRef = useRef<HTMLElement>(null)
  const handleGestures = useSheetDrag(panelRef, sheetState, setSheetState)
  const open = sheetState !== 'collapsed'
  const seen = useRef({ activeTab, stylePage, selection })

  useEffect(() => {
    const before = seen.current
    if (before.activeTab === activeTab && before.stylePage === stylePage && before.selection === selection) return
    seen.current = { activeTab, stylePage, selection }
    if (before.selection === selection) setSheetState((state) => (state === 'collapsed' ? 'half' : state))
    const tab = phoneTabFor(activeTab, stylePage)
    setPhoneTab(tab)
    setGroup(tab === 'more' ? (activeTab as MoreGroup) : null)
  }, [activeTab, stylePage, selection])

  const revealSelected = useRef(false)
  function showSelectedRow() {
    const row = panelRef.current?.querySelector(SELECTED_ROW)
    if (!revealSelected.current || !row) return
    revealSelected.current = false
    row.scrollIntoView({ block: 'start' })
  }

  useEffect(() => {
    if (open) setTimeout(showSelectedRow, SHEET_SETTLE_MS)
  })

  useEffect(() => {
    let tapStart: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => {
      tapStart = e.target instanceof HTMLCanvasElement && e.target.closest('.canvas-viewport') ? { x: e.clientX, y: e.clientY } : null
    }
    const onUp = (e: PointerEvent) => {
      const tapped = tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < TAP_SLOP
      tapStart = null
      if (!tapped || !useAppStore.getState().selection) return
      setSheetState((state) => (state === 'collapsed' ? 'half' : state))
      revealSelected.current = true
      setTimeout(showSelectedRow, SHEET_SETTLE_MS)
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointerup', onUp, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointerup', onUp, true)
    }
  }, [])

  function chooseTab(key: PhoneTab) {
    if (key === 'more' && group && open) return setGroup(null)
    if (key === phoneTab && open) return setSheetState('collapsed')
    if (!open) setSheetState('half')
    setPhoneTab(key)
    if (key === 'look') {
      setActiveTab('style')
      setSubTab('style', TEMPLATES_PAGE)
    }
    if (key === 'texts' || key === 'media') setActiveTab(key)
    if (key === 'more') setGroup(null)
  }

  function pickGroup(next: MoreGroup) {
    setGroup(next)
    setActiveTab(next)
    if (next === 'style' && (stylePage ?? TEMPLATES_PAGE) === TEMPLATES_PAGE) setSubTab('style', FIRST_STYLE_PAGE)
  }

  const Panel = phoneTab === 'texts' || phoneTab === 'media' ? PANELS[phoneTab] : null

  return (
    <aside className={`panel sheet sheet-${sheetState}`} ref={panelRef}>
      <h1 className="visually-hidden">Tripcard</h1>
      <button type="button" className="sheet-handle" aria-expanded={open} aria-label={t(open ? 'controlPanel.collapsePanel' : 'controlPanel.expandPanel')} {...handleGestures}>
        <span className="sheet-grip" />
      </button>
      <Tabs tabs={PHONE_TABS.map((tab) => ({ ...tab, label: t(tab.label) }))} active={phoneTab} onChange={chooseTab} />

      {open && (
        <div className="tab-panel" role="tabpanel" id={tabPanelId(phoneTab)} aria-labelledby={tabId(phoneTab)} key={`${phoneTab}-${group}`}>
          {phoneTab === 'look' && <TemplatesPage />}
          {Panel && <Panel />}
          {phoneTab === 'more' && (group ? <GroupPage group={group} onBack={() => setGroup(null)} /> : <MoreMenu onPick={pickGroup} />)}
        </div>
      )}
    </aside>
  )
}
