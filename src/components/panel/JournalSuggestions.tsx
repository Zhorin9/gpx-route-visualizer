import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import { layerKeysOnFrame } from '../../core/canvas/layers'
import { journalCarousel } from '../../features/map-sticker/journal'
import { useUserFonts } from '../../features/user-fonts/UserFontsPanel'
import { selectRouteDays } from '../../store/derived'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'

export default function JournalSuggestions() {
  const { t } = useTranslation()
  const hasRoute = useHasRoute()
  const slideCount = useAppStore((s) => s.slides.length)
  const arrange = useAppStore((s) => s.arrangeMapStickers)
  const applyGlobalFont = useAppStore((s) => s.applyGlobalFont)
  const ownFont = useUserFonts()[0]
  const carousel = hasRoute && slideCount > 1
  if (!carousel && !ownFont) return null
  return (
    <div className="style-in-use-actions">
      {carousel && (
        <Button size="sm" onClick={() => {
          const s = useAppStore.getState()
          arrange(journalCarousel(s, selectRouteDays(s).length, layerKeysOnFrame()))
        }}>
          {t('journal.arrangeCarousel')}
        </Button>
      )}
      {ownFont && (
        <Button size="sm" onClick={() => applyGlobalFont(ownFont.family)}>
          {t('journal.useOwnFont', { family: ownFont.family })}
        </Button>
      )}
    </div>
  )
}
