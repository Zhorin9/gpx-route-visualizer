import { useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { PNG_SIDES, canCopyImages, copyElementPng, elementPng, type ElementTarget, type PngSide } from '../utils/exportElement'
import { downloadBlob } from '../utils/exportImage'

const SIDE_KEY = 'gpx.pngSide'
const sideListeners = new Set<() => void>()

function savedSide(): PngSide {
  try {
    return PNG_SIDES.find((s) => String(s) === localStorage.getItem(SIDE_KEY)) ?? 2160
  } catch {
    return 2160
  }
}

let side = savedSide()

function setSide(next: PngSide) {
  side = next
  sideListeners.forEach((l) => l())
  try {
    localStorage.setItem(SIDE_KEY, String(next))
  } catch {
    return
  }
}

const subscribeSide = (l: () => void) => {
  sideListeners.add(l)
  return () => sideListeners.delete(l)
}

export default function useElementPng(target: ElementTarget | null) {
  const longSide = useSyncExternalStore(subscribeSide, () => side)
  const [busy, setBusy] = useState(false)
  const showToast = useAppStore((s) => s.showToast)
  const { t } = useTranslation()

  async function run(job: (target: ElementTarget) => Promise<unknown>, done?: string) {
    if (!target || busy) return
    setBusy(true)
    try {
      await job(target)
      if (done) showToast(done)
    } catch (e) {
      showToast(e instanceof Error && e.message ? e.message : t('elementExport.failed'))
    } finally {
      setBusy(false)
    }
  }

  return {
    longSide,
    setLongSide: setSide,
    busy,
    canCopy: canCopyImages(),
    download: () => run(async (tg) => {
      const file = await elementPng(tg, longSide)
      downloadBlob(file.blob, file.name)
    }),
    copy: () => run((tg) => copyElementPng(tg, longSide), t('elementExport.copied')),
  }
}
