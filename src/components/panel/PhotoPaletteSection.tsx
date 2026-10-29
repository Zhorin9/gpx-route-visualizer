import { useEffect, useReducer, useState } from 'react'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { useAppStore } from '../../store/useAppStore'
import { paletteFrom } from '../../features/map/model/styles'
import { photoPalette, photoTheme, THEME_VARIANTS, type PhotoPalette, type PhotoTheme } from '../../utils/photoPalette'
import type { Photo } from '../../types'

const ROLES: { key: keyof PhotoTheme; label: string }[] = [
  { key: 'route', label: 'Trasa' },
  { key: 'bg', label: 'Tło' },
  { key: 'text', label: 'Tekst' },
  { key: 'accent', label: 'Akcent' },
]

// The last result, kept while the tab is closed: the library only changes when photos are added or removed.
let cached: { photos: Photo[]; palette: PhotoPalette } | null = null

// A small map in the proposed colours: land, water and roads as the map background would get them.
function MapThumb({ theme }: { theme: PhotoTheme }) {
  const map = paletteFrom({ from: theme.bg, to: theme.bg }, theme.text)
  const route = 'M10 58 C22 40 34 50 44 34 S66 30 74 20 S98 22 110 10'
  return (
    <svg className="photo-palette-map" viewBox="0 0 120 68" aria-hidden="true" fill="none" strokeLinecap="round">
      <rect width="120" height="68" fill={map.land} />
      <path d="M78 68 C80 52 96 44 120 46 V68 Z" fill={map.water} />
      <path d="M0 0 H34 C30 12 14 20 0 18 Z" fill={map.green} />
      <path d="M0 40 L120 28 M52 0 L62 68 M0 62 L60 50" stroke={map.road} strokeWidth="1.5" />
      <path d={route} stroke={theme.accent} strokeWidth="6" opacity="0.45" />
      <path d={route} stroke={theme.route} strokeWidth="2.5" />
      <text x="10" y="13" fill={theme.text} fontSize="8" fontWeight="600" letterSpacing="0.1em">
        TRASA
      </text>
    </svg>
  )
}

// Colours worked out from the photo library, proposed as a look; nothing changes until "Zastosuj".
export default function PhotoPaletteSection() {
  const photos = useAppStore((s) => s.photos)
  const applyPhotoTheme = useAppStore((s) => s.applyPhotoTheme)
  const [variant, setVariant] = useState(0)
  const [, refresh] = useReducer((n: number) => n + 1, 0)
  const palette = cached?.photos === photos ? cached.palette : null
  const theme = palette && photoTheme(palette, variant)
  const applied = useAppStore((s) => theme != null && s.routeStyle.color === theme.route && s.routeStyle.glowColor === theme.accent && s.statsStyle.color === theme.text && s.collage.gradient.from === theme.bg)

  useEffect(() => {
    if (!photos.length || cached?.photos === photos) return
    const timer = setTimeout(() => {
      cached = { photos, palette: photoPalette(photos.map((p) => p.image)) }
      setVariant(0)
      refresh()
    }, 300)
    return () => clearTimeout(timer)
  }, [photos])

  if (!photos.length) return null

  return (
    <Section title="Z Twoich zdjęć">
      {theme ? (
        <>
          <div className="photo-palette">
            <div className="photo-palette-swatches">
              {ROLES.map(({ key, label }) => (
                <span key={key} className="photo-palette-swatch">
                  <span style={{ background: theme[key] }} title={theme[key]} />
                  {label}
                </span>
              ))}
            </div>
            <MapThumb theme={theme} />
          </div>
          {palette.grey && <p className="hint">Zdjęcia mają mało koloru, propozycja oparta na odcieniach szarości.</p>}
          <div className="button-row photo-palette-actions">
            <Button disabled={applied} onClick={() => applyPhotoTheme(theme)}>
              {applied ? 'Zastosowano' : 'Zastosuj'}
            </Button>
            <button type="button" className="link-btn" onClick={() => setVariant((v) => (v + 1) % THEME_VARIANTS.length)}>
              Inna propozycja
            </button>
          </div>
        </>
      ) : (
        <p className="hint" role="status">
          Liczę kolory ze zdjęć…
        </p>
      )}
    </Section>
  )
}
