import { useState } from 'react'
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

  if (!hasRoute || hasBackground || styled || onTemplates || dismissed) return null

  function openTemplates() {
    setActiveTab('style')
    setSubTab('style', 'presets')
  }

  return (
    <div className="transparent-note" role="status">
      <p>
        <strong>Tło przezroczyste.</strong> Pobierzesz PNG do nałożenia na zdjęcie w Instagramie.
      </p>
      <Button size="sm" variant="primary" icon={<IconPalette />} onClick={openTemplates}>
        Wybierz styl
      </Button>
      <Button size="icon" variant="ghost" icon={<IconClose />} aria-label="Zamknij podpowiedź" onClick={() => setDismissed(true)} />
    </div>
  )
}
