import { EncodingFailedError, MIME_TYPES, type EncodeOptions, type EncodingSession, type FormatSupport, type VideoEncodingService, type VideoFormat } from '../VideoEncodingService'

// In-memory stand-in for tests of the export loop and the panel: records what it was given.
export class FakeVideoEncodingService implements VideoEncodingService {
  readonly sessions: { options: EncodeOptions; timestamps: number[]; finished: boolean; aborted: boolean }[] = []

  constructor(private readonly unsupported: VideoFormat[] = []) {}

  async capabilities(): Promise<FormatSupport[]> {
    return (['mp4', 'webm', 'gif'] as const).map((format) =>
      this.unsupported.includes(format) ? { format, supported: false, reason: 'wyłączone w teście' } : { format, supported: true },
    )
  }

  estimateBytes(options: EncodeOptions, durationS: number) {
    return options.width * options.height * durationS
  }

  async createSession(options: EncodeOptions): Promise<EncodingSession> {
    if (this.unsupported.includes(options.format)) throw new EncodingFailedError('wyłączone w teście')
    const record = { options, timestamps: [] as number[], finished: false, aborted: false }
    this.sessions.push(record)
    return {
      addFrame: async (_frame, timestampUs) => {
        if (record.aborted) throw new EncodingFailedError('przerwano')
        record.timestamps.push(timestampUs)
      },
      finish: async () => {
        record.finished = true
        return new Blob([new Uint8Array(record.timestamps.length)], { type: MIME_TYPES[options.format] })
      },
      abort: () => {
        record.aborted = true
      },
    }
  }
}
