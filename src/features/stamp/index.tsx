import { registerCanvasElement } from '../../core/canvas/registry'
import { IconInfo } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import StampFields from './StampFields'
import StampNode from './StampNode'
import { STAMP_KIND, selectStartTime } from './model'

const useStampShown = () => useAppStore((s) => s.stamp && selectStartTime(s) != null)

export function registerStamp() {
  registerCanvasElement({
    kind: STAMP_KIND,
    label: 'Data i godzina',
    meta: 'w rogu',
    icon: <IconInfo />,
    order: 80,
    useIsAvailable: useStampShown,
    Node: StampNode,
    Editor: StampFields,
  })
}
