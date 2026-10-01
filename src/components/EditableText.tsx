import { useRef } from 'react'
import { Text } from 'react-konva'
import type Konva from 'konva'
import useInlineTextEditor from '../hooks/useInlineTextEditor'
import { useAppStore } from '../store/useAppStore'
import { konvaFontStyle } from '../utils/fonts'
import SelectionOutline from './SelectionOutline'
import type { TextNode } from '../types'

export default function EditableText({ node }: { node: TextNode }) {
  const isSelected = useAppStore((s) => s.selection?.kind === 'text' && s.selection.id === node.id)
  const select = useAppStore((s) => s.select)
  const updateText = useAppStore((s) => s.updateText)
  const { hidden, edit } = useInlineTextEditor()
  const shapeRef = useRef<Konva.Text>(null)

  function startEditing(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    edit(e.target as Konva.Text, { value: node.text, onCommit: (text) => updateText(node.id, { text }) })
  }

  const shared = {
    text: node.text,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    fontSize: node.fontSize,
    fontFamily: node.fontFamily,
    fontStyle: konvaFontStyle(node.fontFamily, { bold: node.bold, italic: node.italic }),
    letterSpacing: node.letterSpacing,
    opacity: node.opacity,
    perfectDrawEnabled: false,
  }

  return (
    <>
      {/* Stroke drawn on a copy underneath, so the outline doesn't eat into the glyphs. */}
      {node.outlineEnabled && (
        <Text
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
        draggable
        onMouseDown={() => select({ kind: 'text', id: node.id })}
        onTouchStart={() => select({ kind: 'text', id: node.id })}
        onDblClick={startEditing}
        onDblTap={startEditing}
        onDragEnd={(e) => updateText(node.id, { x: e.target.x(), y: e.target.y() })}
        shadowColor="#000000"
        shadowBlur={node.shadowEnabled ? 10 : 0}
        shadowOpacity={node.shadowEnabled ? 0.6 : 0}
      />
      <SelectionOutline targetRef={shapeRef} visible={isSelected && !hidden} />
    </>
  )
}
