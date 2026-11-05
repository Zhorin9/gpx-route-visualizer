import { beginStageFrames, type FrameSource } from '../../core/export/frameSource'
import type { EncodeQuality, EncodingSession, VideoEncodingService, VideoFormat } from '../../services/video-encoding'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../../core/formats/registry'
import { cropSlide, exportFileNames, type ExportFile } from '../../utils/exportImage'
import { exportedSlides } from '../../utils/series'
import { selectDuration } from '../animation/model/timeline'
import type { AspectKey } from '../../types'
import { cardRect, drawCardInset, type CardInset } from './cardInset'

export interface VideoJob {
  format: VideoFormat
  aspect: AspectKey
  fps: number
  // MP4/WebM: the animation is written this many times in a row.
  repeat: number
  // GIF: loops forever, or plays once.
  loopForever: boolean
  quality: EncodeQuality
  // MP4, WebM and PNG: 2 doubles the frame, to 4K (2160 px on the short side).
  scale: 1 | 2
  // PNG only: the design as a card in a corner of the footage's frame, instead of the whole frame.
  inset?: CardInset | null
}

export const playsInFile = (job: Pick<VideoJob, 'format' | 'repeat'>) => (job.format === 'mp4' || job.format === 'webm' ? Math.max(1, job.repeat) : 1)

export interface VideoProgress {
  done: number
  total: number
}

// GIFs are written at half size: a full-size GIF is huge and gains little on a phone.
const outputScale = (job: Pick<VideoJob, 'format' | 'scale'>) => (job.format === 'gif' ? 0.5 : job.scale)

const frameOf = (job: Pick<VideoJob, 'aspect' | 'inset'>) => FORMATS[job.inset?.frame ?? job.aspect]

export function outputSize(job: Pick<VideoJob, 'format' | 'aspect' | 'scale' | 'inset'>) {
  const scale = outputScale(job)
  return { width: Math.round(frameOf(job).w * scale), height: Math.round(frameOf(job).h * scale) }
}

// `k`: the file's size as a multiple of the full frame.
function designScale(job: VideoJob, k: number): number {
  return job.inset ? (k * cardRect(job.inset, job.aspect).w) / FORMATS[job.aspect].w : k
}

function slideFrame(ribbon: HTMLCanvasElement, job: VideoJob, slide: number, k: number, t: number, duration: number, target: { card?: HTMLCanvasElement; out?: HTMLCanvasElement } = {}) {
  const card = cropSlide(ribbon, slide, job.aspect, designScale(job, k), target.card)
  if (!job.inset) return card
  const out = target.out ?? document.createElement('canvas')
  const width = Math.round(frameOf(job).w * k)
  const height = Math.round(frameOf(job).h * k)
  if (out.width !== width) out.width = width
  if (out.height !== height) out.height = height
  drawCardInset(out, card, job.inset, job.aspect, t, duration)
  return out
}

function animationLength(): number {
  return selectDuration(useAppStore.getState())
}

export function frameCount(job: Pick<VideoJob, 'fps'>, duration = animationLength()): number {
  return Math.max(1, Math.round(duration * job.fps))
}

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Przerwano renderowanie', 'AbortError')
}

async function sampleFrames(frames: FrameSource, job: VideoJob, slide: number, times: number[], height: number, duration: number): Promise<HTMLCanvasElement[]> {
  const k = height / frameOf(job).h
  const out: HTMLCanvasElement[] = []
  for (const t of times) {
    await frames.seek(t)
    out.push(slideFrame(await frames.render(designScale(job, k)), job, slide, k, t, duration))
  }
  return out
}

export async function renderThumbnails(job: VideoJob, count: number, height: number): Promise<string[]> {
  const duration = animationLength()
  const frames = await beginStageFrames()
  try {
    if (useAppStore.getState().aspectKey !== job.aspect) await frames.useFormat(job.aspect)
    const times = Array.from({ length: count }, (_, i) => (duration * (i + 1)) / count - 0.001)
    // PNG frames keep their see-through background.
    return (await sampleFrames(frames, job, 0, times, height, duration)).map((c) => (job.format === 'png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.8)))
  } finally {
    frames.end()
  }
}

// Every frame is drawn at its exact moment, however slow the computer.
export async function renderVideo(
  service: VideoEncodingService,
  job: VideoJob,
  trackName: string | null,
  onProgress: (p: VideoProgress) => void,
  signal?: AbortSignal,
): Promise<ExportFile[]> {
  const duration = animationLength()
  const count = frameCount(job, duration)
  const total = count * playsInFile(job)
  const scale = outputScale(job)
  const { width, height } = outputSize(job)
  const frames = await beginStageFrames()
  const sessions: EncodingSession[] = []
  try {
    await frames.useFormat(job.aspect)
    throwIfAborted(signal)
    // One file per exported slide; skipped ones aren't rendered.
    const slides = exportedSlides(useAppStore.getState().slides)
    for (const slide of slides) {
      const paletteSamples =
        job.format === 'gif' ? await sampleFrames(frames, job, slide, [0.2, 0.45, 0.7, 0.95].map((k) => duration * k), Math.round(height / 2), duration) : undefined
      sessions.push(
        await service.createSession({ format: job.format, width, height, fps: job.fps, loopCount: job.loopForever ? 0 : 1, quality: job.quality, paletteSamples }),
      )
    }

    const scratch = sessions.map(() => ({ card: document.createElement('canvas'), out: document.createElement('canvas') }))
    for (let f = 0; f < total; f++) {
      throwIfAborted(signal)
      const t = (f % count) / job.fps
      await frames.seek(t)
      const ribbon = await frames.render(designScale(job, scale))
      const timestamp = Math.round((f * 1_000_000) / job.fps)
      for (let slide = 0; slide < sessions.length; slide++) {
        await sessions[slide].addFrame(slideFrame(ribbon, job, slides[slide], scale, t, duration, scratch[slide]), timestamp)
      }
      onProgress({ done: f + 1, total })
      // Lets the progress bar paint and the Cancel button respond.
      if (f % 2 === 1) await yieldToBrowser()
    }

    const blobs = await Promise.all(sessions.map((s) => s.finish()))
    // PNG frames come packed in a ZIP.
    const names = exportFileNames(job.format === 'png' ? 'zip' : job.format, job.format === 'gif' ? 1 : job.scale, job.inset?.frame ?? job.aspect, trackName, sessions.length)
    return blobs.map((blob, i) => ({ name: names[i], blob }))
  } catch (e) {
    sessions.forEach((s) => s.abort())
    throw e
  } finally {
    frames.end()
  }
}
