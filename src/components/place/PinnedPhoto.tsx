import { Group } from 'react-konva'
import { sketchPalette } from '../../features/map/sketch/draw'
import { DEFAULT_SLOT_CROP } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import type { Waypoint } from '../../types'
import type { PinnedMarker } from './placeLayout'

export default function PinnedPhoto({ pinned: { photo, Marker, width, top }, waypoint }: { pinned: PinnedMarker; waypoint: Waypoint }) {
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const onSketch = useAppStore((s) => s.collage.bgKind === 'map' && s.map.kind === 'sketch')
  const paper = useAppStore((s) => sketchPalette(s.map).paper)
  return (
    <Group y={top}>
      <Marker
        photo={photo}
        width={width}
        color={onSketch ? paper : waypoint.color}
        crop={waypoint.photoCrop ?? DEFAULT_SLOT_CROP}
        onCrop={(photoCrop) => updateWaypoint(waypoint.id, { photoCrop })}
      />
    </Group>
  )
}
