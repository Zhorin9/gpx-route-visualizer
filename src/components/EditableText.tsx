import { useEffect, useRef } from 'react'
import { Text } from 'react-konva'
import type Konva from 'konva'
import { useLayerAnimation } from '../core/animation/layers'
import { SNAP_TARGET, snapDragEnd, snapDragMove } from '../core/canvas/snapDrag'
import useInlineTextEditor from '../hooks/useInlineTextEditor'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS } from '../utils/aspects'
import { konvaFontStyle } from '../utils/fonts'
import { displayText, fittedTitleSize } from '../utils/title'
import SelectionOutline from './SelectionOutline'
import type { TextNode } from '../types'

export default function EditableText({ node }: { node: TextNode }) {
  const isSelected = useAppStore((s) => s.selection?.kind === 'text' && s.selection.id === node.id)
  const select = useAppStore((s) => s.select)
  const updateText = useAppStore((s) => s.updateText)
  const { hidden, edit } = useInlineTextEditor()
  const shapeRef = useRef<Konva.Text>(null)
  const outlineRef = useRef<Konva.Text>(null)
  const frameW = useAppStore((s) => ASPECTS[s.aspectKey].w)
  const isTitle = node.role === 'title'
  const fontsVersion = useAppStore((s) => s.fontsVersion)
  const animation = useLayerAnimation('header')

  // Konva lays text out once; widths measured with a fallback font would stay wrong after the real one loads.
  useEffect(() => {
    for (const shape of [shapeRef.current, outlineRef.current]) {
      shape?._setTextData()
      shape?.getLayer()?.batchDraw()
    }
  }, [fontsVersion])

  function startEditing(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    edit(e.target as Konva.Text, { value: node.text, onCommit: (text) => updateText(node.id, { text }) })
  }

  const shared = {
    text: displayText(node),
    // A title spans the frame and centres itself, whatever its font or length.
    ...(isTitle ? { width: frameW, align: 'center', wrap: 'none' } : null),
    x: node.x,
    y: node.y + animation.offsetY,
    rotation: node.rotation,
    fontSize: isTitle ? fittedTitleSize(node, frameW) : node.fontSize,
    fontFamily: node.fontFamily,
    fontStyle: konvaFontStyle(node.fontFamily, { bold: node.bold, italic: node.italic }),
    letterSpacing: node.letterSpacing,
    opacity: node.opacity * animation.opacity,
    perfectDrawEnabled: false,
  }

  return (
    <>
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
        fill={node.color}
        visible={!hidden}
        name={SNAP_TARGET}
        draggable
        onMouseDown={() => select({ kind: 'text', id: node.id })}
        onTouchStart={() => select({ kind: 'text', id: node.id })}
        onDblClick={startEditing}
        onDblTap={startEditing}
        onDragMove={snapDragMove}
        onDragEnd={(e) => {
          snapDragEnd(e)
          updateText(node.id, { x: e.target.x(), y: e.target.y() - animation.offsetY })
        }}
        shadowColor="#000000"
        shadowBlur={node.shadowEnabled ? 10 : 0}
        shadowOpacity={node.shadowEnabled ? 0.6 : 0}
      />
      <SelectionOutline targetRef={shapeRef} visible={isSelected && !hidden} />
    </>
  )
}
