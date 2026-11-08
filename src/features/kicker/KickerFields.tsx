import { useTranslation } from 'react-i18next'
import TextField from '../../components/fields/TextField'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function KickerFields() {
  const text = useAppStore((s) => s.kicker.text)
  const setKicker = useAppStore((s) => s.setKicker)
  const select = useAppStore((s) => s.select)
  const { t } = useTranslation()
  return (
    <>
      <TextField label={t('kicker.label')} value={text} onChange={(value) => setKicker({ text: value })} />
      <Button
        onClick={() => {
          setKicker({ shown: false })
          select(null)
        }}
      >
        {t('kicker.hide')}
      </Button>
    </>
  )
}
