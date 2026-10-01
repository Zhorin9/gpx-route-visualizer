import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'md' | 'sm' | 'icon'
  icon?: ReactNode
  // Renders as a toggle (aria-pressed) with an "on" look when true.
  pressed?: boolean
  block?: boolean
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  pressed,
  block,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', pressed && 'is-pressed', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} aria-pressed={pressed} {...rest}>
      {icon}
      {children}
    </button>
  )
}
