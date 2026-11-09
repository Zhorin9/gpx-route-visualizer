import { GLASS, LIGHT, shade } from './shared'

const OUTLINE = 'M-20 0Q-20-8-12-8.5L-9-10.6Q-6-11.6-3-9L5-9Q8-11.6 11-10.6L14-8.5Q21-7.5 21 0Q21 7.5 14 8.5L11 10.6Q8 11.6 5 9L-3 9Q-6 11.6-9 10.6L-12 8.5Q-20 8-20 0Z'

export const classic = (c: string) =>
  `<path d="${OUTLINE}" fill="${c}" stroke="${shade(c, 0.6)}" stroke-width=".7"/>` +
  '<ellipse cx="-3" cy="0" rx="9.5" ry="6.6" fill="#fff" opacity=".22"/>' +
  `<path d="M5.5-6Q9.5-4 9.5 0Q9.5 4 5.5 6Z" fill="${GLASS}"/><path d="M-12-5Q-14 0-12 5L-11 4.6V-4.6Z" fill="${GLASS}"/>` +
  `<circle cx="16.6" cy="-6.3" r="1.5" fill="${LIGHT}"/><circle cx="16.6" cy="6.3" r="1.5" fill="${LIGHT}"/>`

export const classicShape = `<path d="${OUTLINE}"/>`
