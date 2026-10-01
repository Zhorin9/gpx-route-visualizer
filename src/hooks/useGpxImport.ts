import { useAppStore } from '../store/useAppStore'

function isGpx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.gpx') || file.type === 'application/gpx+xml'
}

// Routes picked or dropped files to the right loader: .gpx → track, image → background.
export default function useGpxImport() {
  const loadGpxFile = useAppStore((s) => s.loadGpxFile)
  const loadBackgroundFile = useAppStore((s) => s.loadBackgroundFile)

  function importFiles(files: FileList | File[] | null | undefined) {
    for (const file of Array.from(files ?? [])) {
      if (isGpx(file)) void loadGpxFile(file)
      else if (file.type.startsWith('image/')) void loadBackgroundFile(file)
    }
  }

  return { importFiles }
}
