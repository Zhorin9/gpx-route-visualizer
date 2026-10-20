import type { EncodeOptions } from './VideoEncodingService'

// Internal seams of the service. A video file is made of two replaceable parts:
// the codec turns frames into compressed samples, the container packs samples into a file.

export type VideoCodecId = 'avc' | 'vp9'

// One compressed sample. Plain web platform types, never a package's own.
export interface EncodedSample {
  chunk: EncodedVideoChunk
  // Present on the first sample: the decoder configuration the container must store.
  meta?: EncodedVideoChunkMetadata
}

export interface FrameEncoder {
  readonly codec: VideoCodecId
  isSupported: (options: EncodeOptions) => Promise<boolean>
  configure: (options: EncodeOptions, onSample: (sample: EncodedSample) => void, onError: (error: Error) => void) => Promise<void>
  encode: (frame: VideoFrame, keyFrame: boolean) => void
  // Resolves when the queue is drained; pressure from the encoder is honoured by waiting on it.
  queueSize: () => number
  flush: () => Promise<void>
  close: () => void
}

export interface ContainerMuxer {
  begin: (options: EncodeOptions, codec: VideoCodecId) => Promise<void>
  addSample: (sample: EncodedSample) => Promise<void>
  finalize: () => Promise<Blob>
  cancel: () => void
}
