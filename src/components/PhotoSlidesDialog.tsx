import { selectTrack } from '../store/derived'
import { useDayBreaks } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { plural } from '../utils/format'
import { formatDistance } from '../core/units'
import { matchGeo, seriesRoute } from '../utils/series'
import Button from './ui/Button'
import Dialog from './ui/Dialog'

export default function PhotoSlidesDialog() {
  const loaded = useAppStore((s) => s.photoImport)
  const confirm = useAppStore((s) => s.confirmPhotoSlides)
  const cancel = useAppStore((s) => s.cancelPhotoSlides)
  const units = useAppStore((s) => s.statsContent.units)
  const route = seriesRoute(useAppStore((s) => selectTrack(s)?.points ?? null), useDayBreaks())

  if (!loaded) return null
  const places = loaded.flatMap((p) => {
    const place = route ? matchGeo(route.points, p.geo) : null
    return place ? [route!.cumKm[place.index]] : []
  })
  const missing = loaded.length - places.length
  const n = loaded.length

  return (
    <Dialog onClose={cancel} title={`${n} ${plural(n, 'zdjęcie', 'zdjęcia', 'zdjęć')} do serii`}>
      {route ? (
        <>
          <p>
            {places.length} z {n} dopasowano do trasy według EXIF (miejsce lub czas zrobienia).
          </p>
          <ul className="photo-slides-summary">
            {places.length > 0 && (
              <li>
                <span>{places.length} z lokalizacją lub czasem</span>
                <span className="text-muted">
                  {formatDistance(Math.min(...places), units, 0)} – {formatDistance(Math.max(...places), units, 0)}
                </span>
              </li>
            )}
            {missing > 0 && (
              <li>
                <span>{missing} bez dopasowania</span>
                <span className="text-muted">miejsce ustawisz w zakładce Zdjęcia</span>
              </li>
            )}
          </ul>
          <p className="hint">Slajdy ułożą się wzdłuż trasy. Kolejność zmienisz, przeciągając je na pasku.</p>
        </>
      ) : (
        <p className="hint">Bez trasy zdjęcia nie mają z czym się zgrać: slajdy powstaną w kolejności wyboru, bez mini-mapy i kilometra.</p>
      )}
      <div className="dialog-actions">
        <Button variant="ghost" onClick={cancel}>
          Anuluj
        </Button>
        {route && <Button onClick={() => confirm(false)}>Pomiń dopasowanie</Button>}
        <Button variant="primary" onClick={() => confirm(true)}>
          Utwórz {n} {plural(n, 'slajd', 'slajdy', 'slajdów')}
        </Button>
      </div>
    </Dialog>
  )
}
