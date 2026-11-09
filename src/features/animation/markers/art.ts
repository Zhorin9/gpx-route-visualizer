import { BODY, GLASS, LIGHT, shade, WHEELS } from './shared'

export const art = (c: string) =>
  WHEELS +
  `<rect x="-21" y="-9.5" width="42" height="19" rx="7" fill="${c}" stroke="${shade(c, 0.55)}" stroke-width=".6"/>` +
  `<rect x="-21" y="-9.5" width="42" height="4" rx="2" fill="${shade(c, 0.7)}" opacity=".7"/><rect x="-21" y="5.5" width="42" height="4" rx="2" fill="${shade(c, 0.7)}" opacity=".7"/>` +
  `<path d="M6-7.5Q12-7 13.5 0Q12 7 6 7.5Z" fill="${GLASS}"/><path d="M-13-6.8Q-15.5 0-13 6.8L-10 6.5V-6.5Z" fill="${GLASS}" opacity=".9"/>` +
  `<rect x="-9" y="-7" width="14" height="14" rx="3" fill="${shade(c, 1.25)}"/><path d="M-8-5.5H3" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/>` +
  `<ellipse cx="19.6" cy="-6" rx="1.3" ry="2" fill="${LIGHT}"/><ellipse cx="19.6" cy="6" rx="1.3" ry="2" fill="${LIGHT}"/>`

export const artShape = BODY
