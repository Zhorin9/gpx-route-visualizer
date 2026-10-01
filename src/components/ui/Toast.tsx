import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { IconClose } from '../icons'

const TOAST_MS = 5000

export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const dismiss = useAppStore((s) => s.dismissToast)
  const undo = useAppStore((s) => s.undo)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (!toast) return null

  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.message}</span>
      {toast.undoable && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            undo()
            dismiss()
          }}
        >
          Cofnij
        </button>
      )}
      <button type="button" className="toast-close" aria-label="Zamknij" onClick={dismiss}>
        <IconClose />
      </button>
    </div>
  )
}
