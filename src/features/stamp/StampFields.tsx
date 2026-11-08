import { useTranslation } from 'react-i18next'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function StampFields() {
  const setStamp = useAppStore((s) => s.setStamp)
  const { t } = useTranslation()
  return (
    <>
      <p className="hint">{t('stamp.hint')}</p>
      <Button onClick={() => setStamp(false)}>{t('stamp.hide')}</Button>
    </>
  )
}
