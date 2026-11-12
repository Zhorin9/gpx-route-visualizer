import { toneOf } from '../../utils/color'

const BLACK = '#000000'
const WHITE = '#ffffff'

export const SOFT_SHADOW = { shadowColor: BLACK, shadowBlur: 8, shadowOpacity: 0.5 }
export const CAST_SHADOW = { shadowColor: BLACK, shadowBlur: 10, shadowOpacity: 0.35, shadowOffsetY: 3 }

export const textShadow = (letters: string) => ({ shadowColor: toneOf(letters) === 'dark' ? WHITE : BLACK, shadowBlur: 10, shadowOpacity: 0.6 })
