import { GIFEncoder, applyPalette, quantize, type Palette } from 'gifenc'
import { EncodingFailedError, MIME_TYPES, type EncodeOptions, type EncodingSession } from '../VideoEncodingService'
import { FrameCanvas } from './frameCanvas'

// The only file that uses gifenc. A GIF has no separate codec and container, so this
// is a whole session on its own.

const COLORS = 256

// One colour table for the whole animation, from a strip of sample frames: colours stay
// put from frame to frame instead of shimmering.
function buildPalette(samples: readonly HTMLCanvasElement[], width: number, height: number): Palette | null {
  if (!samples.length) return null
  const strip = document.createElement('canvas')
  const cellW = Math.max(1, Math.round(width / 2))
  const cellH = Math.max(1, Math.round(height / 2))
  strip.width = cellW * samples.length
  strip.height = cellH
  const ctx = strip.getContext('2d')
  if (!ctx) return null
  samples.forEach((s, i) => ctx.drawImage(s, i * cellW, 0, cellW, cellH))
  return quantize(ctx.getImageData(0, 0, strip.width, strip.height).data, COLORS)
}

export class GifencSession implements EncodingSession {
  private readonly gif = GIFEncoder()
  private readonly canvas: FrameCanvas
  private palette: Palette | null
  private lastUs = 0
  private pending: Uint8Array | null = null
  private aborted = false

  constructor(private readonly options: EncodeOptions) {
    this.canvas = new FrameCanvas(options.width, options.height)
    this.palette = buildPalette(options.paletteSamples ?? [], options.width, options.height)
  }

  // Each frame is written when the next one arrives: its delay is the gap between them.
  private writePending(delayMs: number) {
    if (!this.pending || !this.palette) return
    this.gif.writeFrame(this.pending, this.options.width, this.options.height, {
      palette: this.palette,
      delay: Math.max(20, Math.round(delayMs)),
      repeat: this.options.loopCount === 0 ? 0 : -1,
    })
    this.pending = null
  }

  async addFrame(frame: HTMLCanvasElement, timestampUs: number) {
    if (this.aborted) throw new EncodingFailedError('Przerwano zapis GIF-a')
    const rgba = this.canvas.draw(frame).getImageData(0, 0, this.options.width, this.options.height).data
    this.palette ??= quantize(rgba, COLORS)
    this.writePending((timestampUs - this.lastUs) / 1000)
    this.pending = applyPalette(rgba, this.palette)
    this.lastUs = timestampUs
  }

  async finish(): Promise<Blob> {
    if (this.aborted) throw new EncodingFailedError('Przerwano zapis GIF-a')
    this.writePending(1000 / this.options.fps)
    this.gif.finish()
    return new Blob([this.gif.bytes()], { type: MIME_TYPES.gif })
  }

  abort() {
    this.aborted = true
    this.pending = null
  }
}
