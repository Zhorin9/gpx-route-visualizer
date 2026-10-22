import useGpxImport from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'
import { IconAlert } from './icons'
import FileButton from './ui/FileButton'
import StatusCard from './ui/StatusCard'

// Shown in place of the empty state when the last GPX file couldn't be read.
export default function GpxErrorCard() {
  const gpxError = useAppStore((s) => s.gpxError)
  const { importFiles } = useGpxImport()
  return (
    <StatusCard
      tone="error"
      icon={<IconAlert />}
      title="Nie udało się odczytać pliku"
      actions={
        <FileButton accept=".gpx,application/gpx+xml" onFiles={importFiles} variant="primary">
          Wybierz inny plik
        </FileButton>
      }
    >
      {gpxError}
    </StatusCard>
  )
}
