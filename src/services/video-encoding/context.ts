import { createContext, useContext } from 'react'
import { createVideoEncodingService } from './createService'
import type { VideoEncodingService } from './VideoEncodingService'

export const VideoEncodingContext = createContext<VideoEncodingService>(createVideoEncodingService())

export function useVideoEncoding(): VideoEncodingService {
  return useContext(VideoEncodingContext)
}
