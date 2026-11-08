import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/types'

// The store as it was before frames started running the document through other formats.
export default function useStoreAtRest(): AppState {
  const state = useAppStore((s) => s)
  const [atRest, setAtRest] = useState(state)
  if (!state.exporting && atRest !== state) setAtRest(state)
  return state.exporting ? atRest : state
}
