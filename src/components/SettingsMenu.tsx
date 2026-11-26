import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { formatNumber } from '../utils/format'
import { distanceUnit, type Units } from '../core/units'
import LanguageSwitch from './LanguageSwitch'
import ColorField from './fields/ColorField'
import CheckboxField from './fields/CheckboxField'

const DEFAULT_BACKDROP_COLOR = '#cfcccc'

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="view-switch" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={o.value === value ? 'view-switch-opt active' : 'view-switch-opt'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreviewBackdropChoice() {
  const { t } = useTranslation()
  const previewBackdrop = useAppStore((s) => s.previewBackdrop)
  const setPreviewBackdrop = useAppStore((s) => s.setPreviewBackdrop)
  const backdropIsColor = previewBackdrop !== 'checkerboard'
  return (
    <>
      <Choice
        label={t('topBar.previewBackdrop')}
        value={backdropIsColor ? 'color' : 'checkerboard'}
        options={[
          { value: 'checkerboard', label: t('topBar.checkerboard') },
          { value: 'color', label: t('topBar.backdropColor') },
        ]}
        onChange={(v) => setPreviewBackdrop(v === 'color' ? (backdropIsColor ? previewBackdrop : DEFAULT_BACKDROP_COLOR) : 'checkerboard')}
      />
      {backdropIsColor && <ColorField label={t('topBar.previewColor')} value={previewBackdrop} onChange={setPreviewBackdrop} />}
    </>
  )
}

export default function SettingsMenu() {
  const { t } = useTranslation()
  const units = useAppStore((s) => s.statsContent.units)
  const precision = useAppStore((s) => s.statsContent.distancePrecision)
  const updateStatsContent = useAppStore((s) => s.updateStatsContent)
  const loop = useAppStore((s) => s.animation.loop)
  const updateAnimation = useAppStore((s) => s.updateAnimation)
  const styleNewElements = useAppStore((s) => s.styleNewElements)
  const setStyleNewElements = useAppStore((s) => s.setStyleNewElements)
  return (
    <div className="settings-menu" role="dialog" aria-label={t('topBar.settings')}>
      <div className="settings-row">
        <span className="settings-label">{t('topBar.language')}</span>
        <LanguageSwitch />
      </div>
      <Choice<Units>
        label={t('topBar.units')}
        value={units}
        options={[
          { value: 'metric', label: 'km · m' },
          { value: 'imperial', label: 'mi · ft' },
        ]}
        onChange={(u) => updateStatsContent({ units: u })}
      />
      <Choice
        label={t('topBar.distancePrecision')}
        value={String(precision)}
        options={[0, 1, 2].map((digits) => ({ value: String(digits), label: `${formatNumber(15.678, digits)} ${distanceUnit(units)}` }))}
        onChange={(v) => updateStatsContent({ distancePrecision: Number(v) })}
      />
      <PreviewBackdropChoice />
      <CheckboxField label={t('topBar.loopPreview')} checked={loop} onChange={(on) => updateAnimation({ loop: on })} />
      <CheckboxField label={t('topBar.styleNewElements')} checked={styleNewElements} onChange={setStyleNewElements} />
    </div>
  )
}
