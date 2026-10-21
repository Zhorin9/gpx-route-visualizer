import { describe, expect, it } from 'vitest'

// The dark theme only redefines the semantic tokens in index.css. A stylesheet that reaches
// past them (a palette step, a literal colour) would stay light, so it is not allowed.
const sheets = Object.entries(import.meta.glob<string>(['./**/*.css', '!./index.css'], { query: '?raw', import: 'default', eager: true }))

describe('theme tokens', () => {
  it('finds the stylesheets', () => {
    expect(sheets.length).toBeGreaterThan(1)
  })

  it.each(sheets)('%s uses only semantic colour tokens and no literal colours', (_, css) => {
    expect(css.match(/var\(--color-[a-z0-9-]+/g) ?? []).toEqual([])
    expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? []).toEqual([])
  })
})
