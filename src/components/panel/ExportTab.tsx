import { createContext, use, useState } from 'react'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconAlert, IconCheckCircle, IconDownload } from '../icons'
import { plural } from '../../utils/format'
import { useHasBackground, useHasRoute, useInkIsDark } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS, FORMAT_ORDER } from '../../core/formats/registry'
import { exportFileNames } from '../../utils/exportImage'
import { seriesWarnings } from '../../utils/series'
import { exportProject } from '../../utils/exportProject'
import { canvasElements, type CanvasElementDefinition } from '../../core/canvas/registry'
import SubTabs from '../../core/panel/SubTabs'
import { SOURCE_ASPECT, hasManualLayout, manualFlags, slideCountIn } from '../../utils/reflow'
import { selectTrack } from '../../store/derived'
import useFormatProofs from '../../hooks/useFormatProofs'
import useStoreAtRest from '../../hooks/useStoreAtRest'
import type { AspectKey, ExportFormat, SelectOption } from '../../types'
import './ExportTab.css'
import { iconById } from '../place/icons'

type Scale = '1' | '2'

const FORMAT_OPTIONS: SelectOption<ExportFormat>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
]

function filesLabel(count: number) {
  return `${count} ${plural(count, 'plik', 'pliki', 'plików')}`
}

interface ProofCardProps {
  aspect: AspectKey
  slides: number
  proof?: string
  checked: boolean
  onToggle: () => void
}

function ProofCard({ aspect, slides, proof, checked, onToggle }: ProofCardProps) {
  const { w, h, exportName } = FORMATS[aspect]
  // Only a proof that arrives while the card is shown develops; one already drawn just appears.
  const [develops] = useState(!proof)
  return (
    <label className={checked ? 'proof-card active' : 'proof-card'}>
      <input type="checkbox" className="visually-hidden" checked={checked} onChange={onToggle} />
      <span className="proof-frame" style={{ aspectRatio: `${w * slides} / ${h}` }}>
        {proof && <img src={proof} alt="" className={develops ? 'develops' : undefined} />}
        {checked && <IconCheckCircle className="proof-check" />}
      </span>
      <span className="proof-name">{exportName}</span>
      <span className="proof-meta">
        {w}×{h}
        {slides > 1 && ` · ${slides} ${plural(slides, 'slajd', 'slajdy', 'slajdów')}`}
      </span>
    </label>
  )
}

function ElementStateRow({ name, manual }: { name: string; manual: boolean }) {
  return (
    <li className={manual ? 'manual' : undefined}>
      <span>{name}</span>
      <span className="element-state-tag">{manual ? 'Ręcznie' : 'Auto'}</span>
    </li>
  )
}

function CanvasElementStateRow({ def, manual }: { def: CanvasElementDefinition; manual: boolean }) {
  return def.useIsAvailable() ? <ElementStateRow name={def.label} manual={manual} /> : null
}

function FormatLayoutSection() {
  const atRest = useStoreAtRest()
  const { aspectKey, texts } = atRest
  const resetFormatLayout = useAppStore((s) => s.resetFormatLayout)
  const flags = manualFlags(atRest)
  const manual = hasManualLayout(flags)

  if (aspectKey === SOURCE_ASPECT) return null

  const rows = [
    ...texts.map((t) => ({ key: `t${t.id}`, name: t.icon ? `Ikona ${iconById(t.icon)?.label ?? ''}` : `Napis „${t.text.replace(/\s+/g, ' ').slice(0, 24)}”`, manual: Boolean(flags.texts[t.id]) })),
    { key: 'route', name: 'Trasa', manual: flags.route },
  ]

  return (
    <Section title={`Układ w ${aspectKey}`} collapseId="export-layout" startCollapsed>
      <ul className="element-states">
        {canvasElements().map((def) => (
          <CanvasElementStateRow key={def.kind} def={def} manual={Boolean(flags.elements[def.kind])} />
        ))}
        {rows.map((row) => (
          <ElementStateRow key={row.key} name={row.name} manual={row.manual} />
        ))}
      </ul>
      <Button disabled={!manual} onClick={resetFormatLayout}>
        Przywróć układ automatyczny
      </Button>
      <p className="hint">Elementy „Ręcznie” zachowują tu swoją pozycję, „Auto” układają się według {SOURCE_ASPECT}.</p>
    </Section>
  )
}

// Drawn once per opening, so moving between Obraz and Wideo doesn't run the editor through the formats again.
const ProofsContext = createContext<Partial<Record<AspectKey, string>>>({})

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const proofs = useFormatProofs(FORMAT_ORDER)
  return (
    <Dialog title="Pobierz" onClose={onClose} className="export-dialog" closeButton>
      <ProofsContext value={proofs}>
        <SubTabs tab="export" own={[{ id: 'image', label: 'Obraz', Component: ImageExport }]} />
      </ProofsContext>
    </Dialog>
  )
}

