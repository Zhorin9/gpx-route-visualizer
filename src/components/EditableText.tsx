import { useEffect, useRef } from 'react'
import { Text } from 'react-konva'
import type Konva from 'konva'
import { useLayerAnimation, useTypedCount } from '../core/animation/layers'
import { SNAP_TARGET, snapDragEnd, snapDragMove } from '../core/canvas/snapDrag'
import useInlineTextEditor from '../hooks/useInlineTextEditor'
import { useAppStore } from '../store/useAppStore'
import { textColumn } from '../core/formats/registry'
import { konvaFontStyle } from '../utils/fonts'
import { displayText, fittedTitleSize } from '../utils/title'
import SelectionOutline from './SelectionOutline'
import { useSlideAt, useStickerColor } from '../store/selectors'
import SlideBox from './SlideBox'
import type { TextNode, TextWarp } from '../types'
import { TEXT_SHADOW } from '../core/canvas/shadows'
import WarpedText from './WarpedText'
import BadgeBack from './BadgeBack'
import useWarpedLine from '../hooks/useWarpedLine'

// The hook runs for a straight text too, on no letters.
const STRAIGHT: TextWarp = { kind: 'wave', amount: 0 }

export default function EditableText({ node }: { node: TextNode }) {
  const isSelected = useAppStore((s) => s.selection?.kind === 'text' && s.selection.id === node.id)
  const select = useAppStore((s) => s.select)
  const updateText = useAppStore((s) => s.updateText)
  const { hidden, edit } = useInlineTextEditor()
  const shapeRef = useRef<Konva.Text>(null)
  const warpedRef = useRef<Konva.Shape>(null)
  const outlineRef = useRef<Konva.Text>(null)
  const span = useAppStore((s) => textColumn(s.aspectKey).w)
  const isTitle = node.role === 'title'
  const fontsVersion = useAppStore((s) => s.fontsVersion)
  const animation = useLayerAnimation('header')
  const slide = useSlideAt(node.x)
  const sticker = useStickerColor(slide)
  const color = sticker ?? node.color
  const full = displayText(node)
  const typed = useTypedCount(full.length, node.typing?.cps ?? 0)
  const shown = node.typing ? typed : full.length
  const fontSize = isTitle ? fittedTitleSize(node, span) : node.fontSize
  const fontStyle = konvaFontStyle(node.fontFamily, { bold: node.bold, italic: node.italic })
  const warp = node.warp ?? STRAIGHT
  const line = useWarpedLine(node, node.warp ? full : '', warp, fontSize, fontStyle)

  // Konva lays text out once; widths measured with a fallback font would stay wrong after the real one loads.
  useEffect(() => {
    for (const shape of [shapeRef.current, outlineRef.current]) {
      shape?._setTextData()
      shape?.getLayer()?.batchDraw()
    }
  }, [fontsVersion])

  // A warped text is edited over its plain twin, which is laid out but never drawn.
  function startEditing() {
    if (shapeRef.current) edit(shapeRef.current, { value: node.text, onCommit: (text) => updateText(node.id, { text }) })
  }

  const shared = {
    // While typing, a caret stands where the next letter will come.
    text: shown < full.length ? `${full.slice(0, shown)}▍` : full,
    // A title spans the frame (or the side column) and centres itself, whatever its font or length.
    ...(isTitle ? { width: span, align: 'center', wrap: 'none' } : null),
    x: node.x,
    y: node.y + animation.offsetY,
    rotation: node.rotation,
    fontSize,
    fontFamily: node.fontFamily,
    fontStyle,
    letterSpacing: node.letterSpacing,
    opacity: node.opacity * animation.opacity,
    perfectDrawEnabled: false,
  }

  const select_ = () => select({ kind: 'text', id: node.id })

  if (node.warp) {
    // A title keeps centring itself in its column.
    const shift = isTitle ? (span - line.width) / 2 : 0
    return (
      <SlideBox slide={slide}>
        <Text ref={shapeRef} {...shared} text={full} visible={false} listening={false} />
        <WarpedText
          ref={warpedRef}
          node={node}
          line={line}
          shown={shown}
          fontSize={fontSize}
          fontStyle={fontStyle}
          color={color}
          x={node.x + shift}
          y={shared.y}
          rotation={node.rotation}
          opacity={shared.opacity}
          visible={!hidden}
          name={SNAP_TARGET}
          draggable
          onMouseDown={select_}
          onTouchStart={select_}
          onDblClick={startEditing}
          onDblTap={startEditing}
          onDragMove={snapDragMove}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            snapDragEnd(e)
            updateText(node.id, { x: e.target.x() - shift, y: e.target.y() - animation.offsetY })
          }}
        />
        <SelectionOutline targetRef={warpedRef} visible={isSelected && !hidden} />
      </SlideBox>
    )
  }

  const badgeColor = sticker ?? node.badge?.color

  return (
    <SlideBox slide={slide}>
      {node.badge && badgeColor && (
        <BadgeBack
          badge={node.badge}
          color={badgeColor}
          text={full}
          x={shared.x}
          y={shared.y}
          rotation={node.rotation}
          opacity={shared.opacity}
          fontSize={fontSize}
          fontFamily={node.fontFamily}
          fontStyle={fontStyle}
          letterSpacing={node.letterSpacing}
          width={isTitle ? span : undefined}
        />
      )}
      {/* The outline casts the shadow too, so it is a copy of glyphs and outline together. */}
      {node.hardShadow && (
        <Text
          {...shared}
          x={shared.x + node.hardShadow.dx}
          y={shared.y + node.hardShadow.dy}
          fill={node.hardShadow.color}
          stroke={node.hardShadow.color}
          strokeWidth={node.outlineEnabled ? node.outlineWidth * 2 : 0}
          lineJoin="round"
          visible={!hidden}
          listening={false}
        />
      )}
      {/* Stroke drawn on a copy underneath, so the outline doesn't eat into the glyphs. */}
      {node.outlineEnabled && (
        <Text
          ref={outlineRef}
          {...shared}
          fill={node.outlineColor}
          stroke={node.outlineColor}
          strokeWidth={node.outlineWidth * 2}
          lineJoin="round"
          visible={!hidden}
          listening={false}
        />
      )}
      <Text
        ref={shapeRef}
        {...shared}
        fill={color}
        visible={!hidden}
        name={SNAP_TARGET}
        draggable
        onMouseDown={select_}
        onTouchStart={select_}
        onDblClick={startEditing}
        onDblTap={startEditing}
        onDragMove={snapDragMove}
        onDragEnd={(e) => {
          snapDragEnd(e)
          updateText(node.id, { x: e.target.x(), y: e.target.y() - animation.offsetY })
        }}
        {...TEXT_SHADOW}
        shadowEnabled={node.shadowEnabled && !node.hardShadow}
      />
      <SelectionOutline targetRef={shapeRef} visible={isSelected && !hidden} />
    </SlideBox>
  )
}
