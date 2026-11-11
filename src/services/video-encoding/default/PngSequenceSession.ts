import { createZip, type ZipEntry } from '../../../utils/zip'
import type { EncodingSession } from '../VideoEncodingService'
import i18n from '../../../i18n'

// Frames being compressed while the next ones render; more would only hold memory.
const IN_FLIGHT = 4

// Numbered PNG frames in a ZIP: the one moving format with transparency that DaVinci Resolve and
// Premiere both import as is (as an image sequence). The frame rate is set in the editing software.
export class PngSequenceSession implements EncodingSession {
  private readonly frames: Promise<ZipEntry>[] = []
  private aborted = false

  // toBlob copies the canvas when called, so the canvas is free for the next frame at once.
  private encode(frame: HTMLCanvasElement, name: string): Promise<ZipEntry> {
    return new Promise<Blob | null>((resolve) => frame.toBlob(resolve, 'image/png')).then(async (blob) => {
      if (!blob) throw new Error(i18n.t('pngSequenceSession.frameFailed'))
      return { name, data: new Uint8Array(await blob.arrayBuffer()) }
    })
  }

  async addFrame(frame: HTMLCanvasElement) {
    if (this.aborted) throw new Error(i18n.t('pngSequenceSession.aborted'))
    this.frames.push(this.encode(frame, `klatka_${String(this.frames.length).padStart(5, '0')}.png`))
    if (this.frames.length > IN_FLIGHT) await this.frames[this.frames.length - 1 - IN_FLIGHT]
  }

  async finish(): Promise<Blob> {
    if (this.aborted) throw new Error(i18n.t('pngSequenceSession.aborted'))
    return createZip(await Promise.all(this.frames))
  }

  abort() {
    this.aborted = true
    this.frames.length = 0
  }
}
