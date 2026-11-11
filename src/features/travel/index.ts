import { addWorkspace } from '../../core/canvas/chrome'
import { registerPanelSection } from '../../core/panel/registry'
import TravelWorkspace from './workspace/TravelWorkspace'
import TravelPanel from './panel/TravelPanel'

export function registerTravel() {
  addWorkspace({ tab: 'route', page: 'stops', Component: TravelWorkspace })
  registerPanelSection({ id: 'stops', label: 'travel.stops', tab: 'route', order: 40, Component: TravelPanel })
}
