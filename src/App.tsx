import CanvasArea from './components/CanvasArea'
import ControlPanel from './components/panel/ControlPanel'
import TopBar from './components/TopBar'
import useFontPreload from './hooks/useFontPreload'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

export default function App() {
  useFontPreload()
  useKeyboardShortcuts()

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
