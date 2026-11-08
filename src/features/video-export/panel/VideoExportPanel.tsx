import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CheckboxField from '../../../components/fields/CheckboxField'
import SliderField from '../../../components/fields/SliderField'
import Button from '../../../components/ui/Button'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { IconCheckCircle, IconDownload } from '../../../components/icons'
import { useVideoEncoding, type EncodeQuality, type FormatSupport, type VideoFormat } from '../../../services/video-encoding'
import { useHasBackground, useInkIsDark } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { archiveBaseName, downloadFiles, type ExportFile } from '../../../utils/exportImage'
import { formatNumber } from '../../../utils/format'
import { FORMATS, FORMAT_ORDER } from '../../../core/formats/registry'
import { slideCountIn } from '../../../utils/reflow'
import { selectDuration } from '../../animation/model/timeline'
import { useCanAnimate } from '../../animation/hooks'
import { formatTime } from '../../animation/ui/formatTime'
import { frameCount, outputSize, playsInFile, renderThumbnails, renderVideo, type VideoJob, type VideoProgress } from '../exportVideo'
import { selectTrack } from '../../../store/derived'
import { DEFAULT_INSET, type CardInset, type InsetCorner } from '../cardInset'
import type { SelectOption } from '../../../types'
import type { TKey } from '../../../i18n'
import './VideoExportPanel.css'

