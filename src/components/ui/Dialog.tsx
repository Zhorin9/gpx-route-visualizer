import { useEffect, useId, type ReactNode } from 'react'
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

  useEffect(() => {
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose])

  const heading = (
    <h2 id={titleId} className="dialog-title">
      {title}
    </h2>
  )

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={className ? `dialog ${className}` : 'dialog'} role="dialog" aria-modal="true" aria-labelledby={titleId}>
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
    </div>
  )
}
