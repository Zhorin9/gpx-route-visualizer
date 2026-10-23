import type { SliceContext } from '../../store/types'
import { PROFILE_KIND, type ProfileLayout, type ProfileSettings } from './types'

export interface ProfileSlice {
  updateProfile: (patch: Partial<ProfileSettings>) => void
  // A preset size and place; drops the hand-placed position so the preset applies.
  setProfileLayout: (layout: ProfileLayout) => void
}

export function createProfileSlice({ commit }: SliceContext): ProfileSlice {
  return {
    updateProfile: (patch) => commit(`profile:${Object.keys(patch).join()}`, (s) => ({ profile: { ...s.profile, ...patch } })),
    setProfileLayout: (layout) =>
      commit('profile:layout', (s) => {
        const placements = { ...s.placements }
        delete placements[PROFILE_KIND]
        return { profile: { ...s.profile, layout }, placements }
      }),
  }
}
