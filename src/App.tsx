import { useEffect } from 'react'
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
  // The project lives only in this tab: the browser asks before closing it once anything changed.
  const edited = useAppStore((s) => s.past.length > 0 || s.future.length > 0)
  useEffect(() => {
    if (!edited) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [edited])

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
