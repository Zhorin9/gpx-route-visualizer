import type { SliceContext } from '../../store/types'
import type { CameraSettings } from './model/camera'

export interface CameraSlice {
  updateCamera: (patch: Partial<CameraSettings>) => void
}

export function createCameraSlice({ commit }: SliceContext): CameraSlice {
  return {
    updateCamera: (patch) => commit(`camera:${Object.keys(patch).join()}`, (s) => ({ camera: { ...s.camera, ...patch } })),
  }
}
