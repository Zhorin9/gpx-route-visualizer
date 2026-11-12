import type { EncodeOptions, EncodeQuality } from '../VideoEncodingService'

export type VideoCodecId = 'avc' | 'vp9'

// Plain web platform types, never a package's own.
export interface EncodedSample {
  chunk: EncodedVideoChunk
  // Present on the first sample: the decoder configuration the container must store.
  meta?: EncodedVideoChunkMetadata
}

// Bits per pixel per frame; ~4.4 Mb/s for a 1080×1920 story at 30 fps on medium.
const BITS_PER_PIXEL: Record<EncodeQuality, number> = { low: 0.04, medium: 0.07, high: 0.12 }

export function targetBitrate(options: Pick<EncodeOptions, 'width' | 'height' | 'fps' | 'quality'>): number {
  return Math.round(options.width * options.height * options.fps * BITS_PER_PIXEL[options.quality])
}

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

// Firefox hands out a broken avcC (each parameter set with its header byte doubled), so other
// players can't decode its MP4s. Its key frames carry the SPS and PPS as well: the avcC is
// built from those instead. Browsers that keep them out of the frames (Chrome) are left alone.
export function inBandAvcDescription(chunk: Pick<EncodedVideoChunk, 'byteLength' | 'copyTo'>): Uint8Array | undefined {
  const data = new Uint8Array(chunk.byteLength)
  chunk.copyTo(data)
  const view = new DataView(data.buffer)
  const sets: Partial<Record<number, Uint8Array>> = {}
  for (let at = 0; at + 4 < data.length; ) {
    const nal = data.subarray(at + 4, at + 4 + view.getUint32(at))
    sets[nal[0] & 0x1f] ??= nal
    at += 4 + nal.length
  }
  const sps = sets[7]
  const pps = sets[8]
  if (!sps || !pps) return undefined
  // High profiles and above also state the chroma format and bit depth: 4:2:0, 8-bit.
  const highExtension = sps[1] >= 100 ? [0xfd, 0xf8, 0xf8, 0] : []
  return new Uint8Array([1, sps[1], sps[2], sps[3], 0xff, 0xe1, sps.length >> 8, sps.length & 0xff, ...sps, 1, pps.length >> 8, pps.length & 0xff, ...pps, ...highExtension])
}

export class WebCodecsFrameEncoder {
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
      output: (chunk, meta) => {
        const decoderConfig = meta?.decoderConfig
        const description = this.codec === 'avc' && decoderConfig ? inBandAvcDescription(chunk) : undefined
        onSample({ chunk, meta: decoderConfig && description ? { ...meta, decoderConfig: { ...decoderConfig, description } } : meta })
      },
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
