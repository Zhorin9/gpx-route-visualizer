import { registerAnimation } from './animation'
import { registerCamera } from './camera'
import { registerDataColor } from './data-color'
import { registerElevationProfile } from './elevation-profile'
import { registerMap } from './map'
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
}
