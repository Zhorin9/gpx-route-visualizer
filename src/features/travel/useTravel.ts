import { nextId } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import { addStop, type Journey } from './model/journey'
import { useJourney } from './useJourney'
import type { Stop } from '../../types'

// What the map and the panel both do to the trip: change it, add a stop at the end.
export function useTravelActions() {
  const journey = useJourney()
  const setJourney = useAppStore((s) => s.setJourney)
  const nextMode = useAppStore((s) => s.nextMode)
  const selectTravel = useAppStore((s) => s.selectTravel)
  const change = (j: Journey, label: string) => void setJourney(j, label)
  function addAt(stop: Omit<Stop, 'id'>) {
    const next = addStop(journey, { ...stop, id: nextId(journey.stops) }, nextMode)
    // The new leg is the one to look at next.
    if (next.legs.length) selectTravel({ kind: 'leg', index: next.legs.length - 1 })
    change(next, 'add')
  }
  return { journey, change, addAt }
}

// The letter a stop is marked with on the map and in the list: A, B, … Z, then numbers.
export const stopLetter = (index: number) => (index < 26 ? String.fromCharCode(65 + index) : String(index + 1))
