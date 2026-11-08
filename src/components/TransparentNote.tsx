import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHasBackground, useHasRoute } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { IconClose, IconPalette } from './icons'
import Button from './ui/Button'

export default function TransparentNote() {
  const hasRoute = useHasRoute()
  const hasBackground = useHasBackground()
  const styled = useAppStore((s) => s.templateId != null || s.templatePreview != null)
  const onTemplates = useAppStore((s) => s.activeTab === 'style' && (s.subTabs.style ?? 'presets') === 'presets')
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setSubTab = useAppStore((s) => s.setSubTab)
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation()

  if (!hasRoute || hasBackground || styled || onTemplates || dismissed) return null

  function openTemplates() {
    setActiveTab('style')
    setSubTab('style', 'presets')
  }

  return (
    <div className="transparent-note" role="status">
      <p>
        <strong>{t('transparentNote.title')}</strong> {t('transparentNote.body')}
      </p>
      <Button size="sm" variant="primary" icon={<IconPalette />} onClick={openTemplates}>
        {t('transparentNote.chooseStyle')}
      </Button>
      <Button size="icon" variant="ghost" icon={<IconClose />} aria-label={t('transparentNote.close')} onClick={() => setDismissed(true)} />
    </div>
  )
}
