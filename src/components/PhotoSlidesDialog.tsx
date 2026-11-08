import { useTranslation } from 'react-i18next'
import { selectTrack } from '../store/derived'
import { useDayBreaks } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
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
  const { t } = useTranslation()

  if (!loaded) return null
  const places = loaded.flatMap((p) => {
    const place = route ? matchGeo(route.points, p.geo) : null
    return place ? [route!.cumKm[place.index]] : []
  })
  const missing = loaded.length - places.length
  const n = loaded.length

  return (
    <Dialog onClose={cancel} title={t('photoSlidesDialog.title', { count: n })}>
      {route ? (
        <>
          <p>
            {t('photoSlidesDialog.matched', { matched: places.length, count: n })}
          </p>
          <ul className="photo-slides-summary">
            {places.length > 0 && (
              <li>
                <span>{t('photoSlidesDialog.withPlace', { count: places.length })}</span>
                <span className="text-muted">
                  {formatDistance(Math.min(...places), units, 0)} – {formatDistance(Math.max(...places), units, 0)}
                </span>
              </li>
            )}
            {missing > 0 && (
              <li>
                <span>{t('photoSlidesDialog.unmatched', { count: missing })}</span>
                <span className="text-muted">{t('photoSlidesDialog.unmatchedHint')}</span>
              </li>
            )}
          </ul>
          <p className="hint">{t('photoSlidesDialog.alongRoute')}</p>
        </>
      ) : (
        <p className="hint">{t('photoSlidesDialog.noRoute')}</p>
      )}
      <div className="dialog-actions">
        <Button variant="ghost" onClick={cancel}>
          {t('photoSlidesDialog.cancel')}
        </Button>
        {route && <Button onClick={() => confirm(false)}>{t('photoSlidesDialog.skipMatching')}</Button>}
        <Button variant="primary" onClick={() => confirm(true)}>
          {t('photoSlidesDialog.create', { count: n })}
        </Button>
      </div>
    </Dialog>
  )
}
