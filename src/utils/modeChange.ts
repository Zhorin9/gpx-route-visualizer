import type { DocumentState } from '../store/types'
import type { ProjectMode } from '../types'

export const MODE_LABELS: Record<ProjectMode, string> = { map: 'Mapa', collage: 'Kolaż' }

export interface ModeChange {
  keep: string[]
  // Empty: nothing goes.
  lose: string[]
}

// What a change of project type keeps and what goes, for the dialog that asks first. A map project
// turned into a collage loses the route and everything drawn from it; the other way only adds.
export function describeModeChange(to: ProjectMode, doc: Pick<DocumentState, 'routeSource' | 'waypoints' | 'collage'>): ModeChange {
  const keep = ['Zdjęcia, układ i karuzela', 'Teksty', 'Styl']
  if (to === 'map') return { keep: [...keep, 'Animacja'], lose: [] }
  return {
    keep: [...keep, 'Animacja (zdjęcia wchodzą po kolei)'],
    lose: [
      ...(doc.routeSource ? ['Trasa z GPX i przystanki podróży', 'Statystyki i profil wysokości'] : []),
      ...(doc.waypoints.length ? [`Miejsca na trasie (${doc.waypoints.length})`] : []),
      ...(doc.collage.bgKind === 'map' ? ['Mapa w tle'] : []),
    ],
  }
}
