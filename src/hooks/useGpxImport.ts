import { useAppStore } from '../store/useAppStore'

function isGpx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.gpx') || file.type === 'application/gpx+xml'
}

// Routes picked or dropped files to the right loader: .gpx → track, images → photo slots.
export default function useGpxImport() {
  const loadGpxFile = useAppStore((s) => s.loadGpxFile)
  const loadPhotoFiles = useAppStore((s) => s.loadPhotoFiles)

  function importFiles(files: FileList | File[] | null | undefined, target?: { slide: number; index: number }) {
    const all = Array.from(files ?? [])
    for (const file of all.filter(isGpx)) void loadGpxFile(file)
    const photos = all.filter((f) => f.type.startsWith('image/'))
    if (photos.length) void loadPhotoFiles(photos, target)
  }

  return { importFiles }
}
