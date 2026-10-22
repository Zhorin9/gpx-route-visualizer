import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { ToastAction } from '../../store/types'

const TOAST_MS = 5000

function resolveAction(action: ToastAction): { label: string; run: () => void; shortcut?: string } {
  const s = useAppStore.getState()
  if (action === 'undo') return { label: 'Cofnij', run: s.undo, shortcut: 'Ctrl+Z' }
  if (action === 'redo') return { label: 'Ponów', run: s.redo, shortcut: 'Ctrl+Shift+Z' }
  return action
}

export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const dismiss = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (!toast) return null
  const action = toast.action && resolveAction(toast.action)

  return (
    <div className={toast.error ? 'toast toast-error' : 'toast'} role={toast.error ? 'alert' : 'status'} key={toast.id}>
      <span>{toast.message}</span>
      {action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            // The action may show a toast of its own (undo does), so this one goes first.
            dismiss()
            action.run()
          }}
        >
          {action.label}
        </button>
      )}
      {action?.shortcut && <kbd className="toast-shortcut">{action.shortcut}</kbd>}
    </div>
  )
}
