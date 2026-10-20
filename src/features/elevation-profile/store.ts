import type { SliceContext } from '../../store/types'
import { PROFILE_KIND, type ProfilePlacement, type ProfileSettings } from './types'

export interface ProfileSlice {
  updateProfile: (patch: Partial<ProfileSettings>) => void
  // A preset position; drops the hand-placed one so the preset applies.
  setProfilePlacement: (placement: ProfilePlacement) => void
}

export function createProfileSlice({ commit }: SliceContext): ProfileSlice {
  return {
    updateProfile: (patch) => commit(`profile:${Object.keys(patch).join()}`, (s) => ({ profile: { ...s.profile, ...patch } })),
    setProfilePlacement: (placement) =>
      commit('profile:placement', (s) => {
        const placements = { ...s.placements }
        delete placements[PROFILE_KIND]
        return { profile: { ...s.profile, placement }, placements }
      }),
  }
}
