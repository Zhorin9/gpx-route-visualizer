import { konvaFontStyle } from './fonts'
import { measureTextWidth } from './measureText'
import type { TextNode } from '../types'

// A title keeps one line: past this share of the frame width it shrinks instead of wrapping.
const TITLE_MAX_WIDTH = 0.9

export function displayText(node: Pick<TextNode, 'text' | 'uppercase'>): string {
  return node.uppercase ? node.text.toLocaleUpperCase('pl-PL') : node.text
}

// Font size a title is drawn at; measurements are only right once its font has loaded.
export function fittedTitleSize(node: TextNode, frameW: number): number {
  const text = displayText(node)
  const style = konvaFontStyle(node.fontFamily, { bold: node.bold, italic: node.italic })
  const width = measureTextWidth(text, node.fontFamily, node.fontSize, style) + node.letterSpacing * text.length
  const max = frameW * TITLE_MAX_WIDTH
  return width > max ? Math.floor(node.fontSize * (max / width)) : node.fontSize
}
