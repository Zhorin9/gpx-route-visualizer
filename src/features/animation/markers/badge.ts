import { SIDE_PATH } from './shared'

// Never turned: the car in it is seen from the side.
export const badge = (c: string) =>
  `<g transform="rotate(14)"><circle r="11" fill="#fff" stroke="${c}" stroke-width="2.2"/><g transform="translate(0 .6) scale(.66)"><path d="${SIDE_PATH}" fill="${c}"/></g></g>`

export const badgeShape = '<circle r="11"/>'
