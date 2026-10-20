import { EncodingUnsupportedError, type EncodeOptions, type EncodingSession, type FormatSupport, type VideoEncodingService, type VideoFormat } from '../VideoEncodingService'
import type { VideoCodecId } from '../ports'
import { WebCodecsFrameEncoder, targetBitrate } from './WebCodecsFrameEncoder'

// Browser encoding: WebCodecs for MP4 (H.264) and WebM (VP9) packed by Mediabunny, gifenc for GIF.
// The packages are loaded on first use, so they don't weigh on the editor's start-up.

const CODECS: Record<Exclude<VideoFormat, 'gif'>, VideoCodecId> = { mp4: 'avc', webm: 'vp9' }

// A GIF frame is roughly this many bytes per pixel after LZW, for flat graphics with some gradient.
const GIF_BYTES_PER_PIXEL = 0.25

const NO_WEBCODECS = 'ta przeglądarka nie koduje wideo (brak WebCodecs)'

export class DefaultVideoEncodingService implements VideoEncodingService {
  async capabilities(width: number, height: number, fps: number): Promise<FormatSupport[]> {
    const probe = (format: VideoFormat): EncodeOptions => ({ format, width, height, fps, loopCount: 0, quality: 'medium' })
    const video = async (format: 'mp4' | 'webm'): Promise<FormatSupport> => {
      if (typeof VideoEncoder === 'undefined') return { format, supported: false, reason: NO_WEBCODECS }
      const ok = await new WebCodecsFrameEncoder(CODECS[format]).isSupported(probe(format))
      return ok ? { format, supported: true } : { format, supported: false, reason: `ta przeglądarka nie koduje ${format === 'mp4' ? 'H.264' : 'VP9'}` }
    }
    return [await video('mp4'), await video('webm'), { format: 'gif', supported: true }]
  }

  estimateBytes(options: EncodeOptions, durationS: number): number {
    if (options.format === 'gif') return options.width * options.height * GIF_BYTES_PER_PIXEL * Math.ceil(durationS * options.fps)
    return (targetBitrate(options) * durationS) / 8
  }

  async createSession(options: EncodeOptions): Promise<EncodingSession> {
    if (options.format === 'gif') {
      const { GifencSession } = await import('./GifencSession')
      return new GifencSession(options)
    }
    const encoder = new WebCodecsFrameEncoder(CODECS[options.format])
    if (!(await encoder.isSupported(options))) throw new EncodingUnsupportedError(`Format ${options.format.toUpperCase()} nie jest obsługiwany w tej przeglądarce`)
    const [{ MediabunnyMuxer }, { CodecContainerSession }] = await Promise.all([import('./MediabunnyMuxer'), import('./CodecContainerSession')])
    return CodecContainerSession.start(options, encoder, new MediabunnyMuxer(options.format))
  }
}
