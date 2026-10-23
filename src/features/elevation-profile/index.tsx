import { registerCanvasElement } from '../../core/canvas/registry'
import { registerPanelSection } from '../../core/panel/registry'
import { addRouteDecoration } from '../../core/route/providers'
import { IconMountain } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import { selectGroundInRange } from '../../store/derived'
import { useAppStore } from '../../store/useAppStore'
import ElevationProfileNode from './canvas/ElevationProfileNode'
import ProfileRouteMarker from './canvas/ProfileRouteMarker'
import ElevationProfileEditor, { ElevationProfileSection } from './panel/ElevationProfileEditor'
import { PROFILE_KIND } from './types'

function useIsAvailable() {
  const enabled = useAppStore((s) => s.profile.enabled)
  const ground = useAppStore(selectGroundInRange)
  return useHasRoute() && enabled && ground
}

export function registerElevationProfile() {
  registerCanvasElement({
    kind: PROFILE_KIND,
    label: 'Profil wysokości',
    meta: 'wykres',
    icon: <IconMountain />,
    order: 20,
    useIsAvailable,
    Node: ElevationProfileNode,
    Editor: ElevationProfileEditor,
    tab: 'route',
    subTab: 'profile',
  })
  registerPanelSection({ id: 'profile', label: 'Profil', tab: 'route', order: 20, Component: ElevationProfileSection })
  addRouteDecoration(ProfileRouteMarker)
}
