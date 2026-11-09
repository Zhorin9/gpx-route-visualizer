import { BODY, GLASS, LIGHT, shade, WHEELS } from './shared'

export const flat = (c: string) =>
  WHEELS +
  `<rect x="-21" y="-9.5" width="42" height="19" rx="7" fill="${c}"/>` +
  `<path d="M6-7.5Q12-7 13.5 0Q12 7 6 7.5Z" fill="${GLASS}"/><path d="M-13-6.8Q-15.5 0-13 6.8L-10 6.5V-6.5Z" fill="${GLASS}"/>` +
  `<rect x="-9" y="-7" width="14" height="14" rx="3" fill="${shade(c, 0.8)}"/>` +
  `<circle cx="19.4" cy="-6" r="1.2" fill="${LIGHT}"/><circle cx="19.4" cy="6" r="1.2" fill="${LIGHT}"/>`

export const flatShape = BODY