function ImageExport() {
  const hasRoute = useHasRoute()
  const hasBackground = useHasBackground()
  const inkIsDark = useInkIsDark()
  const exporting = useAppStore((s) => s.exporting)
  const { aspectKey, slides, parkedSlides } = useStoreAtRest()
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const [downloading, setDownloading] = useState(false)
  const photos = useAppStore((s) => s.photos)
  const points = useAppStore((s) => selectTrack(s)?.points ?? null)
  const proofs = use(ProofsContext)
  const [chosenFormat, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<Scale>('1')
  const [picked, setPicked] = useState<AspectKey[]>([aspectKey])
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const { w, h } = FORMATS[aspectKey]
  // JPG has no transparency — only makes sense over a photo.
  const format: ExportFormat = hasBackground ? chosenFormat : 'png'
  const fileScale = scale === '2' ? 2 : 1
  const baseName = trackName ?? (hasRoute ? null : 'kolaz')
  const formats = FORMAT_ORDER.filter((f) => picked.includes(f))
  const slidesIn = (f: AspectKey) => slideCountIn({ slides, parkedSlides }, f)
  const fileNames = formats.flatMap((f) => exportFileNames(format, fileScale, f, baseName, slidesIn(f)))
  const hasContent = hasRoute || hasBackground
  const canExport = hasContent && formats.length > 0 && !exporting
  const warnings = seriesWarnings(slides, new Map(photos.map((p) => [p.id, p])), points)
  const zipped = fileNames.length > 1
  const summary = !hasContent
    ? 'Dodaj zdjęcia lub plik GPX, aby móc pobrać grafikę.'
    : zipped
      ? `${filesLabel(fileNames.length)} w jednym ZIP`
      : (fileNames[0] ?? 'Zaznacz co najmniej jeden format.')

  const scaleOptions: SelectOption<Scale>[] = [
    { value: '1', label: `${w}×${h}` },
    { value: '2', label: `${w * 2}×${h * 2}` },
  ]

  function toggle(aspect: AspectKey) {
    setResult(null)
    setPicked((current) => (current.includes(aspect) ? current.filter((a) => a !== aspect) : [...current, aspect]))
  }

  async function download() {
    setResult(null)
    setDownloading(true)
    try {
      await exportProject(formats, fileScale, format, baseName)
      setResult({ ok: true, text: `Gotowe: ${zipped ? `${filesLabel(fileNames.length)} w ZIP` : fileNames[0]} w pobranych plikach.` })
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'nieznany błąd'
      setResult({ ok: false, text: `Nie udało się pobrać (${reason}). Spróbuj ponownie albo wybierz mniejszą rozdzielczość.` })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="export-layout">
        <section className={inkIsDark ? 'export-sheet light-checker' : 'export-sheet'} aria-label="Formaty">
          <div className="proof-grid">
            {FORMAT_ORDER.map((f) => (
              <ProofCard key={f} aspect={f} slides={slidesIn(f)} proof={proofs[f]} checked={picked.includes(f)} onToggle={() => toggle(f)} />
            ))}
          </div>
          <p className="hint">Kliknij kadr, żeby go dodać lub usunąć. Napisy i trasa układają się same w każdym formacie, a story omija strefy interfejsu.</p>
        </section>

        <div className="export-settings">
          <Section title="Plik">
            <Segmented label="Rozdzielczość" value={scale} options={scaleOptions} onChange={setScale} />
            <Segmented label="Format pliku" value={format} options={FORMAT_OPTIONS} onChange={setFormat} disabled={!hasBackground} />
            <p className="hint">
              {hasBackground
                ? 'JPG jest mniejszy, PNG zachowuje pełną jakość.'
                : 'Bez zdjęcia tła zapisujemy przezroczysty PNG — nałożysz go na zdjęcie w Instagramie.'}
            </p>
          </Section>

          {zipped && (
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

          <FormatLayoutSection />
        </div>
      </div>

      <footer className="export-footer">
        {result ? (
          <p className={result.ok ? 'export-result' : 'export-result is-error'} role={result.ok ? 'status' : 'alert'}>
            {result.ok ? <IconCheckCircle /> : <IconAlert />}
            {result.text}
          </p>
        ) : (
          <p className="export-result" role="status">
            {summary}
          </p>
        )}
        <Button variant="primary" icon={<IconDownload />} disabled={!canExport} onClick={download}>
          {downloading ? 'Przygotowuję…' : zipped ? 'Pobierz ZIP' : `Pobierz ${format.toUpperCase()}`}
        </Button>
      </footer>
    </>
  )
}
