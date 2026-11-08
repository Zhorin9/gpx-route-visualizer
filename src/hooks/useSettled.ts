import { useEffect, useState } from 'react'

// Slow work (a full-size photo redrawn, a map rendered) follows a slider once the hand stops, not on every step.
const SETTLE_MS = 200

export default function useSettled<T>(value: T): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), SETTLE_MS)
    return () => clearTimeout(timer)
  }, [value])
  return settled
}
