import { useAppStore } from '../../store/useAppStore'

// The finish is the style's; ink is laid on the background's own colour, as on paper.
export default function useIconLook() {
  const finish = useAppStore((s) => s.iconFinish)
  const paper = useAppStore((s) => (s.collage.bgKind === 'color' ? s.collage.bgColor : s.collage.gradient.from))
  return { finish, paper }
}
