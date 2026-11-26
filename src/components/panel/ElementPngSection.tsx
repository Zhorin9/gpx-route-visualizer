import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import Segmented from '../ui/Segmented'
import { IconCopy, IconDownload } from '../icons'
import useElementPng from '../../hooks/useElementPng'
import { PNG_SIDES, type ElementTarget, type PngSide } from '../../utils/exportElement'

export default function ElementPngSection({ target, more }: { target: ElementTarget; more?: (png: ReturnType<typeof useElementPng>) => ReactNode }) {
  const png = useElementPng(target)
  const { t } = useTranslation()
  return (
    <div className="element-png">
      <Segmented
        label={t('elementExport.side')}
        showLabel
        value={String(png.longSide)}
        options={PNG_SIDES.map((side) => ({ value: String(side), label: t('elementExport.sidePx', { n: side }) }))}
        onChange={(v) => png.setLongSide(Number(v) as PngSide)}
      />
      <Button variant="primary" block icon={<IconDownload />} disabled={png.busy} onClick={png.download}>
        {png.busy ? t('elementExport.working') : t('elementExport.download')}
      </Button>
      {png.canCopy && (
        <Button block icon={<IconCopy />} disabled={png.busy} onClick={png.copy}>
          {t('elementExport.copy')}
        </Button>
      )}
      {more?.(png)}
      <p className="hint">{t('elementExport.hint')}</p>
    </div>
  )
}
