import type { DocumentState } from '../store/types'
import type { ProjectMode } from '../types'
import i18n, { type TKey } from '../i18n'

export const MODE_LABELS: Record<ProjectMode, TKey> = { map: 'modeChange.map', collage: 'modeChange.collage' }

export interface ModeChange {
  keep: string[]
  lose: string[]
}

export function describeModeChange(to: ProjectMode, doc: Pick<DocumentState, 'routeSource' | 'waypoints' | 'collage'>): ModeChange {
  const keep = [i18n.t('modeChange.photos'), i18n.t('modeChange.texts'), i18n.t('modeChange.style')]
  if (to === 'map') return { keep: [...keep, i18n.t('modeChange.animation')], lose: [] }
  return {
    keep: [...keep, i18n.t('modeChange.photoAnimation')],
    lose: [
      ...(doc.routeSource ? [i18n.t('modeChange.route'), i18n.t('modeChange.stats')] : []),
      ...(doc.waypoints.length ? [i18n.t('modeChange.places', { n: doc.waypoints.length })] : []),
      ...(doc.collage.bgKind === 'map' ? [i18n.t('modeChange.mapBackground')] : []),
    ],
  }
}
