import { Shape } from 'react-konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../../core/formats/registry'
import { useAppStore } from '../../../store/useAppStore'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import type { AspectKey } from '../../../types'
import { PROFILE_KIND, profileHeight, type ProfileSettings } from '../types'
import { useProfileColors, useProfileData, useProfileMarkerPos } from '../useProfile'
import { profileChart } from './chart'
import { sampleCount } from './chartPainters'
import { buildOverlays } from './overlays'
import { paintProfile } from './paintProfile'
import PositionMarker from './PositionMarker'
import SceneItems from './SceneItems'

function profileWidth(settings: ProfileSettings, aspectKey: AspectKey) {
  const frameWidth = FORMATS[aspectKey].w
  return settings.layout === 'overlay' ? frameWidth : Math.round((frameWidth * settings.widthPct) / 100)
}

function framePosition(settings: ProfileSettings, aspectKey: AspectKey, width: number, height: number) {
  const { w, h } = FORMATS[aspectKey]
  if (settings.layout === 'overlay') return { x: 0, y: h - height }
  return { x: (w - width) / 2, y: h - bottomInset(aspectKey) - height }
}

export default function ElevationProfileNode() {
  const settings = useAppStore((s) => s.profile)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const units = useAppStore((s) => s.statsContent.units)
  useAppStore((s) => s.fontsVersion)

  const width = profileWidth(settings, aspectKey)
  const height = profileHeight(settings)
  const data = useProfileData(sampleCount(settings.style, width))
  const colors = useProfileColors(data)
  const markerPos = useProfileMarkerPos()
  if (!data) return null

  const fontStyle = konvaFontStyle(fontFamily)
  const chart = profileChart({ data, settings, width, height, colors, units, measure: (text, size) => measureTextWidth(text, fontFamily, size, fontStyle) })
  const pos = framePosition(settings, aspectKey, width, height)

  return (
    <DraggableElement kind={PROFILE_KIND} width={width} height={height} defaultX={pos.x} defaultY={pos.y}>
      <Shape sceneFunc={(context) => paintProfile(context._context, chart, settings, colors)} listening={false} perfectDrawEnabled={false} />
      <SceneItems items={buildOverlays(chart, settings)} color={textColor} fontFamily={fontFamily} fontStyle={fontStyle} />
      {markerPos != null && <PositionMarker chart={chart} trackPos={markerPos} color={textColor} />}
    </DraggableElement>
  )
}
