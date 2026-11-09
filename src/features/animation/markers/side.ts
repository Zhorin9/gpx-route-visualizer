import { SIDE_PATH } from './shared'

export const side = (c: string) => `<g transform="scale(1.35)"><path d="${SIDE_PATH}" fill="${c}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></g>`

export const sideShape = `<g transform="scale(1.35)"><path d="${SIDE_PATH}"/></g>`
