import type { EncodeOptions, EncodeQuality } from '../VideoEncodingService'
import type { EncodedSample, FrameEncoder, VideoCodecId } from '../ports'

// The only file that talks to the browser's WebCodecs encoder.

// Bits per pixel per frame; ~4.4 Mb/s for a 1080×1920 story at 30 fps on medium.
const BITS_PER_PIXEL: Record<EncodeQuality, number> = { low: 0.04, medium: 0.07, high: 0.12 }

export function targetBitrate(options: Pick<EncodeOptions, 'width' | 'height' | 'fps' | 'quality'>): number {
  return Math.round(options.width * options.height * options.fps * BITS_PER_PIXEL[options.quality])
}

// Codec strings with a level high enough for the frame size and rate.
function codecString(codec: VideoCodecId, { width, height, fps }: EncodeOptions): string {
  const macroblocks = Math.ceil(width / 16) * Math.ceil(height / 16)
  if (codec === 'avc') {
    // High profile; level 4.0 / 4.2 / 5.1 / 5.2 by frame size and rate.
    const level = macroblocks > 8192 ? (fps > 30 ? '34' : '33') : fps > 30 ? '2a' : '28'
    return `avc1.6400${level}`
  }
  // Profile 0, 8-bit; level 4.0 / 4.1 for 1080p, 5.1 above.
  const level = width * height > 2_228_224 ? '51' : fps > 30 ? '41' : '40'
  return `vp09.00.${level}.08`
}

function config(codec: VideoCodecId, options: EncodeOptions): VideoEncoderConfig {
  return {
    codec: codecString(codec, options),
    width: options.width,
    height: options.height,
    bitrate: targetBitrate(options),
    framerate: options.fps,
    latencyMode: 'quality',
    ...(codec === 'avc' ? { avc: { format: 'avc' as const } } : null),
  }
}

export class WebCodecsFrameEncoder implements FrameEncoder {
  private encoder: VideoEncoder | null = null

  constructor(readonly codec: VideoCodecId) {}

  async isSupported(options: EncodeOptions): Promise<boolean> {
    if (typeof VideoEncoder === 'undefined') return false
    try {
      return (await VideoEncoder.isConfigSupported(config(this.codec, options))).supported === true
    } catch {
      return false
    }
  }

  async configure(options: EncodeOptions, onSample: (sample: EncodedSample) => void, onError: (error: Error) => void) {
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => onSample({ chunk, meta }),
      error: (e) => onError(e instanceof Error ? e : new Error(String(e))),
    })
    this.encoder.configure(config(this.codec, options))
  }

  encode(frame: VideoFrame, keyFrame: boolean) {
    this.encoder?.encode(frame, { keyFrame })
  }

  queueSize() {
    return this.encoder?.encodeQueueSize ?? 0
  }

  async flush() {
    await this.encoder?.flush()
  }

  close() {
    if (this.encoder && this.encoder.state !== 'closed') this.encoder.close()
    this.encoder = null
  }
}
