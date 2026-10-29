import { useEffect, useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconClose, IconDownload } from '../icons'
import { useHasBackground, useHasRoute, useManualFlags } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS, FORMAT_ORDER } from '../../core/formats/registry'
import { exportFileNames } from '../../utils/exportImage'
import { seriesWarnings } from '../../utils/series'
import { exportProject } from '../../utils/exportProject'
import { canvasElements, type CanvasElementDefinition } from '../../core/canvas/registry'
import SubTabs from '../../core/panel/SubTabs'
import { SOURCE_ASPECT, hasManualLayout, slideCountIn } from '../../utils/reflow'
import { selectTrack } from '../../store/derived'
import type { AspectKey, ExportFormat, SelectOption } from '../../types'
import './ExportTab.css'

type Scale = '1' | '2'

const FORMAT_OPTIONS: SelectOption<ExportFormat>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
]

function filesLabel(count: number) {
  return count === 1 ? '1 plik' : `${count} ${count < 5 ? 'pliki' : 'plików'}`
}

function FormatCard({ aspect, checked, onToggle }: { aspect: AspectKey; checked: boolean; onToggle: () => void }) {
  const { w, h, exportName, note } = FORMATS[aspect]
  const boxH = 56
  return (
    <label className={checked ? 'format-card active' : 'format-card'}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span className="format-card-frame" style={{ width: Math.round((boxH * w) / h), height: boxH }} />
      <span className="format-card-text">
        <span className="format-card-name">{exportName}</span>
        <span className="format-card-meta">
          {w} × {h} px · {note}
        </span>
      </span>
    </label>
  )
}

function ElementStateRow({ def, manual }: { def: CanvasElementDefinition; manual: boolean }) {
  if (!def.useIsAvailable()) return null
  return (
    <li className={manual ? 'manual' : undefined}>
      <span>{def.label}</span>
      <span className="element-state-tag">{manual ? 'Ręcznie' : 'Auto'}</span>
    </li>
  )
}

// Hand-placed elements of the open format, and the way back to the automatic layout.
function FormatLayoutSection() {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const texts = useAppStore((s) => s.texts)
  const showSafeZones = useAppStore((s) => s.showSafeZones)
  const setShowSafeZones = useAppStore((s) => s.setShowSafeZones)
  const resetFormatLayout = useAppStore((s) => s.resetFormatLayout)
  const flags = useManualFlags()
  const manual = hasManualLayout(flags)

  if (aspectKey === SOURCE_ASPECT) return null

  const rows = [
    ...texts.map((t) => ({ key: `t${t.id}`, name: `Napis „${t.text.replace(/\s+/g, ' ').slice(0, 24)}”`, manual: Boolean(flags.texts[t.id]) })),
    { key: 'route', name: 'Trasa', manual: flags.route },
  ]

  return (
    <Section title={`Układ w formacie ${aspectKey}`}>
      <CheckboxField label="Synchronizuj z 4:5" checked={!manual} onChange={(on) => on && resetFormatLayout()} disabled={!manual} />
      {FORMATS[aspectKey].safeZone && <CheckboxField label="Strefy bezpieczne" checked={showSafeZones} onChange={setShowSafeZones} />}
      <ul className="element-states">
        {canvasElements().map((def) => (
          <ElementStateRow key={def.kind} def={def} manual={Boolean(flags.elements[def.kind])} />
        ))}
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

// Pobierz opens this over the editor. Obraz is its own page; Wideo is added by its feature.
export default function ExportDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose])

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div className="export-dialog-head">
          <h2 id="export-title" className="dialog-title">
            Pobierz
          </h2>
          <Button size="icon" variant="ghost" aria-label="Zamknij" onClick={onClose}>
            <IconClose />
          </Button>
        </div>
        <SubTabs tab="export" own={[{ id: 'image', label: 'Obraz', Component: ImageExport }]} />
      </div>
    </div>
  )
}

function ImageExport() {
  const hasRoute = useHasRoute()
  const hasBackground = useHasBackground()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const slides = useAppStore((s) => s.slides)
  const parkedSlides = useAppStore((s) => s.parkedSlides)
  const exporting = useAppStore((s) => s.exporting)
  const photos = useAppStore((s) => s.photos)
  const points = useAppStore((s) => selectTrack(s)?.points ?? null)
  const [chosenFormat, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<Scale>('1')
  const [picked, setPicked] = useState<AspectKey[]>([aspectKey])

  const { w, h } = FORMATS[aspectKey]
  // JPG has no transparency — only makes sense over a photo.
  const format: ExportFormat = hasBackground ? chosenFormat : 'png'
  const fileScale = scale === '2' ? 2 : 1
  const baseName = trackName ?? (hasRoute ? null : 'kolaz')
  const formats = FORMAT_ORDER.filter((f) => picked.includes(f))
  const fileNames = formats.flatMap((f) => exportFileNames(format, fileScale, f, baseName, slideCountIn({ slides, parkedSlides }, f)))
  const canExport = (hasRoute || hasBackground) && formats.length > 0 && !exporting
  const warnings = seriesWarnings(slides, new Map(photos.map((p) => [p.id, p])), points)

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

      {warnings.length > 0 && (
        <Section title="Do sprawdzenia">
          <ul className="export-files export-warnings">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="hint">To tylko ostrzeżenia: serię możesz pobrać i tak.</p>
        </Section>
      )}

      <Button variant="primary" icon={<IconDownload />} block disabled={!canExport} onClick={() => exportProject(formats, fileScale, format, baseName)}>
        {exporting ? 'Przygotowuję pliki…' : fileNames.length > 1 ? `Pobierz ZIP (${filesLabel(fileNames.length)})` : `Pobierz ${format.toUpperCase()}`}
      </Button>
      {!hasRoute && !hasBackground && <p className="hint">Dodaj zdjęcia (zakładka Zdjęcia) lub plik GPX (zakładka Mapa), aby móc pobrać grafikę.</p>}
    </>
  )
}
