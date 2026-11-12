import { useCallback, useSyncExternalStore } from 'react'

export const PHONE_QUERY = '(max-width: 640px)'
export const SHEET_QUERY = '(max-width: 640px) and (orientation: portrait)'

export default function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
