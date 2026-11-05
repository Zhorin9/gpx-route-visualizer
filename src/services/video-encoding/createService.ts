import { DefaultVideoEncodingService } from './default/DefaultVideoEncodingService'
import type { VideoEncodingService } from './VideoEncodingService'

export function createVideoEncodingService(): VideoEncodingService {
  return new DefaultVideoEncodingService()
}
