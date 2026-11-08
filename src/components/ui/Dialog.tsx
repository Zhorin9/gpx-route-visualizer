import { useEffect, useId, useRef, type ReactNode } from 'react'
import Button from './Button'
import { IconClose } from '../icons'

interface Props {
  title: ReactNode
  onClose: () => void
  className?: string
  closeButton?: boolean
  children: ReactNode
}

export default function Dialog({ title, onClose, className, closeButton, children }: Props) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    return () => {
      dialog.close()
      opener?.focus()
    }
  }, [])

  const heading = (
    <h2 id={titleId} className="dialog-title">
      {title}
    </h2>
  )

  return (
    <dialog
      ref={ref}
      className="dialog-backdrop"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={className ? `dialog ${className}` : 'dialog'}>
        {closeButton ? (
          <div className="dialog-head">
            {heading}
            <Button size="icon" variant="ghost" aria-label="Zamknij" onClick={onClose}>
              <IconClose />
            </Button>
          </div>
        ) : (
          heading
        )}
        {children}
      </div>
    </dialog>
  )
}
