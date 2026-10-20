import { registerAnimation } from './animation'
import { registerDataColor } from './data-color'
import { registerElevationProfile } from './elevation-profile'
import { registerStats } from './stats'

// Composition root: every feature plugs its pieces into the core registries here.
export function registerFeatures() {
  registerStats()
  registerElevationProfile()
  registerDataColor()
  registerAnimation()
}
