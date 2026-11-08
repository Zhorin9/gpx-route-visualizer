import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

export default function StampFields() {
  const setStamp = useAppStore((s) => s.setStamp)
  return (
    <>
      <p className="hint">Dzień i godzina startu trasy, jak znacznik z aparatu. Kolor i krój bierze ze statystyk.</p>
      <Button onClick={() => setStamp(false)}>Ukryj datę i godzinę</Button>
    </>
  )
}
