import { useRef, type ReactNode } from 'react'
import Button, { type ButtonVariant } from './Button'

export interface FileButtonProps {
  accept: string
  onFiles: (files: FileList | null) => void
  children: ReactNode
  icon?: ReactNode
  variant?: ButtonVariant
  block?: boolean
  multiple?: boolean
}

// Styled replacement for the native file input. Resets the value after each
// pick so choosing the same file again still fires.
export default function FileButton({ accept, onFiles, children, icon, variant = 'secondary', block, multiple }: FileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button variant={variant} icon={icon} block={block} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}
