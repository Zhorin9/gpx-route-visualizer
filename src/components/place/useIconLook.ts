import { useAppStore } from '../../store/useAppStore'
import { useBackgroundColor } from '../../store/selectors'

// Over photos or a see-through frame there is no one colour to lay the ink on, so it gets white paper.
const BLANK_PAPER = '#ffffff'

// The finish is the style's; ink is laid on the background's own colour, as on paper.
export default function useIconLook() {
  const finish = useAppStore((s) => s.iconFinish)
  const paper = useBackgroundColor() ?? BLANK_PAPER
  return { finish, paper }
}
