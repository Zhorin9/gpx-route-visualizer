import { useTranslation } from 'react-i18next'
import Button from './ui/Button'
import { IconToBack, IconToFront } from './icons'
import { moveSelectedLayer } from '../core/canvas/moveLayer'

export default function LayerButtons() {
  const { t } = useTranslation()
  return (
    <>
      <Button size="icon" variant="ghost" aria-label={t('layers.toFront')} title={t('layers.toFrontHint')} onClick={() => moveSelectedLayer('front')}>
        <IconToFront />
      </Button>
      <Button size="icon" variant="ghost" aria-label={t('layers.toBack')} title={t('layers.toBackHint')} onClick={() => moveSelectedLayer('back')}>
        <IconToBack />
      </Button>
    </>
  )
}
