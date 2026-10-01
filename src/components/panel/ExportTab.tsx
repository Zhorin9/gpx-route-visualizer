import { useState } from 'react'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconDownload } from '../icons'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { exportStage } from '../../utils/exportImage'
import type { ExportFormat, SelectOption } from '../../types'

type Scale = '1' | '2'

export default function ExportTab() {
  const hasRoute = useHasRoute()
  const hasBackground = useAppStore((s) => s.background !== null)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const trackName = useAppStore((s) => s.track?.name ?? null)
  const [chosenFormat, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<Scale>('1')

  const { w, h } = ASPECTS[aspectKey]
  // JPG has no transparency — only makes sense over a photo.
  const format: ExportFormat = hasBackground ? chosenFormat : 'png'

  const formatOptions: SelectOption<ExportFormat>[] = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
  ]
  const scaleOptions: SelectOption<Scale>[] = [
    { value: '1', label: `${w}×${h}` },
    { value: '2', label: `${w * 2}×${h * 2}` },
  ]

  return (
    <>
      <Section title="Format pliku">
        <Segmented label="Format pliku" value={format} options={formatOptions} onChange={setFormat} disabled={!hasBackground} />
        <p className="hint">
          {hasBackground
            ? 'JPG jest mniejszy, PNG zachowuje pełną jakość.'
            : 'Bez zdjęcia tła zapisujemy przezroczysty PNG — nałożysz go na zdjęcie w Instagramie.'}
        </p>
      </Section>

      <Section title="Rozdzielczość">
        <Segmented label="Rozdzielczość" value={scale} options={scaleOptions} onChange={setScale} />
        <p className="hint">
          {scale === '1'
            ? 'Natywny rozmiar Instagrama — wyższej i tak nie wyświetli.'
            : 'Podwójna rozdzielczość do druku lub archiwum.'}
        </p>
      </Section>

      <Button
        variant="primary"
        icon={<IconDownload />}
        block
        disabled={!hasRoute}
        onClick={() => exportStage(format, scale === '2' ? 2 : 1, aspectKey, trackName)}
      >
        Pobierz {format.toUpperCase()}
      </Button>
      {!hasRoute && <p className="hint">Wgraj plik GPX w zakładce Media, aby móc pobrać grafikę.</p>}
    </>
  )
}
