import { describe, expect, it } from 'vitest'
import { DEFAULT_POINT_STYLE, makeWaypoint } from '../../store/defaults'
import { DEFAULT_ICON_SIZE, placeLayout } from './placeLayout'

describe('icon in place of the name', () => {
  const place = { ...makeWaypoint(1, 0), kind: 'icon' as const, icon: 'coffee' as const, text: '' }

  it('leads the line to the icon at its own size, even with no name', () => {
    const box = (iconSize?: number) => placeLayout({ ...place, iconAsLabel: true, iconSize }, undefined, DEFAULT_POINT_STYLE).leader
    expect(box()).toEqual({ kind: 'text', box: { x: 0, y: 0, w: DEFAULT_ICON_SIZE, h: DEFAULT_ICON_SIZE } })
    expect(box(90)).toEqual({ kind: 'text', box: { x: 0, y: 0, w: 90, h: 90 } })
  })

  it('keeps the icon on the route otherwise, and a nameless place has no line', () => {
    expect(placeLayout(place, undefined, DEFAULT_POINT_STYLE).leader).toBeNull()
  })
})
