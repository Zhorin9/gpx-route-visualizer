import { useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import useGpxImport, { GPX_ACCEPT } from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { LAYOUTS, layoutFits } from '../utils/layouts'
import Button from './ui/Button'
import FileButton from './ui/FileButton'
import type { ProjectMode } from '../types'
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

export default function StartScreen() {
  const startProject = useAppStore((s) => s.startProject)
  const { importFiles } = useGpxImport()
  const { t } = useTranslation()

  const setLayout = useAppStore((s) => s.setLayout)
  const format = useAppStore((s) => FORMATS[s.aspectKey])

  const start = (mode: ProjectMode, page?: string) => (files?: FileList | null) => {
    if (files && !files.length) return
    startProject(mode, page)
    // A collage opens on a grid with a slot for every photo, when there is one.
    const photos = Array.from(files ?? []).filter((f) => f.type.startsWith('image/')).length
    const grid = LAYOUTS.find((l) => l.group === 'grid' && l.cells.length === photos && layoutFits(l, format.w, format.h))
    if (mode === 'collage' && grid) setLayout(0, grid.key)
    if (files) importFiles(files)
  }

  return (
    <main className="start-screen">
      <header className="start-screen-header">
        <h1>Tripcard</h1>
        <p>{t('startScreen.intro')}</p>
      </header>
      <div className="start-screen-cards">
        <ModeCard
          kicker={t('startScreen.activityKicker')}
          title={t('startScreen.activityTitle')}
          body={t('startScreen.activityBody')}
          art={<path d="M4 70 C40 66 50 30 90 36 S140 66 180 40 S250 8 296 16" />}
          action={
            <FileButton accept={GPX_ACCEPT} variant="primary" onFiles={start('map')}>
              {t('startScreen.chooseGpx')}
            </FileButton>
          }
          note={t('startScreen.orDragHere')}
          onDropFiles={start('map')}
        />
        <ModeCard
          kicker={t('startScreen.tripKicker')}
          title={t('startScreen.tripTitle')}
          body={t('startScreen.tripBody')}
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
            <Button variant="primary" onClick={() => start('map', 'stops')()}>
              {t('startScreen.openMap')}
            </Button>
          }
          note={t('startScreen.tripNote')}
        />
        <ModeCard
          kicker={t('startScreen.collageKicker')}
          title={t('startScreen.collageTitle')}
          body={t('startScreen.collageBody')}
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
              {t('startScreen.choosePhotos')}
            </FileButton>
          }
          note={t('startScreen.orDragHere')}
          onDropFiles={start('collage')}
        />
      </div>
    </main>
  )
}
