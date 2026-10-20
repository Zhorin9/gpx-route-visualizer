import { MIME_TYPES, type VideoEncodingService, type VideoFormat } from '../VideoEncodingService'

export interface ContractResult {
  format: VideoFormat
  ok: boolean
  details: string
}

// What every implementation must do, whatever package is behind it. Runs in vitest against the
// fake and in a real browser against the default service (where WebCodecs and canvas exist).
export async function runEncodingContract(
  service: VideoEncodingService,
  makeFrame: (i: number, width: number, height: number) => HTMLCanvasElement,
): Promise<ContractResult[]> {
  const width = 64
  const height = 112
  const fps = 10
  const support = await service.capabilities(width, height, fps)
  const results: ContractResult[] = []

  for (const { format, supported } of support) {
    if (!supported) {
      results.push({ format, ok: true, details: 'nieobsługiwany — pominięty' })
      continue
    }
    const problems: string[] = []
    try {
      const options = { format, width, height, fps, loopCount: 0, quality: 'low' as const }
      const session = await service.createSession(options)
      for (let i = 0; i < 12; i++) await session.addFrame(makeFrame(i, width, height), Math.round((i * 1_000_000) / fps))
      const blob = await session.finish()
      if (blob.size === 0) problems.push('pusty plik')
      if (blob.type !== MIME_TYPES[format]) problems.push(`typ ${blob.type}`)
      session.abort()
      if (!(service.estimateBytes(options, 1.2) > 0)) problems.push('brak szacunku rozmiaru')

      const aborted = await service.createSession(options)
      await aborted.addFrame(makeFrame(0, width, height), 0)
      aborted.abort()
      aborted.abort()
    } catch (e) {
      problems.push(e instanceof Error ? e.message : String(e))
    }
    results.push({ format, ok: problems.length === 0, details: problems.join(', ') || 'ok' })
  }
  return results
}
