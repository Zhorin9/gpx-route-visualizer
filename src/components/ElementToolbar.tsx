import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button'
import { IconClose, IconCopy, IconDownload } from './icons'
import { useAppStore } from '../store/useAppStore'
import useElementPng from '../hooks/useElementPng'
import { PNG_SIDES, elementNodeId, type ElementTarget, type PngSide } from '../utils/exportElement'
import { stageHandle } from '../utils/exportImage'
import { clamp } from '../utils/math'
import LayerButtons from './LayerButtons'

const HALF_BAR_PX = 190
const ROOM_ABOVE_PX = 52

function useTarget(): ElementTarget | null {
  const selection = useAppStore((s) => s.selection)
  const exporting = useAppStore((s) => s.exporting)
  if (exporting || !selection) return null
  if (selection.kind === 'element') return selection
  return selection.kind === 'text' ? { kind: 'text', id: selection.id } : null
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const sameBox = (a: Box | null, b: Box | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height)

function useDrawnBox(target: ElementTarget | null): Box | null {
  useAppStore((s) => s.placements)
  useAppStore((s) => s.texts)
  useAppStore((s) => s.mapStickers)
  const [box, setBox] = useState<Box | null>(null)
  useLayoutEffect(() => {
    const node = target && stageHandle.current?.findOne(`#${elementNodeId(target)}`)
    const next = node ? node.getClientRect({ skipShadow: true }) : null
    setBox((drawn) => (sameBox(drawn, next) ? drawn : next))
  })
  return target ? box : null
}

export default function ElementToolbar() {
  const target = useTarget()
  const rect = useDrawnBox(target)
  const select = useAppStore((s) => s.select)
  const png = useElementPng(target)
  const { t } = useTranslation()

  const stage = stageHandle.current
  if (!target || !stage || !rect) return null
  const above = rect.y >= ROOM_ABOVE_PX
  const narrow = stage.width() < HALF_BAR_PX * 2
  const style = {
    maxWidth: stage.width() - 8,
    left: narrow ? stage.width() / 2 : clamp(rect.x + rect.width / 2, HALF_BAR_PX, stage.width() - HALF_BAR_PX),
    top: above ? rect.y - 10 : rect.y + rect.height + 10,
    transform: above ? 'translate(-50%, -100%)' : 'translateX(-50%)',
  }

  return (
    <div className="slot-toolbar element-toolbar" style={style} role="toolbar" aria-label={t('elementExport.toolbar')}>
      <select
        className="element-toolbar-side"
        aria-label={t('elementExport.side')}
        value={png.longSide}
        onChange={(e) => png.setLongSide(Number(e.target.value) as PngSide)}
      >
        {PNG_SIDES.map((side) => (
          <option key={side} value={side}>
            {t('elementExport.sidePx', { n: side })}
          </option>
        ))}
      </select>
      <Button size="sm" variant="ghost" icon={<IconDownload />} disabled={png.busy} onClick={png.download}>
        {t('elementExport.download')}
      </Button>
      {png.canCopy && (
        <Button size="icon" variant="ghost" aria-label={t('elementExport.copy')} title={t('elementExport.copy')} disabled={png.busy} onClick={png.copy}>
          <IconCopy />
        </Button>
      )}
      <span className="slot-toolbar-sep" />
      <LayerButtons />
      <span className="slot-toolbar-sep" />
      <Button size="icon" variant="ghost" aria-label={t('slotToolbar.closeBar')} title={t('slotToolbar.close')} onClick={() => select(null)}>
        <IconClose />
      </Button>
    </div>
  )
}
