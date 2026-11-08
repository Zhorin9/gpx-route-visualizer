import { useTranslation } from 'react-i18next'
import useGpxImport, { GPX_ACCEPT } from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'
import { IconAlert } from './icons'
import FileButton from './ui/FileButton'
import StatusCard from './ui/StatusCard'

export default function GpxErrorCard() {
  const gpxError = useAppStore((s) => s.gpxError)
  const { importFiles } = useGpxImport()
  const { t } = useTranslation()
  return (
    <StatusCard
      tone="error"
      icon={<IconAlert />}
      title={t('gpxErrorCard.title')}
      actions={
        <FileButton accept={GPX_ACCEPT} onFiles={importFiles} variant="primary">
          {t('gpxErrorCard.chooseAnother')}
        </FileButton>
      }
    >
      {gpxError}
    </StatusCard>
  )
}
