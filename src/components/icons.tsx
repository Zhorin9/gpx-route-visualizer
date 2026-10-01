import type { SVGProps } from 'react'

const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconImage(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export function IconSliders(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

export function IconDroplet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

export function IconType(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

export function IconBarChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

export function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconUndo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <polyline points="9 14 4 9 9 4" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

export function IconDownload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function IconRedo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <polyline points="15 14 20 9 15 4" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  )
}

export function IconMove(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  )
}

export function IconReset(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <polyline points="3 3 3 8 8 8" />
    </svg>
  )
}

export function IconSafeZone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="6" y1="6" x2="18" y2="6" />
      <line x1="6" y1="18" x2="18" y2="18" />
    </svg>
  )
}

export function IconUpload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function IconRoute(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  )
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="14" height="14" aria-hidden="true" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconEyedropper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M19.4 4.6a2 2 0 0 1 0 2.8l-2 2-2.8-2.8 2-2a2 2 0 0 1 2.8 0Z" />
      <path d="M14.6 6.6 4 17.2V20h2.8L17.4 9.4" />
    </svg>
  )
}
