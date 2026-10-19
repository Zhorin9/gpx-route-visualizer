import FileButton from './ui/FileButton'
import { IconClose, IconUpload } from './icons'
import useGpxImport from '../hooks/useGpxImport'
import { useAppStore } from '../store/useAppStore'

export const PHOTO_DRAG_TYPE = 'application/x-gpx-photo'

// Uploaded photos; drag one onto a slot to place it there.
export default function PhotoTape() {
  const photos = useAppStore((s) => s.photos)
  const slides = useAppStore((s) => s.slides)
  const placePhoto = useAppStore((s) => s.placePhoto)
  const removePhoto = useAppStore((s) => s.removePhoto)
  const { importFiles } = useGpxImport()

  const used = new Set(slides.flatMap((slide) => Object.values(slide.slots).map((a) => a.photoId)))

  return (
    <div className="photo-tape">
      <span className="photo-tape-title">Taśma zdjęć</span>
      <div className="photo-tape-list">
        {photos.length === 0 && <span className="photo-tape-empty">Wgrane zdjęcia pojawią się tutaj — kliknij zdjęcie lub przeciągnij je do slotu.</span>}
        {photos.map((photo) => (
          <span key={photo.id} className="photo-tape-item">
            <img
              src={photo.thumb}
              alt={photo.name}
              title={`${photo.name} — kliknij, aby dodać do zaznaczonego slotu, lub przeciągnij na kadr`}
              onClick={() => placePhoto(photo.id)}
              draggable
              className={used.has(photo.id) ? 'photo-tape-thumb used' : 'photo-tape-thumb'}
              onDragStart={(e) => {
                e.dataTransfer.setData(PHOTO_DRAG_TYPE, String(photo.id))
                e.dataTransfer.effectAllowed = 'copy'
              }}
            />
            <button type="button" className="photo-tape-remove" aria-label={`Usuń zdjęcie ${photo.name}`} title="Usuń z taśmy" onClick={() => removePhoto(photo.id)}>
              <IconClose width={12} height={12} />
            </button>
          </span>
        ))}
      </div>
      <FileButton accept="image/*" multiple onFiles={(files) => importFiles(files)} icon={<IconUpload />}>
        Wgraj zdjęcia
      </FileButton>
    </div>
  )
}
