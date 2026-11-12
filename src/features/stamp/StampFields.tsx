import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { fromDateTimeInput, selectStampTime, toDateTimeInput } from './model'

export default function StampFields() {
  const time = useAppStore(selectStampTime)
  const isCustom = useAppStore((s) => s.stampTime != null)
  const setStamp = useAppStore((s) => s.setStamp)
  const setStampTime = useAppStore((s) => s.setStampTime)
  const { t } = useTranslation()
  const id = useId()
  return (
    <>
      <p className="hint">{t('stamp.hint')}</p>
      <div className="field">
        <label htmlFor={id} className="field-label">
          {t('stamp.when')}
        </label>
        <input
          id={id}
          type="datetime-local"
          value={time == null ? '' : toDateTimeInput(time)}
          onChange={(e) => {
            const picked = fromDateTimeInput(e.target.value)
            if (picked != null) setStampTime(picked)
          }}
        />
      </div>
      {isCustom && <Button onClick={() => setStampTime(null)}>{t('stamp.fromRoute')}</Button>}
      <Button onClick={() => setStamp(false)}>{t('stamp.hide')}</Button>
    </>
  )
}
