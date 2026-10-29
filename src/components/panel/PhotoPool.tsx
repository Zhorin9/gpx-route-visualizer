import FileButton from '../ui/FileButton'
import Section from '../ui/Section'
import SliderField from '../fields/SliderField'
import { IconClose, IconUpload } from '../icons'
import useGpxImport from '../../hooks/useGpxImport'
import { useAppStore } from '../../store/useAppStore'

export const PHOTO_DRAG_TYPE = 'application/x-gpx-photo'

// Uploaded photos; click one to fill the selected slot, or drag it onto a slot.
export default function PhotoPool() {
  const photos = useAppStore((s) => s.photos)
  const slides = useAppStore((s) => s.slides)
  const placePhoto = useAppStore((s) => s.placePhoto)
  const removePhoto = useAppStore((s) => s.removePhoto)
  const photoError = useAppStore((s) => s.photoError)
  const dimOpacity = useAppStore((s) => s.dimOpacity)
  const setDimOpacity = useAppStore((s) => s.setDimOpacity)
  const { importFiles } = useGpxImport()

  const used = new Set(slides.flatMap((slide) => Object.values(slide.slots).map((a) => a.photoId)))

  return (
    <Section title="Zdjęcia">
      {photos.length > 0 && (
        <div className="photo-pool">
          {photos.map((photo) => (
            <span key={photo.id} className="photo-pool-item">
              <img
                src={photo.thumb}
                alt={photo.name}
                title={`${photo.name} — kliknij, aby dodać do zaznaczonego slotu, lub przeciągnij na kadr`}
                onClick={() => placePhoto(photo.id)}
                draggable
                className={used.has(photo.id) ? 'photo-pool-thumb used' : 'photo-pool-thumb'}
                onDragStart={(e) => {
                  e.dataTransfer.setData(PHOTO_DRAG_TYPE, String(photo.id))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
              />
              <button type="button" className="photo-pool-remove" aria-label={`Usuń zdjęcie ${photo.name}`} title="Usuń z projektu" onClick={() => removePhoto(photo.id)}>
                <IconClose width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {photoError && (
        <p className="error" role="alert">
          {photoError}
        </p>
      )}
      <FileButton accept="image/*" multiple onFiles={importFiles} variant={photos.length ? 'secondary' : 'primary'} icon={<IconUpload />} block>
        Dodaj zdjęcia
      </FileButton>
      <p className="hint">
        {photos.length
          ? 'Kliknij zdjęcie, aby wstawić je do zaznaczonego slotu, albo przeciągnij je na kadr. Obwódka oznacza zdjęcie użyte w projekcie.'
          : 'Wybierz zdjęcia z dysku albo przeciągnij je na podgląd. Wypełnią sloty po kolei.'}
      </p>
      {photos.length > 0 && <SliderField label="Przyciemnienie" unit="%" value={Math.round(dimOpacity * 100)} defaultValue={0} onChange={(v) => setDimOpacity(v / 100)} />}
    </Section>
  )
}
