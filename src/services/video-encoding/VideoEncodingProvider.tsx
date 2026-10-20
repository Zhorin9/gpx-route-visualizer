import type { ReactNode } from 'react'
import { VideoEncodingContext } from './context'
import type { VideoEncodingService } from './VideoEncodingService'

// Lets tests (or another build) hand the app a different implementation.
export function VideoEncodingProvider({ service, children }: { service: VideoEncodingService; children: ReactNode }) {
  return <VideoEncodingContext.Provider value={service}>{children}</VideoEncodingContext.Provider>
}
