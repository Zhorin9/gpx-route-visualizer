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

export function IconDroplet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

export function IconPalette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
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

export function IconMinus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconReplace(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  )
}

export function IconFit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="15" height="15" aria-hidden="true" {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

export function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconEyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export function IconMountain(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <path d="m8 3 4 8 5-5 5 15H2z" />
    </svg>
  )
}

export function IconChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconAlert(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

export function IconInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...common} width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
