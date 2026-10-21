import { konvaFontStyle } from './fonts'
import { measureTextWidth } from './measureText'
import type { TextNode } from '../types'

// A title never wraps: past this share of the frame width its longest line shrinks it instead.
const TITLE_MAX_WIDTH = 0.9

export function displayText(node: Pick<TextNode, 'text' | 'uppercase'>): string {
  return node.uppercase ? node.text.toLocaleUpperCase('pl-PL') : node.text
}

// Font size a title is drawn at; measurements are only right once its font has loaded.
export function fittedTitleSize(node: TextNode, frameW: number): number {
  const style = konvaFontStyle(node.fontFamily, { bold: node.bold, italic: node.italic })
  const width = Math.max(
    ...displayText(node)
      .split('\n')
      .map((line) => measureTextWidth(line, node.fontFamily, node.fontSize, style) + node.letterSpacing * line.length),
  )
  const max = frameW * TITLE_MAX_WIDTH
  return width > max ? Math.floor(node.fontSize * (max / width)) : node.fontSize
}
