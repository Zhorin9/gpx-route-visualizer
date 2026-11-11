import { DefaultVideoEncodingService } from './default/DefaultVideoEncodingService'

export * from './VideoEncodingService'

export const videoEncoding = new DefaultVideoEncodingService()
