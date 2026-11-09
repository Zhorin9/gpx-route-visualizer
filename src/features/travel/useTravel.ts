import { nextId } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import { addStop, insertStop, type Journey } from './model/journey'
import { useJourney } from './useJourney'
import type { Stop } from '../../types'

export function useTravelActions() {
  const journey = useJourney()
  const setJourney = useAppStore((s) => s.setJourney)
  const nextMode = useAppStore((s) => s.nextMode)
  const insert = useAppStore((s) => s.travelInsert)
  const selectTravel = useAppStore((s) => s.selectTravel)
  const setTravelInsert = useAppStore((s) => s.setTravelInsert)
  const change = (j: Journey, label: string) => setJourney(j, label)
  // `into`: the leg the stop splits; by default the one picked for it, if any.
  function addAt(stop: Omit<Stop, 'id'>, into = insert) {
    const added = { ...stop, id: nextId(journey.stops) }
    if (into != null && into < journey.legs.length) {
      setTravelInsert(null)
      selectTravel({ kind: 'stop', id: added.id })
      return change(insertStop(journey, added, into), 'insert')
    }
    setTravelInsert(null)
    const next = addStop(journey, added, nextMode)
    // The new leg is the one to look at next.
    if (next.legs.length) selectTravel({ kind: 'leg', index: next.legs.length - 1 })
    change(next, 'add')
  }
  return { journey, change, addAt }
}

export const stopLetter = (index: number) => (index < 26 ? String.fromCharCode(65 + index) : String(index + 1))
