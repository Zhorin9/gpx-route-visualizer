import { useEffect, useState } from 'react'
import { beginStageFrames } from '../core/export/frameSource'
import type { AspectKey } from '../types'

const PROOF_SCALE = 0.25

// One render at a time: the frames take over the editor's stage until they end.
let queue: Promise<void> = Promise.resolve()

export default function useFormatProofs(formats: AspectKey[]): Partial<Record<AspectKey, string>> {
  const [proofs, setProofs] = useState<Partial<Record<AspectKey, string>>>({})

  useEffect(() => {
    let live = true
    queue = queue.then(async () => {
      if (!live) return
      const frames = await beginStageFrames()
      try {
        for (const key of formats) {
          if (!live) break
          await frames.useFormat(key)
          const url = (await frames.render(PROOF_SCALE)).toDataURL('image/png')
          if (live) setProofs((current) => ({ ...current, [key]: url }))
        }
      } finally {
        frames.end()
      }
    }).catch(() => {})
    return () => {
      live = false
    }
  }, [formats])

  return proofs
}
