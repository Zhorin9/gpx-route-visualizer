import { useEffect, useState } from 'react'
import { countryShape, loadCountries, type CountryShape, type LonLat } from './countries'
import type { GpxPoint } from '../../types'

export default function useCountryRings(points: GpxPoint[] | undefined, lo: number, hi: number, wanted: boolean): CountryShape | null {
  const [shape, setShape] = useState<CountryShape | null>(null)
  useEffect(() => {
    if (!wanted || !points) return setShape(null)
    let live = true
    const route = points.slice(lo, hi + 1).map((p): LonLat => [p.lon, p.lat])
    loadCountries()
      .then((topo) => live && setShape(countryShape(topo, route)))
      .catch(() => live && setShape(null))
    return () => {
      live = false
    }
  }, [points, lo, hi, wanted])
  return wanted ? shape : null
}
