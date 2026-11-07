import type { SliceContext } from '../../store/types'
import { withRouteClip } from '../animation/store'
import type { CameraSettings } from './model/camera'
import { INTRO_SECONDS } from './model/panorama'

export interface CameraSlice {
  updateCamera: (patch: Partial<CameraSettings>) => void
}

export function createCameraSlice({ commit }: SliceContext): CameraSlice {
  return {
    // The panorama comes down onto the start before the line sets off, so the line waits long enough for it.
    updateCamera: (patch) =>
      commit(`camera:${Object.keys(patch).join()}`, (s) => {
        const camera = { ...s.camera, ...patch }
        const route = s.animation.clips.route
        const intro = camera.mode === 'panorama' && camera.introOutro && route.start < INTRO_SECONDS
        return { camera, ...(intro ? { animation: withRouteClip(s.animation, { start: INTRO_SECONDS }) } : null) }
      }),
  }
}
