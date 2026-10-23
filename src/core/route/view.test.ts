import { describe, expect, it } from 'vitest'
import { applyTransform } from '../../utils/geometry'
import { composeView, steadyStyle, type CameraView } from './view'
import { DEFAULT_ROUTE_STYLE } from '../../store/defaults'

const route = { x: 40, y: -20, scaleX: 1.5, scaleY: 1.5, rotation: 30 }

describe('view transform', () => {
  it('is the route transform itself without a camera', () => {
    expect(composeView(route, null)).toBe(route)
  })

  it('places a point of the line where the camera moves the static view of it', () => {
    const view: CameraView = { x: 300, y: 500, zoom: 3, focusX: 540, focusY: 960 }
    const p = { x: 123, y: 456 }
    const once = applyTransform(p, composeView(route, view))
    const staticView = applyTransform(p, route)
    expect(once.x).toBeCloseTo((staticView.x - view.x) * view.zoom + view.focusX)
    expect(once.y).toBeCloseTo((staticView.y - view.y) * view.zoom + view.focusY)
    // The point the camera looks at lands on the focus.
    const looked = applyTransform({ x: 0, y: 0 }, composeView({ ...route, x: 300, y: 500 }, view))
    expect(looked).toEqual({ x: 540, y: 960 })
  })

  it('keeps strokes as wide on screen when the camera comes closer', () => {
    const style = steadyStyle(DEFAULT_ROUTE_STYLE, 4)
    expect(style.coreWidth * 4).toBeCloseTo(DEFAULT_ROUTE_STYLE.coreWidth)
    expect(style.remainingWidth * 4).toBeCloseTo(DEFAULT_ROUTE_STYLE.remainingWidth)
    expect(steadyStyle(DEFAULT_ROUTE_STYLE, 1)).toBe(DEFAULT_ROUTE_STYLE)
  })
})
