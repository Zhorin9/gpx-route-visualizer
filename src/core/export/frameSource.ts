import { pickDocument } from '../../store/document'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { UI_ONLY, stageHandle } from '../../utils/exportImage'
import { reflowTo } from '../../utils/reflow'
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
  render: (scale: number) => HTMLCanvasElement
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

let clock: FrameClock | null = null

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
    render: (scale) => {
      const stage = stageHandle.current
      if (!stage) throw new Error('Brak podglądu do wyrenderowania')
      const { aspectKey, slides } = store.getState()
      const uiNodes = stage.find(`.${UI_ONLY}`).filter((n) => n.visible())
      uiNodes.forEach((n) => n.hide())
      // The stage is drawn at preview size; pixelRatio scales it back up. The ratio is fractional,
      // so the canvas can come out a pixel short — render a hair larger; callers crop to the exact size.
      const pixelRatio = ((ASPECTS[aspectKey].w * scale * slides.length) / stage.width()) * 1.0001
      const canvas = stage.toCanvas({ pixelRatio })
      uiNodes.forEach((n) => n.show())
      stage.batchDraw()
      return canvas
    },
    end: () => {
      clock?.release()
      store.setState({ ...snapshot, selection, routeEditable })
      store.getState().setExporting(false)
    },
  }
}
