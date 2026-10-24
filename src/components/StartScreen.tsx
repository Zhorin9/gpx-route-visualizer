import { useState, type DragEvent, type ReactNode } from 'react'
import useGpxImport from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { LAYOUTS, layoutFits } from '../utils/layouts'
import Button from './ui/Button'
import FileButton from './ui/FileButton'
import type { ProjectMode, TabKey } from '../types'
import './StartScreen.css'

function ModeCard({ kicker, title, body, art, action, note, onDropFiles }: { kicker: string; title: string; body: string; art: ReactNode; action: ReactNode; note: string; onDropFiles?: (files: FileList) => void }) {
  const [over, setOver] = useState(false)
  const drop = onDropFiles && {
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      setOver(true)
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      setOver(false)
      onDropFiles(e.dataTransfer.files)
    },
  }
  return (
    <section className={over ? 'mode-card over' : 'mode-card'} {...drop}>
      <span className="mode-card-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <svg className="mode-card-art" viewBox="0 0 300 80" fill="none" aria-hidden="true">
        {art}
      </svg>
      <div className="mode-card-action">
        {action}
        <span className="mode-card-note">{note}</span>
      </div>
    </section>
  )
}

// Three ways in. A GPX file and places on a map start the same map project (each can be added to
// the other later); photos alone start a collage, which has no route or map.
export default function StartScreen() {
  const startProject = useAppStore((s) => s.startProject)
  const { importFiles } = useGpxImport()

  const setLayout = useAppStore((s) => s.setLayout)
  const format = useAppStore((s) => FORMATS[s.aspectKey])

  const start = (mode: ProjectMode, tab?: TabKey) => (files?: FileList | null) => {
    if (files && !files.length) return
    startProject(mode, tab)
    // A collage opens on a grid with a slot for every photo, when there is one.
    const photos = Array.from(files ?? []).filter((f) => f.type.startsWith('image/')).length
    const grid = LAYOUTS.find((l) => l.group === 'grid' && l.cells.length === photos && layoutFits(l, format.w, format.h))
    if (mode === 'collage' && grid) setLayout(0, grid.key)
    if (files) importFiles(files)
  }

  return (
    <main className="start-screen">
      <header className="start-screen-header">
        <h1>GPX Route Visualizer</h1>
        <p>Od czego zaczynasz? Trasę z GPX i miejsca na mapie połączysz w jednym projekcie. Kolaż to same zdjęcia, bez mapy.</p>
      </header>
      <div className="start-screen-cards">
        <ModeCard
          kicker="Aktywność"
          title="Wgraj trasę GPX"
          body="Rower, bieg, wędrówka. Kolorowanie według prędkości lub nachylenia, profil wysokości i statystyki wyliczone z pliku."
          art={<path d="M4 70 C40 66 50 30 90 36 S140 66 180 40 S250 8 296 16" />}
          action={
            <FileButton accept=".gpx,application/gpx+xml" variant="primary" onFiles={start('map')}>
              Wybierz plik .gpx
            </FileButton>
          }
          note="lub przeciągnij tutaj"
          onDropFiles={start('map')}
        />
        <ModeCard
          kicker="Podróż"
          title="Zaznacz miejsca na mapie"
          body="Wakacje i wyjazdy. Klikasz miejsca, wybierasz pojazd między nimi: samochód, samolot, pociąg, rower, pieszo. Bez pliku."
          art={
            <>
              <path d="M30 60 Q80 0 130 40 T230 30 T280 56" strokeDasharray="2 6" />
              {[
                [30, 60],
                [130, 40],
                [230, 30],
                [280, 56],
              ].map(([cx, cy]) => (
                <circle key={cx} cx={cx} cy={cy} r="5" className="mode-card-stop" />
              ))}
            </>
          }
          action={
            <Button variant="primary" onClick={() => start('map', 'travel')()}>
              Otwórz mapę
            </Button>
          }
          note="miejsca wyszukasz lub klikniesz"
        />
        <ModeCard
          kicker="Same zdjęcia"
          title="Kolaż ze zdjęć"
          body="Wgraj zdjęcia, podziel kadr, przytnij. Bez mapy i bez GPX. Możesz z nich zrobić kolaż albo karuzelę."
          art={
            <>
              <rect x="30" y="8" width="110" height="64" />
              <rect x="150" y="8" width="60" height="30" />
              <rect x="150" y="42" width="60" height="30" />
              <rect x="220" y="8" width="50" height="64" />
            </>
          }
          action={
            <FileButton accept="image/*" multiple variant="primary" onFiles={start('collage')}>
              Wybierz zdjęcia
            </FileButton>
          }
          note="lub przeciągnij tutaj"
          onDropFiles={start('collage')}
        />
      </div>
    </main>
  )
}
