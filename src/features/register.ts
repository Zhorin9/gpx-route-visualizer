import { registerElevationProfile } from './elevation-profile'
import { registerStats } from './stats'

// Composition root: every feature plugs its pieces into the core registries here.
export function registerFeatures() {
  registerStats()
  registerElevationProfile()
}
