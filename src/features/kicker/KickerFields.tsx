import TextField from '../../components/fields/TextField'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function KickerFields() {
  const text = useAppStore((s) => s.kicker.text)
  const setKicker = useAppStore((s) => s.setKicker)
  return (
    <>
      <TextField label="Nadtytuł" value={text} onChange={(value) => setKicker({ text: value })} />
      <Button onClick={() => setKicker({ shown: false })}>Ukryj nadtytuł</Button>
    </>
  )
}
