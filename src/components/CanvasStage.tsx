import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva'
import type Konva from 'konva'
import useBackgroundPhoto from '../hooks/useBackgroundPhoto'
import { useHasRoute } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS, STORY_SAFE_ZONE } from '../utils/aspects'
import { stageHandle } from '../utils/exportImage'
import EditableText from './EditableText'
import NeonRouteGroup from './NeonRouteGroup'
import StatsHeaderGroup from './StatsHeaderGroup'

const BACKGROUND = 'background'

function BackgroundLayer() {
  const { image, layout } = useBackgroundPhoto()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const dimOpacity = useAppStore((s) => s.dimOpacity)
  const updateBgAdjust = useAppStore((s) => s.updateBgAdjust)
  const { w, h } = ASPECTS[aspectKey]

  if (!image || !layout) return null

  // Keeps the photo covering the whole frame while it's dragged.
  function clampToFrame(node: Konva.Node) {
    node.x(Math.max(w - layout!.width, Math.min(0, node.x())))
    node.y(Math.max(h - layout!.height, Math.min(0, node.y())))
  }

  return (
    <Layer>
      <KonvaImage
        name={BACKGROUND}
        image={image}
        {...layout}
        draggable
        onDragMove={(e) => clampToFrame(e.target)}
        onDragEnd={(e) =>
          updateBgAdjust({
            offsetX: e.target.x() - (w - layout.width) / 2,
            offsetY: e.target.y() - (h - layout.height) / 2,
          })
        }
        onMouseEnter={(e) => e.target.getStage()?.container().classList.add('can-pan')}
        onMouseLeave={(e) => e.target.getStage()?.container().classList.remove('can-pan')}
      />
      {dimOpacity > 0 && <Rect width={w} height={h} fill="#000000" opacity={dimOpacity} listening={false} />}
    </Layer>
  )
}

export default function CanvasStage({ previewScale }: { previewScale: number }) {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const hasBackground = useAppStore((s) => s.background !== null)
  const previewBackdrop = useAppStore((s) => s.previewBackdrop)
  const adding = useAppStore((s) => s.addingWaypoint)
  const showSafeZones = useAppStore((s) => s.showSafeZones)
  const texts = useAppStore((s) => s.texts)
  const select = useAppStore((s) => s.select)
  const hasRoute = useHasRoute()

  const { w, h } = ASPECTS[aspectKey]
  const isCheckerboard = !hasBackground && previewBackdrop === 'checkerboard'
  const classes = ['stage-wrapper', isCheckerboard && 'checkerboard', adding && 'is-adding'].filter(Boolean).join(' ')

  function handlePointerDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const target = e.target
    if (target === target.getStage() || target.hasName(BACKGROUND)) select(null)
  }

  return (
    <div
      className={classes}
      style={{
        width: w * previewScale,
        height: h * previewScale,
        ...(!hasBackground && !isCheckerboard ? { background: previewBackdrop } : null),
      }}
    >
      {/* Sized to the preview, not the export: a full 1080×1920 canvas
          would be redrawn at every change only to be cropped by CSS. */}
      <Stage
        ref={(stage) => {
          stageHandle.current = stage
        }}
        width={w * previewScale}
        height={h * previewScale}
        scaleX={previewScale}
        scaleY={previewScale}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {hasBackground && <BackgroundLayer />}
        <Layer>{hasRoute && <NeonRouteGroup />}</Layer>
        <Layer>
          <StatsHeaderGroup />
          {texts.map((node) => (
            <EditableText key={node.id} node={node} />
          ))}
        </Layer>
      </Stage>

      {/* HTML overlay, so it can never end up in an exported image. */}
      {aspectKey === '9:16' && showSafeZones && (
        <div className="safe-zones" aria-hidden="true">
          <div className="safe-zone" style={{ height: STORY_SAFE_ZONE.top * previewScale }}>
            <span>Pasek profilu Instagrama</span>
          </div>
          <div className="safe-zone bottom" style={{ height: STORY_SAFE_ZONE.bottom * previewScale }}>
            <span>Pole odpowiedzi</span>
          </div>
        </div>
      )}
    </div>
  )
}
