import { useEffect, useId, useRef, useState } from 'react'
import { IconSearch } from '../../../components/icons'
import { placeAt, searchPlaces, searchPlacesExact, type Place } from '../providers/geocoding'

// "54.35, 18.65" or "54.35 18.65": a point given by its coordinates.
function parseCoordinates(text: string): Place | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lat = Number(m[1])
  const lon = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, detail: 'współrzędne', lat, lon }
}

// Suggestions appear a moment after typing stops; an older request is cancelled.
const DEBOUNCE_MS = 300

// `inputId`: lets "+ Dodaj przystanek" in the panel put the cursor here.
export default function PlaceSearch({ label, near, onPick, inputId }: { label: string; near: { lat: number; lon: number } | null; onPick: (place: Place) => void; inputId?: string }) {
  const ownId = useId()
  const id = inputId ?? ownId
  const [query, setQuery] = useState('')
  // The precise search (Polish names of foreign places), asked for this query.
  const [exact, setExact] = useState(false)
  const [found, setFound] = useState<Place[]>([])
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)

  const coordinates = parseCoordinates(query)
  const isPoint = coordinates != null
  const text = query.trim()
  // The place at the coordinates names the stop, when there is one.
  const [named, setNamed] = useState<{ text: string; name: string } | null>(null)
  const point = coordinates && named?.text === text ? { ...coordinates, name: named.name, detail: coordinates.name } : coordinates
  const lat = coordinates?.lat
  const lon = coordinates?.lon
  useEffect(() => {
    if (lat == null || lon == null) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      placeAt({ lat, lon }, controller.signal).then(
        (place) => place && setNamed({ text, name: place.name }),
        () => undefined,
      )
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text, lat, lon])
  // Only biases the order of suggestions; a new stop shouldn't search again.
  const nearRef = useRef(near)
  useEffect(() => {
    nearRef.current = near
  })
  useEffect(() => {
    if (isPoint || text.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(
      () => {
        const search = exact ? searchPlacesExact(text, controller.signal) : searchPlaces(text, nearRef.current, controller.signal)
        search.then(
          (places) => {
            setFound(places)
            setActive(0)
            setError(places.length ? '' : 'Nie znaleziono takiego miejsca.')
          },
          (err) => !controller.signal.aborted && setError(err instanceof Error ? err.message : 'Wyszukiwarka nie odpowiedziała.'),
        )
      },
      exact ? 0 : DEBOUNCE_MS,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text, isPoint, exact])

  const options = point ? [point] : text.length < 2 ? [] : found
  // The last row asks the precise search, when it hasn't been asked yet.
  const offerExact = !point && text.length >= 2 && !exact
  const rows = options.length + (offerExact ? 1 : 0)

  function choose(i: number) {
    if (i < options.length) {
      onPick(options[i])
      setQuery('')
      setExact(false)
      setFound([])
      setError('')
    } else if (offerExact) {
      setExact(true)
    }
  }

  return (
    <div className="place-search">
      <IconSearch className="place-search-icon" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={rows > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={rows ? `${id}-${active}` : undefined}
        aria-label={label}
        placeholder="Szukaj miejsca lub współrzędnych"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setExact(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(rows - 1, a + 1))
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
          else if (e.key === 'Enter' && rows) choose(Math.min(active, rows - 1))
          else if (e.key === 'Escape') setQuery('')
          else return
          e.preventDefault()
        }}
      />
      {rows > 0 && (
        <ul className="place-options" role="listbox" id={`${id}-list`}>
          {options.map((place, i) => (
            <li
              key={`${place.lat},${place.lon},${i}`}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'place-option active' : 'place-option'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              <span>{place.name}</span>
              <small>{place.detail}</small>
            </li>
          ))}
          {offerExact && (
            <li
              id={`${id}-${options.length}`}
              role="option"
              aria-selected={active === options.length}
              className={active === options.length ? 'place-option more active' : 'place-option more'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(options.length)}
            >
              <span>Szukaj dokładniej: „{text}”</span>
              <small>także polskie nazwy miejsc za granicą</small>
            </li>
          )}
        </ul>
      )}
      {error && text.length >= 2 && !point && <p className="hint">{error}</p>}
    </div>
  )
}
