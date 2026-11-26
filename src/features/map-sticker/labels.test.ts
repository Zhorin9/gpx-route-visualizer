import { describe, expect, it } from 'vitest'
import { labelSpan } from './labels'

describe('map sticker city label', () => {
  it('sits right of its cross while it fits on the sticker', () => {
    expect(labelSpan(20, 50, 5, -10, 110)).toEqual({ left: 25, right: 75 })
  })

  it('moves to the cross\'s left when it would stick out past the sticker\'s margin', () => {
    expect(labelSpan(80, 50, 5, -10, 110)).toEqual({ left: 25, right: 75 })
  })

  it('stays right when the left side overflows more', () => {
    expect(labelSpan(30, 100, 5, -10, 110)).toEqual({ left: 35, right: 135 })
  })
})
