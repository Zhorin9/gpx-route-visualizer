import { pickDocument } from '../../store/document'
import { useAppStore } from '../../store/useAppStore'
import { FORMATS } from '../formats/registry'
import { UI_ONLY, stageHandle } from '../../utils/exportImage'
import { reflowTo } from '../../utils/reflow'
import { slideBox } from '../../utils/wrappers'
import type { AspectKey } from '../../types'

// Renders the frame for files: still images and video frames. It owns the "export mode"
// of the editor (no selection, no handles, the format being saved) and puts everything
// back afterwards; it knows nothing about file formats.
export interface FrameSource {
  // Switches the document to a format and waits until it is drawn.
  useFormat: (key: AspectKey) => Promise<void>
  // Moves time-based content (the animation) to `t` seconds and waits until the frame shows it.
  seek: (t: number) => Promise<void>
  // The whole ribbon (all slides side by side) at output resolution.
  render: (scale: number) => Promise<HTMLCanvasElement>
  // Restores the document and the editor exactly as they were.
  end: () => void
}

export interface FrameClock {
  // Rendering starts: remember the editor's moment and show the static design.
  hold: () => Promise<void>
  seek: (t: number) => Promise<void>
  // Called once rendering is over, so the clock can return to the live view.
  release: () => void
}

// Drawn under the stage in files, e.g. a map rendered at the output resolution; null = nothing to add.
export type FrameUnderlay = (width: number, height: number, scale: number) => Promise<HTMLCanvasElement | null>

let clock: FrameClock | null = null
let underlay: FrameUnderlay | null = null

export function provideFrameUnderlay(value: FrameUnderlay) {
  underlay = value
}

// The animation registers how to move to a moment in time; the source never imports it.
export function provideFrameClock(value: FrameClock) {
  clock = value
}

// rAF never fires in a hidden tab, so the timeout keeps the export from hanging.
export const nextPaint = () =>
  Promise.race([
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60)))),
    new Promise<void>((resolve) => setTimeout(resolve, 400)),
  ])

export async function beginStageFrames(): Promise<FrameSource> {
  const store = useAppStore
  const before = store.getState()
  const snapshot = pickDocument(before)
  const { selection, routeEditable } = before
  store.getState().setExporting(true)
  store.setState({ selection: null, routeEditable: false })
  // A still image is the static design, even if the animation preview was paused half way.
  await clock?.hold()

  return {
    useFormat: async (key) => {
      store.setState(reflowTo(store.getState(), key))
      await nextPaint()
    },
    seek: async (t) => {
      await clock?.seek(t)
    },
    render: async (scale) => {
      const stage = stageHandle.current
      if (!stage) throw new Error('Brak podglądu do wyrenderowania')
      const { aspectKey, slides } = store.getState()
      const below = await underlay?.(FORMATS[aspectKey].w * slides.length, FORMATS[aspectKey].h, scale)
      const uiNodes = stage.find(`.${UI_ONLY}`).filter((n) => n.visible())
      uiNodes.forEach((n) => n.hide())
      // The stage is drawn at preview size; pixelRatio scales it back up. The ratio is fractional,
      // so the canvas can come out a pixel short — render a hair larger; callers crop to the exact size.
      const pixelRatio = ((FORMATS[aspectKey].w * scale * slides.length) / stage.width()) * 1.0001
      const canvas = stage.toCanvas({ pixelRatio })
      uiNodes.forEach((n) => n.show())
      stage.batchDraw()
      if (!below) return canvas
      // Under a wrapper the map shrinks into the first slide's box, as the route on it does.
      const { w, h } = FORMATS[aspectKey]
      const box = slideBox(store.getState(), 0, w, h)
      if (!box) {
        below.getContext('2d')?.drawImage(canvas, 0, 0, below.width, below.height)
        return below
      }
      const out = document.createElement('canvas')
      out.width = below.width
      out.height = below.height
      const ctx = out.getContext('2d')
      if (!ctx) return canvas
      ctx.scale(scale, scale)
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2)
      ctx.rotate((box.rotation * Math.PI) / 180)
      ctx.scale(box.w / w, box.w / w)
      ctx.translate(-w / 2, -h / 2)
      ctx.drawImage(below, 0, 0, below.width / scale, below.height / scale)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(canvas, 0, 0, out.width, out.height)
      return out
    },
    end: () => {
      clock?.release()
      store.setState({ ...snapshot, selection, routeEditable })
      store.getState().setExporting(false)
    },
  }
}
