const POLISH = [...'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ']

const SIZE = 48

export function missingPolishLetters(family: string): string[] {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return []
  const widthWith = (letter: string, fallback: string) => {
    ctx.font = `${SIZE}px "${family}", ${fallback}`
    return ctx.measureText(letter).width
  }
  return POLISH.filter((letter) => widthWith(letter, 'monospace') !== widthWith(letter, 'serif'))
}
