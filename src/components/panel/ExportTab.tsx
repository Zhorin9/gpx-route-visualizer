import { useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconDownload } from '../icons'
import { useHasBackground, useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { exportFileNames } from '../../utils/exportImage'
import { exportProject } from '../../utils/exportProject'
import { FORMAT_ORDER, SOURCE_ASPECT, hasManualLayout, manualFlags } from '../../utils/reflow'
import type { AspectKey, ExportFormat, SelectOption } from '../../types'

type Scale = '1' | '2'

const FORMAT_NOTES: Record<AspectKey, string> = { '4:5': 'feed', '9:16': 'strefy bezpieczne', '1:1': 'siatka profilu' }
const FORMAT_NAMES: Record<AspectKey, string> = { '4:5': 'Post 4:5', '9:16': 'Story / Reels 9:16', '1:1': 'Kwadrat 1:1' }
const FORMAT_OPTIONS: SelectOption<ExportFormat>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
]

function filesLabel(count: number) {
  return count === 1 ? '1 plik' : `${count} ${count < 5 ? 'pliki' : 'plików'}`
}

function FormatCard({ aspect, checked, onToggle }: { aspect: AspectKey; checked: boolean; onToggle: () => void }) {
  const { w, h } = ASPECTS[aspect]
  const boxH = 56
  return (
    <label className={checked ? 'format-card active' : 'format-card'}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span className="format-card-frame" style={{ width: Math.round((boxH * w) / h), height: boxH }} />
      <span className="format-card-text">
        <span className="format-card-name">{FORMAT_NAMES[aspect]}</span>
        <span className="format-card-meta">
          {w} × {h} px · {FORMAT_NOTES[aspect]}
        </span>
      </span>
    </label>
  )
}

// Hand-placed elements of the open format, and the way back to the automatic layout.
function FormatLayoutSection() {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const texts = useAppStore((s) => s.texts)
  const showSafeZones = useAppStore((s) => s.showSafeZones)
  const setShowSafeZones = useAppStore((s) => s.setShowSafeZones)
  const resetFormatLayout = useAppStore((s) => s.resetFormatLayout)
  const statsLayout = useAppStore((s) => s.statsLayout)
  const routeTransform = useAppStore((s) => s.routeTransform)
  const sourceLayout = useAppStore((s) => s.sourceLayout)
  const flags = manualFlags({ aspectKey, texts, statsLayout, routeTransform, sourceLayout })
  const manual = hasManualLayout(flags)

  if (aspectKey === SOURCE_ASPECT) return null

  const rows = [
    { key: 'stats', name: 'Nagłówek ze statystykami', manual: flags.stats },
    ...texts.map((t) => ({ key: `t${t.id}`, name: `Napis „${t.text.replace(/\s+/g, ' ').slice(0, 24)}”`, manual: Boolean(flags.texts[t.id]) })),
    { key: 'route', name: 'Trasa', manual: flags.route },
  ]

  return (
    <Section title={`Układ w formacie ${aspectKey}`}>
      <CheckboxField label="Synchronizuj z 4:5" checked={!manual} onChange={(on) => on && resetFormatLayout()} disabled={!manual} />
      {aspectKey === '9:16' && <CheckboxField label="Strefy bezpieczne story" checked={showSafeZones} onChange={setShowSafeZones} />}
      <ul className="element-states">
        {rows.map((row) => (
          <li key={row.key} className={row.manual ? 'manual' : undefined}>
            <span>{row.name}</span>
            <span className="element-state-tag">{row.manual ? 'Ręcznie' : 'Auto'}</span>
          </li>
        ))}
      </ul>
      <Button disabled={!manual} onClick={resetFormatLayout}>
        Przywróć układ automatyczny
      </Button>
      <p className="hint">Elementy oznaczone „Ręcznie” zachowają pozycję przy zmianie innych formatów.</p>
    </Section>
  )
}

export default function ExportTab() {
  const hasRoute = useHasRoute()
  const hasBackground = useHasBackground()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const trackName = useAppStore((s) => s.track?.name ?? null)
  const slideCount = useAppStore((s) => s.slides.length)
  const exporting = useAppStore((s) => s.exporting)
  const [chosenFormat, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<Scale>('1')
  const [picked, setPicked] = useState<AspectKey[]>([aspectKey])

  const { w, h } = ASPECTS[aspectKey]
  // JPG has no transparency — only makes sense over a photo.
  const format: ExportFormat = hasBackground ? chosenFormat : 'png'
  const fileScale = scale === '2' ? 2 : 1
  const baseName = trackName ?? (hasRoute ? null : 'kolaz')
  const formats = FORMAT_ORDER.filter((f) => picked.includes(f))
  const fileNames = formats.flatMap((f) => exportFileNames(format, fileScale, f, baseName, slideCount))
  const canExport = (hasRoute || hasBackground) && formats.length > 0 && !exporting

  const scaleOptions: SelectOption<Scale>[] = [
    { value: '1', label: `${w}×${h}` },
    { value: '2', label: `${w * 2}×${h * 2}` },
  ]

  function toggle(aspect: AspectKey) {
    setPicked((current) => (current.includes(aspect) ? current.filter((a) => a !== aspect) : [...current, aspect]))
  }

  return (
    <>
      <p className="export-summary">
        <strong>{fileNames.length > 1 ? `${filesLabel(fileNames.length)} w jednym ZIP` : filesLabel(fileNames.length)}</strong>
        <span>{formats.length > 1 ? `Jeden projekt, ${formats.length} formaty` : 'Jeden projekt'}</span>
      </p>

      <Section title="Formaty">
        {FORMAT_ORDER.map((f) => (
          <FormatCard key={f} aspect={f} checked={picked.includes(f)} onToggle={() => toggle(f)} />
        ))}
        <p className="hint">Nagłówek, napisy i trasa układają się automatycznie w każdym formacie, a story omija strefy interfejsu. Dowolny format możesz potem poprawić ręcznie.</p>
      </Section>

      <FormatLayoutSection />

      <Section title="Rozmiar i format pliku">
        <Segmented label="Rozdzielczość" value={scale} options={scaleOptions} onChange={setScale} />
        <Segmented label="Format pliku" value={format} options={FORMAT_OPTIONS} onChange={setFormat} disabled={!hasBackground} />
        <p className="hint">
          {hasBackground
            ? 'JPG jest mniejszy, PNG zachowuje pełną jakość.'
            : 'Bez zdjęcia tła zapisujemy przezroczysty PNG — nałożysz go na zdjęcie w Instagramie.'}
        </p>
      </Section>

      {fileNames.length > 1 && (
        <Section title="Pliki">
          <ul className="export-files">
            {fileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Section>
      )}

      <Button variant="primary" icon={<IconDownload />} block disabled={!canExport} onClick={() => exportProject(formats, fileScale, format, baseName)}>
        {exporting ? 'Przygotowuję pliki…' : fileNames.length > 1 ? `Pobierz ZIP (${filesLabel(fileNames.length)})` : `Pobierz ${format.toUpperCase()}`}
      </Button>
      {!hasRoute && !hasBackground && <p className="hint">Dodaj zdjęcia lub plik GPX w pierwszej zakładce, aby móc pobrać grafikę.</p>}
    </>
  )
}
