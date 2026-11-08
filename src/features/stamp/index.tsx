import { registerCanvasElement } from '../../core/canvas/registry'
import { IconInfo } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import StampFields from './StampFields'
import StampNode from './StampNode'
import { STAMP_KIND, selectStartTime } from './model'

const useStampShown = () => useAppStore((s) => s.stamp && selectStartTime(s) != null)

function useShowStampAgain() {
  const hidden = useAppStore((s) => !s.stamp && selectStartTime(s) != null)
  const setStamp = useAppStore((s) => s.setStamp)
  return hidden ? () => setStamp(true) : null
}

export function registerStamp() {
  registerCanvasElement({
    kind: STAMP_KIND,
    label: 'stamp.label',
    meta: 'stamp.meta',
    icon: <IconInfo />,
    order: 80,
    useIsAvailable: useStampShown,
    useShowAgain: useShowStampAgain,
    Node: StampNode,
    Editor: StampFields,
  })
}
