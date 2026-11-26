import { create } from 'zustand'

export const usePanningSticker = create<{ id: number | null; set: (id: number | null) => void }>((set) => ({
  id: null,
  set: (id) => set({ id }),
}))
