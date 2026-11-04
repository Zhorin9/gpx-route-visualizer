import { createZip, type ZipEntry } from '../../../utils/zip'
import { EncodingFailedError, type EncodeOptions, type EncodingSession } from '../VideoEncodingService'
import { FrameCanvas } from './frameCanvas'

// Frames being compressed while the next ones render; more would only hold memory.
const IN_FLIGHT = 4

// Numbered PNG frames in a ZIP: the one moving format with transparency that DaVinci Resolve and
// Premiere both import as is (as an image sequence). The frame rate is set in the editing software.
export class PngSequenceSession implements EncodingSession {
  private readonly canvas: FrameCanvas
  private readonly frames: Promise<ZipEntry>[] = []
  private aborted = false

  constructor(options: EncodeOptions) {
    this.canvas = new FrameCanvas(options.width, options.height)
  }

  // toBlob copies the canvas when called, so the canvas is free for the next frame at once.
  private encode(name: string): Promise<ZipEntry> {
    return new Promise<Blob | null>((resolve) => this.canvas.canvas.toBlob(resolve, 'image/png')).then(async (blob) => {
      if (!blob) throw new EncodingFailedError('Nie udało się zapisać klatki PNG')
      return { name, data: new Uint8Array(await blob.arrayBuffer()) }
    })
  }

  async addFrame(frame: HTMLCanvasElement) {
    if (this.aborted) throw new EncodingFailedError('Przerwano zapis klatek')
    this.canvas.draw(frame)
    this.frames.push(this.encode(`klatka_${String(this.frames.length).padStart(5, '0')}.png`))
    if (this.frames.length > IN_FLIGHT) await this.frames[this.frames.length - 1 - IN_FLIGHT]
  }

  async finish(): Promise<Blob> {
    if (this.aborted) throw new EncodingFailedError('Przerwano zapis klatek')
    return createZip(await Promise.all(this.frames))
  }

  abort() {
    this.aborted = true
    this.frames.length = 0
  }
}
