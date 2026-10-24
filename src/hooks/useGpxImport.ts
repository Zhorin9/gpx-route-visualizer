import { useAppStore } from '../store/useAppStore'

function isGpx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.gpx') || file.type === 'application/gpx+xml'
}

// Routes picked or dropped files to the right loader: .gpx → track, images → photo slots.
// A collage has no route, so a GPX file dropped on it is turned away.
export default function useGpxImport() {
  const loadGpxFile = useAppStore((s) => s.loadGpxFile)
  const loadPhotoFiles = useAppStore((s) => s.loadPhotoFiles)
  const showToast = useAppStore((s) => s.showToast)

  function importFiles(files: FileList | File[] | null | undefined, target?: { slide: number; index: number }) {
    const all = Array.from(files ?? [])
    const tracks = all.filter(isGpx)
    if (tracks.length && useAppStore.getState().mode === 'collage') showToast('Kolaż jest bez trasy: plik GPX wgrasz w nowym projekcie z trasą.', undefined, true)
    else for (const file of tracks) void loadGpxFile(file)
    const photos = all.filter((f) => f.type.startsWith('image/'))
    if (photos.length) void loadPhotoFiles(photos, target)
  }

  return { importFiles }
}
