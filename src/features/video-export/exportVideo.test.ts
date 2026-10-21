import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Konva from 'konva'
import { FakeVideoEncodingService } from '../../services/video-encoding/testing/FakeVideoEncodingService'
import { useAppStore } from '../../store/useAppStore'
import { stageHandle } from '../../utils/exportImage'
import { frameCount, renderVideo, type VideoJob } from './exportVideo'

const initial = useAppStore.getState()
const job: VideoJob = { format: 'mp4', aspect: '9:16', fps: 2, repeat: 1, loopForever: true, quality: 'medium' }

beforeEach(() => {
  useAppStore.setState(initial, true)
  const stageCanvas = document.createElement('canvas')
  stageHandle.current = { find: () => [], width: () => 1080, toCanvas: () => stageCanvas, batchDraw: () => {} } as unknown as Konva.Stage
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: () => {}, drawImage: () => {} } as unknown as CanvasRenderingContext2D)
  // No frames are painted in jsdom; waiting for one falls back to a short timeout.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame'] })
})

afterEach(() => {
  stageHandle.current = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function run(service: FakeVideoEncodingService, j: VideoJob, signal?: AbortSignal) {
  const work = renderVideo(service, j, 'Trasa', () => {}, signal)
  const settled = work.then(
    (files) => ({ files, error: null }),
    (error: unknown) => ({ files: null, error }),
  )
  await vi.runAllTimersAsync()
  return settled
}

describe('rendering a video', () => {
  it('writes every frame at its moment, one file per slide', async () => {
    useAppStore.getState().setCarousel(true)
    const slides = useAppStore.getState().slides.length
    expect(slides).toBeGreaterThan(1)
    const service = new FakeVideoEncodingService()
    const { files } = await run(service, job)
    const count = frameCount(job)
    expect(files).toHaveLength(slides)
    expect(service.sessions).toHaveLength(slides)
    for (const session of service.sessions) {
      expect(session.timestamps).toEqual(Array.from({ length: count }, (_, f) => f * 500_000))
      expect(session.finished).toBe(true)
    }
  })

  it('writes the animation again for each repeat', async () => {
    const service = new FakeVideoEncodingService()
    await run(service, { ...job, repeat: 3 })
    expect(service.sessions[0].timestamps).toHaveLength(frameCount(job) * 3)
  })

  it('stops when cancelled and leaves the editor as it was', async () => {
    const controller = new AbortController()
    controller.abort()
    const service = new FakeVideoEncodingService()
    const { error } = await run(service, job, controller.signal)
    expect((error as DOMException).name).toBe('AbortError')
    expect(useAppStore.getState().exporting).toBe(false)
  })
})
