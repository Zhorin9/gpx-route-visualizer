import { mixHex } from '../../../utils/color'

// Every car look is drawn in a 48 × 24 box centred on (0, 0), front to the east.
export const GLASS = '#1f2a36'
export const INK = '#24351f'
export const LIGHT = '#fff6c9'

// Darker under 1, lighter over it.
export const shade = (color: string, factor: number) => (factor < 1 ? mixHex(color, '#000000', 1 - factor) : mixHex(color, '#ffffff', factor - 1))

export const WHEELS =
  '<rect x="-14" y="-11" width="6" height="2.6" rx="1" fill="#1d1d1d"/><rect x="9" y="-11" width="6" height="2.6" rx="1" fill="#1d1d1d"/>' +
  '<rect x="-14" y="8.4" width="6" height="2.6" rx="1" fill="#1d1d1d"/><rect x="9" y="8.4" width="6" height="2.6" rx="1" fill="#1d1d1d"/>'

export const SIDE_PATH =
  'M-11 3V-1Q-11-2.5-9.5-2.8L-6-3.3L-3.5-7H4L7.5-3.3L10.5-2.5Q12-2 12 0V3Z M-9.1 3A2.6 2.6 0 1 0-3.9 3A2.6 2.6 0 1 0-9.1 3Z M4.9 3A2.6 2.6 0 1 0 10.1 3A2.6 2.6 0 1 0 4.9 3Z'

export const BODY = '<rect x="-21" y="-9.5" width="42" height="19" rx="7"/>'

export const softShadow = (shape: string) => `<g transform="translate(1.5 2.5)" fill="#000" opacity=".22">${shape}</g>`
