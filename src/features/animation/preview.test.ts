import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { stopPreviewOnEdit } from './editStopsPreview'
import { usePlayback } from './playback'
import { DEFAULT_ANIMATION } from './types'

const unsubscribe = stopPreviewOnEdit()
afterAll(unsubscribe)

const pausedPreview = () => usePlayback.setState({ t: 0.4, previewing: true, playing: false })

describe('animation preview', () => {
  beforeEach(() => {
    useAppStore.setState({ animation: { ...DEFAULT_ANIMATION, enabled: true }, exporting: false })
    usePlayback.getState().stop()
  })

  it('is off by default', () => {
    expect(DEFAULT_ANIMATION.enabled).toBe(false)
  })

  it('returns to the static view when the design is edited', () => {
    pausedPreview()
    useAppStore.getState().updateStatsStyle({ fontSize: 50 })
    expect(usePlayback.getState().previewing).toBe(false)
  })

  it('keeps the preview while the timeline is tuned', () => {
    pausedPreview()
    useAppStore.getState().setDrawDuration(8)
    expect(usePlayback.getState().previewing).toBe(true)
  })

  it('ends the preview when the animation is switched off', () => {
    pausedPreview()
    useAppStore.getState().updateAnimation({ enabled: false })
    expect(usePlayback.getState().previewing).toBe(false)
  })

  it('leaves the preview alone while an export reflows the document', () => {
    useAppStore.setState({ exporting: true })
    pausedPreview()
    useAppStore.getState().updateStatsStyle({ fontSize: 44 })
    expect(usePlayback.getState().previewing).toBe(true)
  })
})
