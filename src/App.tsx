import CanvasArea from './components/CanvasArea'
import ControlPanel from './components/panel/ControlPanel'
import useFontPreload from './hooks/useFontPreload'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

export default function App() {
  useFontPreload()
  useKeyboardShortcuts()

  return (
    <main className="app">
      <CanvasArea />
      <ControlPanel />
    </main>
  )
}
