import { describe, expect, it } from 'vitest'
import { BUILT_IN_TEMPLATES } from './templates'

const POLISH = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ'

// The app has no Node types; the test runs in Node all the same.
type Fs = { readFileSync(path: string, encoding: 'utf8'): string; readdirSync(path: string): string[] }
const { readFileSync, readdirSync }: Fs = await import(/* @vite-ignore */ ['node', 'fs'].join(':'))

// Every @font-face range of a self-hosted family, read from its @fontsource stylesheets.
function ranges(family: string): [number, number][] {
  const dir = `node_modules/@fontsource/${family.toLowerCase().replace(/ /g, '-')}`
  const css = readdirSync(dir)
    .filter((f) => /^\d+\.css$/.test(f))
    .map((f) => readFileSync(`${dir}/${f}`, 'utf8'))
    .join('\n')
  return [...css.matchAll(/unicode-range:([^;]+);/g)].flatMap((m) =>
    m[1].split(',').map((part): [number, number] => {
      const [from, to = from] = part.trim().replace('U+', '').split('-')
      return [parseInt(from, 16), parseInt(to, 16)]
    }),
  )
}

describe('template fonts', () => {
  const families = [...new Set(BUILT_IN_TEMPLATES.flatMap((t) => Object.values(t.fonts)))]

  it.each(families)('%s has every Polish letter', (family) => {
    const covered = ranges(family)
    const missing = [...POLISH].filter((ch) => !covered.some(([from, to]) => ch.codePointAt(0)! >= from && ch.codePointAt(0)! <= to))
    expect(missing).toEqual([])
  })
})
