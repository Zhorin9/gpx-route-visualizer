import SliderField from '../fields/SliderField'
import ColorField from '../fields/ColorField'
import Button from '../ui/Button'
import FileButton from '../ui/FileButton'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconTrash, IconUpload } from '../icons'
import useGpxImport from '../../hooks/useGpxImport'
import { useRangeStats } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { formatKm } from '../../utils/format'
import type { AspectKey, SelectOption } from '../../types'

const ASPECT_OPTIONS = Object.entries(ASPECTS).map(([value, a]) => ({ value, label: a.label })) as SelectOption<AspectKey>[]

const BACKDROP_OPTIONS: SelectOption<'checkerboard' | 'color'>[] = [
  { value: 'checkerboard', label: 'Szachownica' },
  { value: 'color', label: 'Kolor' },
]

export default function MediaTab() {
  const track = useAppStore((s) => s.track)
  const gpxError = useAppStore((s) => s.gpxError)
  const hasBackground = useAppStore((s) => s.background !== null)
  const backgroundError = useAppStore((s) => s.backgroundError)
  const removeBackground = useAppStore((s) => s.removeBackground)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setAspectKey = useAppStore((s) => s.setAspectKey)
  const dimOpacity = useAppStore((s) => s.dimOpacity)
  const setDimOpacity = useAppStore((s) => s.setDimOpacity)
  const previewBackdrop = useAppStore((s) => s.previewBackdrop)
  const setPreviewBackdrop = useAppStore((s) => s.setPreviewBackdrop)
  const bgZoom = useAppStore((s) => s.bgAdjust.zoom)
  const updateBgAdjust = useAppStore((s) => s.updateBgAdjust)
  const resetBgAdjust = useAppStore((s) => s.resetBgAdjust)
  const stats = useRangeStats()
  const { importFiles } = useGpxImport()

  const backdropIsColor = previewBackdrop !== 'checkerboard'

  return (
    <>
      <Section title="Trasa">
        {track && stats && (
          <p className="file-summary">
            <strong>{track.name ?? 'Trasa bez nazwy'}</strong>
            <span>
              {formatKm(stats.distanceKm, 1)} · {track.points.length.toLocaleString('pl-PL')} punktów
            </span>
          </p>
        )}
        <FileButton accept=".gpx,application/gpx+xml" onFiles={importFiles} icon={<IconUpload />} block>
          {track ? 'Zmień plik GPX' : 'Wgraj plik GPX'}
        </FileButton>
        {gpxError && (
          <p className="error" role="alert">
            {gpxError}
          </p>
        )}
      </Section>

      <Section title="Format">
        <Segmented label="Proporcje" value={aspectKey} options={ASPECT_OPTIONS} onChange={setAspectKey} />
      </Section>

      <Section title="Tło">
        {hasBackground ? (
          <>
            <div className="button-row">
              <FileButton accept="image/*" onFiles={importFiles} icon={<IconUpload />}>
                Zmień zdjęcie
              </FileButton>
              <Button variant="danger" icon={<IconTrash />} onClick={removeBackground}>
                Usuń
              </Button>
            </div>
            <SliderField
              label="Przyciemnienie"
              unit="%"
              value={Math.round(dimOpacity * 100)}
              defaultValue={0}
              onChange={(v) => setDimOpacity(v / 100)}
            />
            <SliderField
              label="Powiększenie"
              unit="%"
              min={100}
              max={250}
              value={Math.round(bgZoom * 100)}
              defaultValue={100}
              onChange={(v) => updateBgAdjust({ zoom: v / 100 })}
            />
            <p className="hint">Przeciągnij zdjęcie na podglądzie, aby wybrać kadr.</p>
            <Button onClick={resetBgAdjust}>Wyśrodkuj zdjęcie</Button>
          </>
        ) : (
          <>
            <FileButton accept="image/*" onFiles={importFiles} icon={<IconUpload />} block>
              Dodaj zdjęcie tła
            </FileButton>
            <p className="hint">Bez zdjęcia eksport to przezroczysty PNG — gotowy do nałożenia na własne zdjęcie w Instagramie.</p>
            <Segmented
              label="Tło podglądu"
              showLabel
              value={backdropIsColor ? 'color' : 'checkerboard'}
              options={BACKDROP_OPTIONS}
              onChange={(v) => setPreviewBackdrop(v === 'color' ? (backdropIsColor ? previewBackdrop : '#1c1d21') : 'checkerboard')}
            />
            {backdropIsColor && <ColorField label="Kolor podglądu" value={previewBackdrop} onChange={setPreviewBackdrop} />}
          </>
        )}
        {backgroundError && (
          <p className="error" role="alert">
            {backgroundError}
          </p>
        )}
      </Section>
    </>
  )
}
