import CanvasArea from './components/CanvasArea'
import ControlPanel from './components/panel/ControlPanel'
import StartScreen from './components/StartScreen'
import TopBar from './components/TopBar'
import useFontPreload from './hooks/useFontPreload'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import { useAppStore } from './store/useAppStore'

export default function App() {
  useFontPreload()
  useKeyboardShortcuts()
  const started = useAppStore((s) => s.mode != null)

  if (!started) return <StartScreen />
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app">
        <CanvasArea />
        <ControlPanel />
      </main>
    </div>
  )
}
