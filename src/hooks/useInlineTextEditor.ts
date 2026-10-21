import { useState } from 'react'
import type Konva from 'konva'

export interface EditOptions {
  value: string
  onCommit: (value: string) => void
}

// Double-click a Konva.Text to edit it in place: overlays a <textarea>
// matching the node's font, position and rotation. Enter starts a new line,
// Ctrl+Enter or clicking away commits, Escape cancels.
export default function useInlineTextEditor() {
  const [hidden, setHidden] = useState(false)

  function edit(textNode: Konva.Text, { value, onCommit }: EditOptions) {
    const stage = textNode.getStage()
    if (!stage) return
    // Already includes the stage's preview scale.
    const scale = textNode.getAbsoluteScale().x
    const absPos = textNode.getAbsolutePosition()
    const stageBox = stage.container().getBoundingClientRect()
    const rotation = textNode.getAbsoluteRotation()

    setHidden(true)

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.value = value
    textarea.setAttribute('aria-label', 'Edytuj tekst')
    Object.assign(textarea.style, {
      position: 'fixed',
      top: `${stageBox.top + absPos.y}px`,
      left: `${stageBox.left + absPos.x}px`,
      minWidth: '40px',
      width: `${Math.max(textNode.width() * scale + 20, 40)}px`,
      height: `${textNode.height() * scale + 8}px`,
      fontSize: `${textNode.fontSize() * scale}px`,
      fontFamily: `"${textNode.fontFamily()}", sans-serif`,
      fontStyle: textNode.fontStyle().includes('italic') ? 'italic' : 'normal',
      fontWeight: textNode.fontStyle().replace('italic', '').trim() || 'normal',
      letterSpacing: `${textNode.letterSpacing() * scale}px`,
      color: textNode.fill() as string,
      transform: rotation ? `rotate(${rotation}deg)` : '',
      transformOrigin: 'left top',
      background: 'rgba(0, 0, 0, 0.25)',
      border: '1px dashed #4f9dff',
      padding: '0',
      margin: '0',
      overflow: 'hidden',
      outline: 'none',
      resize: 'none',
      lineHeight: String(textNode.lineHeight()),
      textAlign: textNode.align(),
      whiteSpace: 'pre',
      zIndex: '1000',
    })
    textarea.focus()
    textarea.select()

    let done = false
    function finish(save: boolean) {
      if (done) return
      done = true
      // An emptied label would be invisible and unclickable — treat it as cancel.
      if (save && textarea.value.trim()) onCommit(textarea.value)
      textarea.remove()
      window.removeEventListener('pointerdown', handleOutside, true)
      setHidden(false)
    }
    function handleOutside(e: PointerEvent) {
      if (e.target !== textarea) finish(true)
    }
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        finish(true)
      } else if (e.key === 'Escape') {
        finish(false)
      }
    })
    textarea.addEventListener('input', () => {
      textarea.style.width = `${Math.max(textarea.scrollWidth, 40)}px`
      textarea.style.height = `${textarea.scrollHeight}px`
    })
    setTimeout(() => window.addEventListener('pointerdown', handleOutside, true))
  }

  return { hidden, edit }
}
