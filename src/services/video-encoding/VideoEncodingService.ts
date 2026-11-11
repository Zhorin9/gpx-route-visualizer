// No encoding package (or its types) is visible outside this folder, so one can be replaced freely.

// png: numbered frames with transparency, packed in a ZIP, for editing software.
export type VideoFormat = 'mp4' | 'webm' | 'gif' | 'png'
export type EncodeQuality = 'low' | 'medium' | 'high'

export interface EncodeOptions {
  format: VideoFormat
  // Output size in pixels.
  width: number
  height: number
  fps: number
  // GIF only: 0 = loop forever, 1 = play once.
  loopCount: number
  quality: EncodeQuality
  // GIF only: frames that represent the whole animation, for one stable colour table.
  paletteSamples?: readonly HTMLCanvasElement[]
}

export interface FormatSupport {
  format: VideoFormat
  supported: boolean
  // Why the browser can't produce this format.
  reason?: string
}

export interface EncodingSession {
  // Frames must come in order; timestamps in microseconds from the start.
  addFrame: (frame: HTMLCanvasElement, timestampUs: number) => Promise<void>
  finish: () => Promise<Blob>
  // Drops everything; safe to call at any time, also after finish.
  abort: () => void
}

export interface VideoEncodingService {
  capabilities: (width: number, height: number, fps: number) => Promise<FormatSupport[]>
  // Rough size of the file, for the export panel.
  estimateBytes: (options: EncodeOptions, durationS: number) => number
  createSession: (options: EncodeOptions) => Promise<EncodingSession>
}

export const MIME_TYPES: Record<VideoFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  gif: 'image/gif',
  png: 'application/zip',
}
