// A reused canvas of the exact output size: frames of any size are scaled onto it.
export class FrameCanvas {
  readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas 2D is not available')
    this.ctx = ctx
  }

  draw(frame: HTMLCanvasElement): CanvasRenderingContext2D {
    const { width, height } = this.canvas
    this.ctx.clearRect(0, 0, width, height)
    this.ctx.drawImage(frame, 0, 0, width, height)
    return this.ctx
  }
}
