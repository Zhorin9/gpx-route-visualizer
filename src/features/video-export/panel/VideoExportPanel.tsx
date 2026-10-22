import { useEffect, useRef, useState } from 'react'
import CheckboxField from '../../../components/fields/CheckboxField'
import Button from '../../../components/ui/Button'
import Section from '../../../components/ui/Section'
import Segmented from '../../../components/ui/Segmented'
import { IconCheckCircle, IconDownload } from '../../../components/icons'
import { useVideoEncoding, type EncodeQuality, type FormatSupport, type VideoFormat } from '../../../services/video-encoding'
import { useHasBackground, useHasRoute } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { archiveBaseName, downloadFiles, type ExportFile } from '../../../utils/exportImage'
import { formatNumber } from '../../../utils/format'
import { FORMAT_ORDER } from '../../../utils/reflow'
import { totalDuration } from '../../animation/model/timeline'
import { formatTime } from '../../animation/ui/formatTime'
import { frameCount, outputSize, renderThumbnails, renderVideo, type VideoJob, type VideoProgress } from '../exportVideo'
import { selectTrack } from '../../../store/derived'
import type { AspectKey, SelectOption } from '../../../types'
import './VideoExportPanel.css'

const FORMAT_LABELS: Record<VideoFormat, string> = { mp4: 'MP4', webm: 'WebM', gif: 'GIF' }
const ASPECT_LABELS: Record<AspectKey, string> = { '9:16': 'Story / Reels 9:16', '4:5': 'Post 4:5', '1:1': 'Kwadrat 1:1' }
const FPS: Record<VideoFormat, number[]> = { mp4: [24, 30, 60], webm: [24, 30, 60], gif: [10, 15, 20] }
const QUALITY_OPTIONS: SelectOption<EncodeQuality>[] = [
  { value: 'low', label: 'Niska' },
  { value: 'medium', label: 'Średnia' },
  { value: 'high', label: 'Wysoka' },
]
const REPEAT_OPTIONS: SelectOption<string>[] = ['1', '2', '3'].map((v) => ({ value: v, label: `${v}×` }))
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
  const animation = useAppStore((s) => s.animation)
  const track = useAppStore(selectTrack)
  const [thumbs, setThumbs] = useState<string[]>([])

  // Re-rendered when what the frames show can change; not while another export is running.
  useEffect(() => {
    let live = true
    const timer = setTimeout(() => {
      if (useAppStore.getState().exporting) return
      renderThumbnails(job.aspect, THUMBS, THUMB_H)
        .then((t) => live && setThumbs(t))
        .catch(() => live && setThumbs([]))
    }, 250)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [job.aspect, animation, track])

  if (!thumbs.length) return null
  const total = totalDuration(animation)
  return (
    <div className="video-thumbs" aria-label="Klatki animacji">
      {thumbs.map((src, i) => (
        <figure key={i} className="video-thumb">
          <img src={src} alt="" />
          <figcaption>{formatTime((total * (i + 1)) / THUMBS)}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function AnimationOff() {
  const setSubTab = useAppStore((s) => s.setSubTab)
  return (
    <Section title="Wideo">
      <p className="hint">Film zapisuje animację trasy, a ta jest wyłączona. Włącz ją w podzakładce „Animacja”.</p>
      <Button block onClick={() => setSubTab('export', 'animation')}>
        Przejdź do animacji
      </Button>
    </Section>
  )
}

export default function VideoExportPanel() {
  const service = useVideoEncoding()
  const hasRoute = useHasRoute()
  const hasBackground = useHasBackground()
  const currentAspect = useAppStore((s) => s.aspectKey)
  const animation = useAppStore((s) => s.animation)
  const trackName = useAppStore((s) => selectTrack(s)?.name ?? null)
  const slideCount = useAppStore((s) => s.slides.length)
  const showToast = useAppStore((s) => s.showToast)
  const [job, setJob] = useState<VideoJob>({ format: 'mp4', aspect: currentAspect, fps: 30, repeat: 1, loopForever: true, quality: 'medium' })
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const { width, height } = outputSize(job)
  const support = useFormatSupport(width, height, job.fps)
  const duration = totalDuration(animation)
  const tooLong = duration * (job.format === 'gif' ? 1 : job.repeat) > MAX_SECONDS
  const formatOk = support?.find((s) => s.format === job.format)?.supported ?? false

  if (!hasRoute) return <p className="hint">Wgraj plik GPX, aby zapisać animację trasy.</p>
  if (!animation.enabled) return <AnimationOff />

  const update = (patch: Partial<VideoJob>) => {
    setJob((j) => {
      const next = { ...j, ...patch }
      if (!FPS[next.format].includes(next.fps)) next.fps = FPS[next.format][1]
      return next
    })
    setPhase({ kind: 'idle' })
  }

  const formatOptions: SelectOption<VideoFormat>[] = (['mp4', 'webm', 'gif'] as const).map((f) => ({ value: f, label: FORMAT_LABELS[f] }))
  const unsupported = support?.filter((s) => !s.supported) ?? []
  const estimate = service.estimateBytes({ format: job.format, width, height, fps: job.fps, loopCount: 0, quality: job.quality }, duration * (job.format === 'gif' ? 1 : job.repeat)) * slideCount

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
        showToast(`Eksport nie powiódł się: ${reason}`, { label: 'Spróbuj ponownie', run: start }, true)
      }
    } finally {
      abortRef.current = null
    }
  }

  const rendering = phase.kind === 'rendering'
  const pct = rendering ? Math.round((phase.progress.done / Math.max(1, phase.progress.total)) * 100) : 0

  return (
    <>
      <Section title="Plik wideo">
        <Segmented label="Format" showLabel value={job.format} options={formatOptions} onChange={(format) => update({ format })} disabled={rendering} />
        {unsupported.map((s) => (
          <p key={s.format} className="hint">
            {FORMAT_LABELS[s.format]}: {s.reason}.
          </p>
        ))}
        <Segmented
          label="Proporcje"
          showLabel
          value={job.aspect}
          options={FORMAT_ORDER.map((a) => ({ value: a, label: ASPECT_LABELS[a] }))}
          onChange={(aspect) => update({ aspect })}
          disabled={rendering}
        />
        <Segmented
          label="Klatki na sekundę"
          showLabel
          value={String(job.fps)}
          options={FPS[job.format].map((f) => ({ value: String(f), label: `${f} fps` }))}
          onChange={(v) => update({ fps: Number(v) })}
          disabled={rendering}
        />
        {job.format === 'gif' ? (
          <CheckboxField label="Zapętlaj bez końca" checked={job.loopForever} onChange={(loopForever) => update({ loopForever })} disabled={rendering} />
        ) : (
          <>
            <Segmented label="Jakość" showLabel value={job.quality} options={QUALITY_OPTIONS} onChange={(quality) => update({ quality })} disabled={rendering} />
            <Segmented label="Powtórz w pliku" showLabel value={String(job.repeat)} options={REPEAT_OPTIONS} onChange={(v) => update({ repeat: Number(v) })} disabled={rendering} />
          </>
        )}
        {!hasBackground && job.format !== 'gif' && <p className="hint">Bez zdjęcia ani gradientu tło filmu będzie czarne.</p>}
      </Section>

      <Section title="Podgląd">
        <Thumbnails job={job} />
        <dl className="video-summary">
          <div>
            <dt>Długość</dt>
            <dd>{formatTime(duration * (job.format === 'gif' ? 1 : job.repeat))}</dd>
          </div>
          <div>
            <dt>Rozmiar klatki</dt>
            <dd>
              {width}×{height}
            </dd>
          </div>
          <div>
            <dt>Szacowany plik</dt>
            <dd>~{formatBytes(estimate)}</dd>
          </div>
        </dl>
        {slideCount > 1 && <p className="hint">Karuzela: osobny plik dla każdego z {slideCount} slajdów, razem w ZIP.</p>}
        {tooLong && <p className="error">Film jest dłuższy niż minuta — Instagram go przytnie. Skróć oś czasu lub liczbę powtórzeń.</p>}

        {rendering ? (
          <div className="render-state" role="status">
            <div className="render-head">
              <span className="render-title">Renderowanie wideo</span>
              <span>{pct}%</span>
            </div>
            <div className="render-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="render-meta">
              <span>
                Klatka {phase.progress.done} / {phase.progress.total}
              </span>
              {phase.etaS != null && <span>Pozostało ok. {Math.ceil(phase.etaS)} s</span>}
            </div>
            <Button onClick={() => abortRef.current?.abort()}>Anuluj</Button>
          </div>
        ) : phase.kind === 'done' ? (
          <div className="render-state" role="status">
            <div className="render-head">
              <IconCheckCircle />
              <span className="render-title">Wideo gotowe</span>
            </div>
            <p className="render-meta">
              {phase.files.length === 1 ? phase.files[0].name : `${phase.files.length} pliki w ZIP`} · {job.aspect} · {width} × {height} ·{' '}
              {formatNumber(duration * (job.format === 'gif' ? 1 : job.repeat), 1)} s · {formatBytes(phase.files.reduce((s, f) => s + f.blob.size, 0))}
            </p>
            <div className="button-row">
              <Button variant="primary" icon={<IconDownload />} onClick={() => downloadFiles(phase.files, archiveBaseName(trackName))}>
                Pobierz ponownie
              </Button>
              <Button variant="ghost" onClick={() => setPhase({ kind: 'idle' })}>
                Zamknij
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="primary" block disabled={!formatOk || tooLong || !support} onClick={start}>
            Renderuj {FORMAT_LABELS[job.format]}
          </Button>
        )}
      </Section>
    </>
  )
}
