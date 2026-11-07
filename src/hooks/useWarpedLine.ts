import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { measureTextWidth } from '../utils/measureText'
import { warpLine } from '../utils/warp'
import type { TextNode, TextWarp } from '../types'

export default function useWarpedLine(node: TextNode, text: string, warp: TextWarp, fontSize: number, fontStyle: string) {
  const fontsVersion = useAppStore((s) => s.fontsVersion)
  return useMemo(() => {
    const chars = [...text.replace(/\n/g, ' ')]
    const advances = chars.map((ch) => measureTextWidth(ch, node.fontFamily, fontSize, fontStyle) + node.letterSpacing)
    // Read so widths measured with a fallback font are redone once the real one loads.
    void fontsVersion
    return warpLine(chars, advances, fontSize, warp)
  }, [text, node.fontFamily, node.letterSpacing, fontSize, fontStyle, warp, fontsVersion])
}

