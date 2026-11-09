import { BODY, INK, PAPER } from './shared'

// Ink on paper, whatever colour is picked.
export const sketch = () =>
  `<g fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M-20.5-8Q-21-9.6-14-9.6L14-9.4Q21-9 21.2 0Q21 9.2 14 9.5L-14 9.4Q-21 9.6-20.8 0Q-21-5-20.5-8Z" fill="${PAPER}"/>` +
  '<path d="M-18-9.9Q-6-10.4 15-9.9" opacity=".45"/>' +
  '<path d="M6-7.5Q12-7 13.5 0Q12 7 6 7.5Z"/><path d="M8-5L11-6.2M8-2L12.6-3.2M8 1L12.8 0M8 4L11.6 2.8" stroke-width=".7"/>' +
  '<path d="M-13-6.8Q-15.5 0-13 6.8L-10 6.5V-6.5Z"/><rect x="-9" y="-7" width="14" height="14" rx="3"/>' +
  '<path d="M-14-10.6h5M9-10.6h5M-14 10.6h5M9 10.6h5" stroke-width="1.6"/></g>'

export const sketchShape = BODY
