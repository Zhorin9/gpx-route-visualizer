import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { ToastAction } from '../../store/types'

const TOAST_MS = 5000
// An offer to undo needs time to read and reach.
const TOAST_WITH_ACTION_MS = 10000

function resolveAction(action: ToastAction): { label: string; run: () => void; shortcut?: string } {
  const s = useAppStore.getState()
  if (action === 'undo') return { label: 'Cofnij', run: s.undo, shortcut: 'Ctrl+Z' }
  if (action === 'redo') return { label: 'Ponów', run: s.redo, shortcut: 'Ctrl+Shift+Z' }
  return action
}

export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const dismiss = useAppStore((s) => s.dismissToast)
  const [heldId, setHeldId] = useState<number | null>(null)
  const held = toast != null && heldId === toast.id

  useEffect(() => {
    if (!toast || held) return
    const timer = setTimeout(dismiss, toast.action ? TOAST_WITH_ACTION_MS : TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, held, dismiss])

  const action = toast?.action && resolveAction(toast.action)

  return (
    <div aria-live="polite">
      {toast && (
        <div
          className={toast.error ? 'toast toast-error' : 'toast'}
          role={toast.error ? 'alert' : undefined}
          key={toast.id}
          onMouseEnter={() => setHeldId(toast.id)}
          onMouseLeave={() => setHeldId(null)}
          onFocus={() => setHeldId(toast.id)}
          onBlur={() => setHeldId(null)}
        >
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
      )}
    </div>
  )
}
