import { registerCanvasElement } from '../../core/canvas/registry'
import { IconType } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import KickerFields from './KickerFields'
import KickerNode from './KickerNode'
import { KICKER_KIND } from './model'

export function registerKicker() {
  registerCanvasElement({
    kind: KICKER_KIND,
    label: 'kicker.label',
    meta: 'kicker.meta',
    icon: <IconType />,
    order: 5,
    // Shown with no words it stays listed, so clearing the field mid-edit doesn't lose it.
    useIsAvailable: () => useAppStore((s) => s.kicker.shown),
    useShowAgain: () => {
      const hidden = useAppStore((s) => !s.kicker.shown)
      const setKicker = useAppStore((s) => s.setKicker)
      return hidden ? () => setKicker({ shown: true }) : null
    },
    Node: KickerNode,
    Editor: KickerFields,
    animationTrack: 'header',
  })
}
