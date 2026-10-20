// Types for the parts of gifenc this folder uses (the package ships none).
declare module 'gifenc' {
  export type Palette = number[][]
  export type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444'

  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: { format?: ColorFormat }): Palette
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: ColorFormat): Uint8Array

  export interface GifEncoderStream {
    writeFrame(index: Uint8Array, width: number, height: number, options?: { palette?: Palette; delay?: number; repeat?: number }): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
  }

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): GifEncoderStream
}
