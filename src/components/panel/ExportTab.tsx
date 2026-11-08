import { createContext, use, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { IconAlert, IconCheckCircle, IconDownload } from '../icons'
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

interface ProofCardProps {
  aspect: AspectKey
  slides: number
  proof?: string
  checked: boolean
  onToggle: () => void
}

function ProofCard({ aspect, slides, proof, checked, onToggle }: ProofCardProps) {
  const { t } = useTranslation()
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
      <span className="proof-name">{t(exportName)}</span>
      <span className="proof-meta">
        {w}×{h}
        {slides > 1 && ` · ${t('exportTab.slides', { count: slides })}`}
      </span>
    </label>
  )
}

function ElementStateRow({ name, manual }: { name: string; manual: boolean }) {
  const { t } = useTranslation()
  return (
    <li className={manual ? 'manual' : undefined}>
      <span>{name}</span>
      <span className="element-state-tag">{manual ? t('exportTab.manual') : t('exportTab.auto')}</span>
    </li>
  )
}

function CanvasElementStateRow({ def, manual }: { def: CanvasElementDefinition; manual: boolean }) {
  const { t } = useTranslation()
  return def.useIsAvailable() ? <ElementStateRow name={t(def.label)} manual={manual} /> : null
}

function FormatLayoutSection() {
  const { t } = useTranslation()
  const atRest = useStoreAtRest()
  const { aspectKey, texts } = atRest
  const resetFormatLayout = useAppStore((s) => s.resetFormatLayout)
  const flags = manualFlags(atRest)
  const manual = hasManualLayout(flags)

  if (aspectKey === SOURCE_ASPECT) return null

  const rows = [
    ...texts.map((text) => {
      const icon = text.icon && iconById(text.icon)
      const name = text.icon ? t('exportTab.iconRow', { name: icon ? t(icon.label) : '' }) : t('exportTab.textRow', { text: text.text.replace(/\s+/g, ' ').slice(0, 24) })
      return { key: `t${text.id}`, name, manual: Boolean(flags.texts[text.id]) }
    }),
    { key: 'route', name: t('exportTab.route'), manual: flags.route },
  ]

  return (
    <Section title={t('exportTab.layoutIn', { aspect: aspectKey })} collapseId="export-layout" startCollapsed>
      <ul className="element-states">
        {canvasElements().map((def) => (
          <CanvasElementStateRow key={def.kind} def={def} manual={Boolean(flags.elements[def.kind])} />
        ))}
        {rows.map((row) => (
          <ElementStateRow key={row.key} name={row.name} manual={row.manual} />
        ))}
      </ul>
      <Button disabled={!manual} onClick={resetFormatLayout}>
        {t('exportTab.resetLayout')}
      </Button>
      <p className="hint">{t('exportTab.layoutHint', { aspect: SOURCE_ASPECT })}</p>
    </Section>
  )
}

// Drawn once per opening, so moving between Obraz and Wideo doesn't run the editor through the formats again.
const ProofsContext = createContext<Partial<Record<AspectKey, string>>>({})

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const proofs = useFormatProofs(FORMAT_ORDER)
  return (
    <Dialog title={t('exportTab.download')} onClose={onClose} className="export-dialog" closeButton>
      <ProofsContext value={proofs}>
        <SubTabs tab="export" own={[{ id: 'image', label: 'exportTab.image', Component: ImageExport }]} />
      </ProofsContext>
    </Dialog>
  )
}

function ImageExport() {
  const { t } = useTranslation()
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
    ? t('exportTab.noContent')
    : zipped
      ? t('exportTab.filesInOneZip', { count: fileNames.length })
      : (fileNames[0] ?? t('exportTab.pickFormat'))

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
      setResult({ ok: true, text: t('exportTab.done', { what: zipped ? t('exportTab.filesInZip', { count: fileNames.length }) : fileNames[0] }) })
    } catch (err) {
      const reason = err instanceof Error ? err.message : t('exportTab.unknownError')
      setResult({ ok: false, text: t('exportTab.failed', { reason }) })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="export-layout">
        <section className={inkIsDark ? 'export-sheet light-checker' : 'export-sheet'} aria-label={t('exportTab.formats')}>
          <div className="proof-grid">
            {FORMAT_ORDER.map((f) => (
              <ProofCard key={f} aspect={f} slides={slidesIn(f)} proof={proofs[f]} checked={picked.includes(f)} onToggle={() => toggle(f)} />
            ))}
          </div>
          <p className="hint">{t('exportTab.formatsHint')}</p>
        </section>

        <div className="export-settings">
          <Section title={t('exportTab.file')}>
            <Segmented label={t('exportTab.resolution')} value={scale} options={scaleOptions} onChange={setScale} />
            <Segmented label={t('exportTab.fileFormat')} value={format} options={FORMAT_OPTIONS} onChange={setFormat} disabled={!hasBackground} />
            <p className="hint">
              {hasBackground
                ? t('exportTab.jpgHint')
                : t('exportTab.transparentHint')}
            </p>
          </Section>

          {zipped && (
            <Section title={t('exportTab.files')}>
              <ul className="export-files">
                {fileNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Section>
          )}

          {warnings.length > 0 && (
            <Section title={t('exportTab.toCheck')}>
              <ul className="export-files export-warnings">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="hint">{t('exportTab.warningsHint')}</p>
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
          {downloading ? t('exportTab.preparing') : t('exportTab.downloadFormat', { format: zipped ? 'ZIP' : format.toUpperCase() })}
        </Button>
      </footer>
    </>
  )
}
