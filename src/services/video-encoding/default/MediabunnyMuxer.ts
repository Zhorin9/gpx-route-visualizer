import { BufferTarget, EncodedPacket, EncodedVideoPacketSource, Mp4OutputFormat, Output, WebMOutputFormat } from 'mediabunny'
import { EncodingFailedError, MIME_TYPES, type EncodeOptions } from '../VideoEncodingService'
import type { ContainerMuxer, EncodedSample, VideoCodecId } from '../ports'

// The only file that uses Mediabunny: it packs compressed samples into an MP4 or WebM file.
export class MediabunnyMuxer implements ContainerMuxer {
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
    if (!this.source) throw new EncodingFailedError('Plik wideo nie został rozpoczęty')
    await this.source.add(EncodedPacket.fromEncodedChunk(chunk), meta)
  }

  async finalize(): Promise<Blob> {
    if (!this.output || !this.target) throw new EncodingFailedError('Plik wideo nie został rozpoczęty')
    await this.output.finalize()
    const buffer = this.target.buffer
    if (!buffer) throw new EncodingFailedError('Nie udało się zapisać pliku wideo')
    return new Blob([buffer], { type: MIME_TYPES[this.container] })
  }

  cancel() {
    void this.output?.cancel().catch(() => undefined)
    this.output = null
    this.source = null
  }
}