const FORMAT_LABELS: Record<VideoFormat, TKey> = { mp4: 'videoExport.formats.mp4', webm: 'videoExport.formats.webm', gif: 'videoExport.formats.gif', png: 'videoExport.formats.png' }
const FPS: Record<VideoFormat, number[]> = { mp4: [24, 30, 60], webm: [24, 30, 60], gif: [10, 15, 20], png: [24, 25, 30] }
const QUALITIES: EncodeQuality[] = ['low', 'medium', 'high']
const VIDEO_FORMATS: VideoFormat[] = ['mp4', 'webm', 'gif', 'png']
const REPEAT_OPTIONS: SelectOption<string>[] = ['1', '2', '3'].map((v) => ({ value: v, label: `${v}×` }))
const CORNERS: InsetCorner[] = ['tl', 'tr', 'bl', 'br']
const THUMBS = 6
const THUMB_H = 150
// Reels and stories cap at a minute.
const MAX_SECONDS = 60

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${formatNumber(bytes / 1024 / 1024, 1)} MB`
  return `${formatNumber(Math.max(1, Math.round(bytes / 1024)))} kB`
}

type Phase = { kind: 'idle' } | { kind: 'rendering'; progress: VideoProgress; etaS: number | null } | { kind: 'done'; files: ExportFile[] }

function useFormatSupport(width: number, height: number, fps: number) {
  const service = useVideoEncoding()
  const [support, setSupport] = useState<FormatSupport[] | null>(null)
  useEffect(() => {
    let live = true
    service.capabilities(width, height, fps).then((s) => live && setSupport(s))
    return () => {
      live = false
    }
  }, [service, width, height, fps])
  return support
}

function Thumbnails({ job }: { job: VideoJob }) {
  const { t } = useTranslation()
  const animation = useAppStore((s) => s.animation)
  const track = useAppStore(selectTrack)
  // Set from this panel too, for a card.
  const wrapper = useAppStore((s) => s.wrapper)
  const [thumbs, setThumbs] = useState<string[]>([])

  // Re-rendered when what the frames show can change; not while another export is running.
  useEffect(() => {
    let live = true
    const timer = setTimeout(() => {
      if (useAppStore.getState().exporting) return
      renderThumbnails(job, THUMBS, THUMB_H)
        .then((t) => live && setThumbs(t))
        .catch(() => live && setThumbs([]))
    }, 250)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [job, animation, track, wrapper])

  if (!thumbs.length) return null
  const total = selectDuration(useAppStore.getState())
  return (
    <div className="video-thumbs" aria-label={t('videoExport.frames')}>
      {thumbs.map((src, i) => (
        <figure key={i} className={job.format === 'png' ? 'video-thumb see-through' : 'video-thumb'}>
          <img src={src} alt="" />
          <figcaption>{formatTime((total * (i + 1)) / THUMBS)}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function InsetFields({ inset, onChange, disabled }: { inset: CardInset; onChange: (inset: CardInset) => void; disabled: boolean }) {
  const { t } = useTranslation()
  const noWrapper = useAppStore((s) => s.wrapper.id === 'none')
  const setWrapper = useAppStore((s) => s.setWrapper)
  return (
    <>
      <div className="video-wide">
        <Segmented
          label={t('videoExport.footageFrame')}
          showLabel
          value={inset.frame}
          options={FORMAT_ORDER.map((a) => ({ value: a, label: t(FORMATS[a].exportName) }))}
          onChange={(frame) => onChange({ ...inset, frame })}
          disabled={disabled}
        />
      </div>
      <Segmented label={t('videoExport.corner')} showLabel value={inset.corner} options={CORNERS.map((value) => ({ value, label: t(`videoExport.corners.${value}`) }))} onChange={(corner) => onChange({ ...inset, corner })} disabled={disabled} />
      <SliderField
        label={t('videoExport.cardSize')}
        value={Math.round(inset.size * 100)}
        min={30}
        max={90}
        unit="%"
        defaultValue={DEFAULT_INSET.size * 100}
        onChange={(v) => onChange({ ...inset, size: v / 100 })}
        disabled={disabled}
      />
      {noWrapper && (
        <>
          <p className="hint video-wide">{t('videoExport.cardHint')}</p>
          <Button onClick={() => setWrapper('postcard')} disabled={disabled}>
            {t('videoExport.addPostcard')}
          </Button>
        </>
      )}
      <p className="hint video-wide">{t('videoExport.cardMotionHint')}</p>
    </>
  )
}

function AnimationOff() {
  const { t } = useTranslation()
  return (
    <Section title={t('videoExport.section')}>
      <p className="hint">{t('videoExport.animationOff')}</p>
    </Section>
  )
}

export default function VideoExportPanel() {
  const { t } = useTranslation()
  const service = useVideoEncoding()
  const canAnimate = useCanAnimate()
  const collage = useAppStore((s) => s.mode === 'collage')
  const hasBackground = useHasBackground()
  const inkIsDark = useInkIsDark()
  const onMap = useAppStore((s) => s.collage.bgKind === 'map')
  const currentAspect = useAppStore((s) => s.aspectKey)
  const animation = useAppStore((s) => s.animation)
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const showToast = useAppStore((s) => s.showToast)
  const [job, setJob] = useState<VideoJob>({ format: 'mp4', aspect: currentAspect, fps: 30, repeat: 1, loopForever: true, quality: 'medium', scale: 1, inset: null })
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const slideCount = useAppStore((s) => slideCountIn(s, job.aspect))
  const abortRef = useRef<AbortController | null>(null)

  const { width, height } = outputSize(job)
  const support = useFormatSupport(width, height, job.fps)
  const duration = useAppStore(selectDuration)
  const length = duration * playsInFile(job)
  const tooLong = length > MAX_SECONDS
  const formatOk = support?.find((s) => s.format === job.format)?.supported ?? false

  if (!canAnimate) return <p className="hint">{t(collage ? 'videoExport.needPhotos' : 'videoExport.needGpx')}</p>
  if (!animation.enabled) return <AnimationOff />

  const update = (patch: Partial<VideoJob>) => {
    setJob((j) => {
      const next = { ...j, ...patch }
      if (!FPS[next.format].includes(next.fps)) next.fps = FPS[next.format][1]
      if (next.format !== 'png') next.inset = null
      return next
    })
    setPhase({ kind: 'idle' })
  }

  const unsupported = support?.filter((s) => !s.supported) ?? []
  const estimate = service.estimateBytes({ format: job.format, width, height, fps: job.fps, loopCount: 0, quality: job.quality }, length) * slideCount

  async function start() {
    const controller = new AbortController()
    abortRef.current = controller
    const startedAt = performance.now()
    setPhase({ kind: 'rendering', progress: { done: 0, total: frameCount(job, duration) }, etaS: null })
    const onProgress = (progress: VideoProgress) => {
      const perFrame = (performance.now() - startedAt) / progress.done
      setPhase({ kind: 'rendering', progress, etaS: progress.done > 2 ? (perFrame * (progress.total - progress.done)) / 1000 : null })
    }
    try {
      const files = await renderVideo(service, job, trackName, onProgress, controller.signal)
      setPhase({ kind: 'done', files })
      downloadFiles(files, archiveBaseName(trackName))
    } catch (e) {
      setPhase({ kind: 'idle' })
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        const reason = e instanceof Error ? e.message : String(e)
        showToast(t('videoExport.failed', { reason }), { label: t('videoExport.retry'), run: start }, true)
      }
    } finally {
      abortRef.current = null
    }
  }

  const rendering = phase.kind === 'rendering'
  const pct = rendering ? Math.round((phase.progress.done / Math.max(1, phase.progress.total)) * 100) : 0

  return (
    <>
      <div className="export-layout video-layout">
        <section className={inkIsDark ? 'export-sheet video-preview light-checker' : 'export-sheet video-preview'} aria-label={t('videoExport.preview')}>
          <Thumbnails job={job} />
          <dl className="video-summary">
            <div>
              <dt>{t('videoExport.length')}</dt>
              <dd>{formatTime(length)}</dd>
            </div>
            <div>
              <dt>{t('videoExport.frameSize')}</dt>
              <dd>
                {width}×{height}
              </dd>
            </div>
            <div>
              <dt>{t('videoExport.file')}</dt>
              <dd>~{formatBytes(estimate)}</dd>
            </div>
          </dl>
          {slideCount > 1 && <p className="hint">{t('videoExport.carousel', { slides: slideCount })}</p>}
        </section>

        <div className="video-settings">
          <Segmented label={t('videoExport.format')} showLabel value={job.format} options={VIDEO_FORMATS.map((value) => ({ value, label: t(FORMAT_LABELS[value]) }))} onChange={(format) => update({ format })} disabled={rendering} />
          <Segmented
            label={t('videoExport.fps')}
            showLabel
            value={String(job.fps)}
            options={FPS[job.format].map((f) => ({ value: String(f), label: `${f} fps` }))}
            onChange={(v) => update({ fps: Number(v) })}
            disabled={rendering}
          />
          {unsupported.map((s) => (
            <p key={s.format} className="hint video-wide">
              {t(FORMAT_LABELS[s.format])}: {s.reason}.
            </p>
          ))}
          <div className="video-wide">
            <Segmented
              label={t(job.inset ? 'videoExport.cardAspect' : 'videoExport.aspect')}
              showLabel
              value={job.aspect}
              options={FORMAT_ORDER.map((a) => ({ value: a, label: t(FORMATS[a].exportName) }))}
              onChange={(aspect) => update({ aspect })}
              disabled={rendering}
            />
          </div>
          {job.format !== 'gif' && (
            <Segmented
              label={t('videoExport.resolution')}
              showLabel
              value={String(job.scale)}
              options={([1, 2] as const).map((s) => {
                const frame = FORMATS[job.inset?.frame ?? job.aspect]
                return { value: String(s), label: `${frame.w * s}×${frame.h * s}${s === 2 ? ' (4K)' : ''}` }
              })}
              onChange={(v) => update({ scale: v === '2' ? 2 : 1 })}
              disabled={rendering}
            />
          )}
          {job.format === 'gif' ? (
            <CheckboxField label={t('videoExport.loopForever')} checked={job.loopForever} onChange={(loopForever) => update({ loopForever })} disabled={rendering} />
          ) : job.format === 'png' ? (
            <>
              <Segmented
                label={t('videoExport.overlay')}
                showLabel
                value={job.inset ? 'card' : 'full'}
                options={[
                  { value: 'full', label: t('videoExport.fullFrame') },
                  { value: 'card', label: t('videoExport.cornerCard') },
                ]}
                onChange={(v) => update({ inset: v === 'card' ? DEFAULT_INSET : null })}
                disabled={rendering}
              />
              {job.inset ? (
                <InsetFields inset={job.inset} onChange={(inset) => update({ inset })} disabled={rendering} />
              ) : (
                <p className="hint video-wide">
                  {hasBackground
                    ? t('videoExport.opaqueBackground')
                    : t('videoExport.pngHint')}
                </p>
              )}
            </>
          ) : (
            <>
              <Segmented label={t('videoExport.quality')} showLabel value={job.quality} options={QUALITIES.map((value) => ({ value, label: t(`videoExport.qualities.${value}`) }))} onChange={(quality) => update({ quality })} disabled={rendering} />
              <Segmented label={t('videoExport.repeat')} showLabel value={String(job.repeat)} options={REPEAT_OPTIONS} onChange={(v) => update({ repeat: Number(v) })} disabled={rendering} />
            </>
          )}
          {!hasBackground && (job.format === 'mp4' || job.format === 'webm') && <p className="hint video-wide">{t('videoExport.blackBackground')}</p>}
          {onMap && <p className="hint video-wide">{t('videoExport.mapSlow')}</p>}
        </div>
      </div>

      <footer className="export-footer">
        {rendering ? (
          <div className="video-progress" role="status">
            <div className="render-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <span>
              {t('videoExport.progress', { pct, done: phase.progress.done, total: phase.progress.total })}
              {phase.etaS != null && t('videoExport.eta', { seconds: Math.ceil(phase.etaS) })}
            </span>
          </div>
        ) : phase.kind === 'done' ? (
          <p className="export-result" role="status">
            <IconCheckCircle />
            {t('videoExport.done', { name: phase.files.length === 1 ? phase.files[0].name : t('videoExport.filesInZip', { count: phase.files.length }) })} · {formatNumber(length, 1)} s ·{' '}
            {formatBytes(phase.files.reduce((s, f) => s + f.blob.size, 0))}
          </p>
        ) : tooLong ? (
          <p className="export-result is-error" role="alert">
            {t('videoExport.tooLong')}
          </p>
        ) : (
          <p className="export-result">
            {t(FORMAT_LABELS[job.format])} · {formatTime(length)} · ~{formatBytes(estimate)}
          </p>
        )}
        {rendering ? (
          <Button onClick={() => abortRef.current?.abort()}>{t('videoExport.cancel')}</Button>
        ) : phase.kind === 'done' ? (
          <Button variant="primary" icon={<IconDownload />} onClick={() => downloadFiles(phase.files, archiveBaseName(trackName))}>
            {t('videoExport.downloadAgain')}
          </Button>
        ) : (
          <Button variant="primary" icon={<IconDownload />} disabled={!formatOk || tooLong || !support} onClick={start}>
            {t('videoExport.render', { format: t(FORMAT_LABELS[job.format]) })}
          </Button>
        )}
      </footer>
    </>
  )
}
