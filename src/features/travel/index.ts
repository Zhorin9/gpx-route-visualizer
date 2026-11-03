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
  addWorkspace({ tab: 'route', page: 'stops', Component: TravelWorkspace })
  registerPanelSection({ id: 'stops', label: 'Przystanki', tab: 'route', order: 40, Component: TravelPanel })
}
