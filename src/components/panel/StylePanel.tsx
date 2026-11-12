import BackgroundTab from './BackgroundTab'
import TemplatesPage from './TemplatesPage'
import ColorsPage from './ColorsPage'
import WrapperSection from './WrapperSection'
import SlideStylePage from './SlideStylePage'
import SubTabs, { type OwnPage } from '../../core/panel/SubTabs'
import { useAppStore } from '../../store/useAppStore'

export default function StylePanel({ withTemplates = true }: { withTemplates?: boolean }) {
  const series = useAppStore((s) => s.slides.length > 1 && s.carouselKind === 'slides')
  const own: OwnPage[] = [
    ...(withTemplates ? [{ id: 'presets', label: 'controlPanel.templates', Component: TemplatesPage } as const] : []),
    { id: 'colors', label: 'controlPanel.colors', Component: ColorsPage },
    { id: 'background', label: 'controlPanel.background', Component: BackgroundTab },
    { id: 'wrapper', label: 'controlPanel.wrapper', Component: WrapperSection },
    ...(series ? [{ id: 'slide', label: 'controlPanel.thisSlide', Component: SlideStylePage } as const] : []),
  ]
  return <SubTabs tab="style" own={own} />
}
