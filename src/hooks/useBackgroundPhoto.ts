import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS } from '../utils/aspects'
import { coverLayout } from '../utils/image'
import type { BgLayout } from '../types'

// Where the background photo sits on the stage: "cover" fit plus the user's zoom/pan.
export default function useBackgroundPhoto(): { image: HTMLCanvasElement | null; layout: BgLayout | null } {
  const image = useAppStore((s) => s.background)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const { zoom, offsetX, offsetY } = useAppStore((s) => s.bgAdjust)

  const layout = useMemo(() => {
    if (!image) return null
    const { w, h } = ASPECTS[aspectKey]
    return coverLayout(image.width, image.height, w, h, zoom, offsetX, offsetY)
  }, [image, aspectKey, zoom, offsetX, offsetY])

  return { image, layout }
}
