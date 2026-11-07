import { registerAnimation } from './animation'
import { registerCamera } from './camera'
import { registerDataColor } from './data-color'
import { registerElevationProfile } from './elevation-profile'
import { registerKicker } from './kicker'
import { registerMap } from './map'
import { registerMapSticker } from './map-sticker'
import { registerStamp } from './stamp'
import { registerStats } from './stats'
import { registerTravel } from './travel'
import { registerVideoExport } from './video-export'

export function registerFeatures() {
  registerStats()
  registerElevationProfile()
  registerDataColor()
  registerAnimation()
  registerCamera()
  registerVideoExport()
  registerTravel()
  registerMap()
  registerStamp()
  registerKicker()
  registerMapSticker()
}
