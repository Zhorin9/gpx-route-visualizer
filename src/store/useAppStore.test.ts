import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './useAppStore'

const initial = useAppStore.getState()

beforeEach(() => {
  vi.useFakeTimers()
  useAppStore.setState(initial, true)
})

const get = () => useAppStore.getState()

describe('history', () => {
  it('coalesces repeats of the same action into one undo step', () => {
    get().updateRouteStyle({ coreWidth: 6 })
    get().updateRouteStyle({ coreWidth: 7 })
    get().updateRouteStyle({ coreWidth: 8 })
    expect(get().past).toHaveLength(1)
    get().undo()
    expect(get().routeStyle.coreWidth).toBe(initial.routeStyle.coreWidth)
  })

  it('starts a new step for a different action even within the coalescing window', () => {
    get().updateRouteStyle({ coreWidth: 6 })
    get().updateStatsStyle({ fontSize: 50 })
    expect(get().past).toHaveLength(2)
  })

  it('redo re-applies an undone change and a new change clears redo', () => {
    get().updateRouteStyle({ color: '#ff0000' })
    get().undo()
    get().redo()
    expect(get().routeStyle.color).toBe('#ff0000')
    get().undo()
    get().updateStatsStyle({ fontSize: 50 })
    expect(get().future).toHaveLength(0)
  })

  it('drops a selection that no longer exists after undo', () => {
    const id = get().addText()
    expect(get().selection).toEqual({ kind: 'text', id })
    get().undo()
    expect(get().texts).toHaveLength(0)
    expect(get().selection).toBeNull()
  })
})

describe('elements', () => {
  it('delete shows an undoable toast and undo restores the text', () => {
    const id = get().addText()
    vi.advanceTimersByTime(1000)
    get().deleteText(id)
    expect(get().toast).toMatchObject({ message: 'Usunięto tekst', undoable: true })
    get().undo()
    expect(get().texts.map((t) => t.id)).toEqual([id])
  })

  it('assigns ids that stay unique after undo', () => {
    const a = get().addText()
    vi.advanceTimersByTime(1000)
    const b = get().addText()
    expect(b).not.toBe(a)
  })

  it('scales vertical positions when the aspect ratio changes', () => {
    get().addText()
    const y = get().texts[0].y
    get().setAspectKey('1:1')
    expect(get().texts[0].y).toBeCloseTo(y * (1080 / 1920))
  })
})
