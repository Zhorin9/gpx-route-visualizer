import { EncodingFailedError, type EncodeOptions, type EncodingSession } from '../VideoEncodingService'
import i18n from '../../../i18n'
import type { ContainerMuxer, EncodedSample, FrameEncoder } from '../ports'
import { FrameCanvas } from './frameCanvas'

// A key frame every two seconds keeps seeking cheap without costing much size.
const KEY_FRAME_INTERVAL_S = 2
// Frames waiting in the encoder before the session waits for it to catch up.
const MAX_QUEUE = 8

export class CodecContainerSession implements EncodingSession {
  private readonly canvas: FrameCanvas
  private frameIndex = 0
  private failure: Error | null = null
  private writes: Promise<void> = Promise.resolve()
  private closed = false

  private constructor(
    private readonly options: EncodeOptions,
    private readonly encoder: FrameEncoder,
    private readonly muxer: ContainerMuxer,
  ) {
    this.canvas = new FrameCanvas(options.width, options.height)
  }

  static async start(options: EncodeOptions, encoder: FrameEncoder, muxer: ContainerMuxer): Promise<CodecContainerSession> {
    const session = new CodecContainerSession(options, encoder, muxer)
    await muxer.begin(options, encoder.codec)
    await encoder.configure(options, (s) => session.onSample(s), (e) => (session.failure = e))
    return session
  }

  // Samples are written one after another, in the order the encoder produced them.
  private onSample(sample: EncodedSample) {
    this.writes = this.writes.then(() => this.muxer.addSample(sample)).catch((e) => {
      this.failure = e instanceof Error ? e : new Error(String(e))
    })
  }

  private check() {
    if (this.failure) throw new EncodingFailedError(i18n.t('codecContainerSession.failed'), { cause: this.failure })
    if (this.closed) throw new EncodingFailedError(i18n.t('codecContainerSession.aborted'))
  }

  async addFrame(frame: HTMLCanvasElement, timestampUs: number) {
    this.check()
    this.canvas.draw(frame)
    const video = new VideoFrame(this.canvas.canvas, { timestamp: timestampUs, duration: Math.round(1_000_000 / this.options.fps) })
    const keyFrame = this.frameIndex % Math.max(1, Math.round(this.options.fps * KEY_FRAME_INTERVAL_S)) === 0
    this.encoder.encode(video, keyFrame)
    video.close()
    this.frameIndex++
    while (this.encoder.queueSize() > MAX_QUEUE) await new Promise((r) => setTimeout(r, 1))
  }

  async finish(): Promise<Blob> {
    this.check()
    await this.encoder.flush()
    await this.writes
    this.check()
    this.encoder.close()
    this.closed = true
    return this.muxer.finalize()
  }

  abort() {
    if (this.closed) return
    this.closed = true
    this.encoder.close()
    this.muxer.cancel()
  }
}
