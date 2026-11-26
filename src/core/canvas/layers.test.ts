import { describe, expect, it } from 'vitest'
import { movedLayer, orderedLayers, placedAt } from './layers'

const defaults = ['slot:0:1', 'route', 'element:stats', 'element:mapSticker:1', 'text:1']

describe('layer order', () => {
  it('is the default order until the user changes it', () => {
    expect(orderedLayers(defaults, [])).toEqual(defaults)
  })

  it('keeps the user\'s order and slots new things in where they would be by default', () => {
    const stored = ['element:mapSticker:1', 'slot:0:1', 'route', 'element:stats']
    expect(orderedLayers([...defaults, 'text:2'], stored)).toEqual(['element:mapSticker:1', 'slot:0:1', 'route', 'element:stats', 'text:1', 'text:2'])
  })

  it('keeps everything else above a sticker put under the photo', () => {
    expect(orderedLayers(defaults, ['element:mapSticker:1', 'slot:0:1'])).toEqual(['element:mapSticker:1', 'slot:0:1', 'route', 'element:stats', 'text:1'])
  })

  it('forgets things that are gone', () => {
    expect(orderedLayers(['route', 'text:1'], ['text:9', 'text:1', 'route'])).toEqual(['text:1', 'route'])
  })

  it('moves to the front, the back, one up and one down', () => {
    expect(movedLayer(defaults, 'element:stats', 'front')).toEqual(['slot:0:1', 'route', 'element:mapSticker:1', 'text:1', 'element:stats'])
    expect(movedLayer(defaults, 'element:mapSticker:1', 'back')).toEqual(['element:mapSticker:1', 'slot:0:1', 'route', 'element:stats', 'text:1'])
    expect(movedLayer(defaults, 'route', 'up')).toEqual(['slot:0:1', 'element:stats', 'route', 'element:mapSticker:1', 'text:1'])
    expect(movedLayer(defaults, 'slot:0:1', 'down')).toEqual(defaults)
  })

  it('puts a dragged row in the place of the one it is dropped on', () => {
    expect(placedAt(defaults, 'text:1', 'route')).toEqual(['slot:0:1', 'text:1', 'route', 'element:stats', 'element:mapSticker:1'])
  })
})
