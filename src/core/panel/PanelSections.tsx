import { panelSections } from './registry'
import type { TabKey } from '../../types'

export default function PanelSections({ tab }: { tab: TabKey }) {
  return panelSections(tab).map(({ id, Component }) => <Component key={id} />)
}
