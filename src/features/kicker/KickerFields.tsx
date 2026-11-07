import TextField from '../../components/fields/TextField'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function KickerFields() {
  const text = useAppStore((s) => s.kicker.text)
  const setKicker = useAppStore((s) => s.setKicker)
  const select = useAppStore((s) => s.select)
  return (
    <>
      <TextField label="Nadtytuł" value={text} onChange={(value) => setKicker({ text: value })} />
      <Button
        onClick={() => {
          setKicker({ shown: false })
          select(null)
        }}
      >
        Ukryj nadtytuł
      </Button>
    </>
  )
}
