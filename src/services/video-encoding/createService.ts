import { DefaultVideoEncodingService } from './default/DefaultVideoEncodingService'
import type { VideoEncodingService } from './VideoEncodingService'

// The one place that decides which implementation the app uses. Switching packages
// (or moving encoding to ffmpeg.wasm or a server) means returning another one here.
export function createVideoEncodingService(): VideoEncodingService {
  return new DefaultVideoEncodingService()
}
