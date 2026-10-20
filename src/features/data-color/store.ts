import type { SliceContext } from '../../store/types'
import type { DataColorSettings } from './types'

export interface DataColorSlice {
  updateDataColor: (patch: Partial<DataColorSettings>) => void
}

export function createDataColorSlice({ commit }: SliceContext): DataColorSlice {
  return {
    updateDataColor: (patch) => commit(`dataColor:${Object.keys(patch).join()}`, (s) => ({ dataColor: { ...s.dataColor, ...patch } })),
  }
}
