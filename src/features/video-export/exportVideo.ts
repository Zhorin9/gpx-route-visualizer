import { beginStageFrames, type FrameSource } from '../../core/export/frameSource'
import type { EncodeQuality, EncodingSession, VideoEncodingService, VideoFormat } from '../../services/video-encoding'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../../core/formats/registry'
import { cropSlide, exportFileNames, type ExportFile } from '../../utils/exportImage'
import { totalDuration } from '../animation/model/timeline'
import type { AspectKey } from '../../types'

export interface VideoJob {
  format: VideoFormat
  aspect: AspectKey
  fps: number
  // MP4/WebM: the animation is written this many times in a row.
  repeat: number
  // GIF: loops forever, or plays once.
  loopForever: boolean
  quality: EncodeQuality
}

export interface VideoProgress {
  done: number
  total: number
}

// GIFs are written at half size: a full-size GIF is huge and gains little on a phone.
export const outputScale = (format: VideoFormat) => (format === 'gif' ? 0.5 : 1)

export function outputSize(job: Pick<VideoJob, 'format' | 'aspect'>) {
  const scale = outputScale(job.format)
  return { width: Math.round(FORMATS[job.aspect].w * scale), height: Math.round(FORMATS[job.aspect].h * scale) }
}

export function animationLength(): number {
  return totalDuration(useAppStore.getState().animation)
}

export function frameCount(job: Pick<VideoJob, 'fps'>, duration = animationLength()): number {
  return Math.max(1, Math.round(duration * job.fps))
}

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Przerwano renderowanie', 'AbortError')
}

// Frames of one slide at given moments, at a given output height; for palettes and previews.
async function sampleFrames(frames: FrameSource, aspect: AspectKey, slide: number, times: number[], height: number): Promise<HTMLCanvasElement[]> {
  const scale = height / FORMATS[aspect].h
  const out: HTMLCanvasElement[] = []
  for (const t of times) {
    await frames.seek(t)
    out.push(cropSlide(frames.render(scale), slide, aspect, scale))
  }
  return out
}

// Small previews of the animation (first slide), evenly spread over its length.
export async function renderThumbnails(aspect: AspectKey, count: number, height: number): Promise<string[]> {
  const duration = animationLength()
  const frames = await beginStageFrames()
  try {
    if (useAppStore.getState().aspectKey !== aspect) await frames.useFormat(aspect)
    const times = Array.from({ length: count }, (_, i) => (duration * (i + 1)) / count - 0.001)
    return (await sampleFrames(frames, aspect, 0, times, height)).map((c) => c.toDataURL('image/jpeg', 0.8))
  } finally {
    frames.end()
  }
}

// Renders the animation frame by frame and encodes it: one file per slide of a carousel.
// Deterministic: every frame is drawn at its exact moment, however slow the computer.
export async function renderVideo(
  service: VideoEncodingService,
  job: VideoJob,
  trackName: string | null,
  onProgress: (p: VideoProgress) => void,
  signal?: AbortSignal,
): Promise<ExportFile[]> {
  const slideCount = useAppStore.getState().slides.length
  const duration = animationLength()
  const count = frameCount(job, duration)
  const total = count * (job.format === 'gif' ? 1 : Math.max(1, job.repeat))
  const scale = outputScale(job.format)
  const { width, height } = outputSize(job)
  const frames = await beginStageFrames()
  const sessions: EncodingSession[] = []
  try {
    await frames.useFormat(job.aspect)
    throwIfAborted(signal)
    for (let slide = 0; slide < slideCount; slide++) {
      const paletteSamples =
        job.format === 'gif' ? await sampleFrames(frames, job.aspect, slide, [0.2, 0.45, 0.7, 0.95].map((k) => duration * k), Math.round(height / 2)) : undefined
      sessions.push(
        await service.createSession({ format: job.format, width, height, fps: job.fps, loopCount: job.loopForever ? 0 : 1, quality: job.quality, paletteSamples }),
      )
    }

    const scratch = sessions.map(() => document.createElement('canvas'))
    for (let f = 0; f < total; f++) {
      throwIfAborted(signal)
      await frames.seek((f % count) / job.fps)
      const ribbon = frames.render(scale)
      const timestamp = Math.round((f * 1_000_000) / job.fps)
      for (let slide = 0; slide < sessions.length; slide++) {
        await sessions[slide].addFrame(cropSlide(ribbon, slide, job.aspect, scale, scratch[slide]), timestamp)
      }
      onProgress({ done: f + 1, total })
      // Lets the progress bar paint and the Cancel button respond.
      if (f % 2 === 1) await yieldToBrowser()
    }

    const blobs = await Promise.all(sessions.map((s) => s.finish()))
    const names = exportFileNames(job.format, 1, job.aspect, trackName, slideCount)
    return blobs.map((blob, i) => ({ name: names[i], blob }))
  } catch (e) {
    sessions.forEach((s) => s.abort())
    throw e
  } finally {
    frames.end()
  }
}
