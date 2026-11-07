import { registerCanvasElement } from '../../core/canvas/registry'
import { IconType } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import KickerFields from './KickerFields'
import KickerNode from './KickerNode'
import { KICKER_KIND } from './model'

export function registerKicker() {
  registerCanvasElement({
    kind: KICKER_KIND,
    label: 'Nadtytuł',
    meta: 'nad tytułem',
    icon: <IconType />,
    order: 5,
    useIsAvailable: () => useAppStore((s) => s.kicker.shown && s.kicker.text.trim() !== ''),
    Node: KickerNode,
    Editor: KickerFields,
    animationTrack: 'header',
  })
}
