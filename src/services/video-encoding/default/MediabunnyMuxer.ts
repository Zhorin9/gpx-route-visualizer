import { BufferTarget, EncodedPacket, EncodedVideoPacketSource, Mp4OutputFormat, Output, WebMOutputFormat } from 'mediabunny'
import { MIME_TYPES, type EncodeOptions } from '../VideoEncodingService'
import i18n from '../../../i18n'
import type { EncodedSample, VideoCodecId } from './WebCodecsFrameEncoder'

export class MediabunnyMuxer {
  private output: Output | null = null
  private source: EncodedVideoPacketSource | null = null
  private target: BufferTarget | null = null

  constructor(private readonly container: 'mp4' | 'webm') {}

  async begin(options: EncodeOptions, codec: VideoCodecId) {
    this.target = new BufferTarget()
    this.output = new Output({
      // In-memory fast start puts the index first, so the file plays while it downloads.
      format: this.container === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(),
      target: this.target,
    })
    this.source = new EncodedVideoPacketSource(codec)
    this.output.addVideoTrack(this.source, { frameRate: options.fps })
    await this.output.start()
  }

  async addSample({ chunk, meta }: EncodedSample) {
    if (!this.source) throw new Error(i18n.t('mediabunnyMuxer.notStarted'))
    await this.source.add(EncodedPacket.fromEncodedChunk(chunk), meta)
  }

  async finalize(): Promise<Blob> {
    if (!this.output || !this.target) throw new Error(i18n.t('mediabunnyMuxer.notStarted'))
    await this.output.finalize()
    const buffer = this.target.buffer
    if (!buffer) throw new Error(i18n.t('mediabunnyMuxer.saveFailed'))
    return new Blob([buffer], { type: MIME_TYPES[this.container] })
  }

  cancel() {
    void this.output?.cancel().catch(() => undefined)
    this.output = null
    this.source = null
  }
}
