import { addWorkspace } from '../../core/canvas/chrome'
import { registerPanelSection } from '../../core/panel/registry'
import TravelWorkspace from './workspace/TravelWorkspace'
import { BUILT_IN_MODES, registerTravelMode } from './model/modes'
import TravelPanel from './panel/TravelPanel'
import { brouter } from './providers/brouter'
import { registerRoutingProvider } from './providers/routing'

export function registerTravel() {
  for (const mode of BUILT_IN_MODES) registerTravelMode(mode)
  registerRoutingProvider(brouter)
  addWorkspace({ tab: 'travel', Component: TravelWorkspace })
  registerPanelSection({ id: 'stops', label: 'Przystanki', tab: 'travel', order: 0, Component: TravelPanel })
}
