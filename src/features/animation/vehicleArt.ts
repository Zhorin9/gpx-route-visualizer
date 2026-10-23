// Colour illustrations of the vehicles, seen from above and lit from the top left, so they read as
// solid objects and can turn in any direction. Each is drawn in a 48 × 24 box centred on (0, 0),
// pointing east, with a soft shadow under it.

const shadow = (shape: string, dx: number, dy: number, blur: number, opacity: number) =>
  `<filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${blur}"/></filter>` +
  `<g transform="translate(${dx} ${dy})" filter="url(#soft)" opacity="${opacity}">${shape}</g>`

const CAR_BODY = '<rect x="-21" y="-9.5" width="42" height="19" rx="7"/>'

export const CAR_ART = [
  '<defs>',
  '<linearGradient id="paint" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#8e1b12"/><stop offset=".22" stop-color="#e2392a"/><stop offset=".5" stop-color="#ff6a55"/><stop offset=".78" stop-color="#e2392a"/><stop offset="1" stop-color="#8e1b12"/></linearGradient>',
  '<linearGradient id="roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8b78"/><stop offset="1" stop-color="#c72d20"/></linearGradient>',
  '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b2533"/><stop offset="1" stop-color="#5b7a99"/></linearGradient>',
  '</defs>',
  shadow(`<g fill="#000">${CAR_BODY}</g>`, 1.5, 2.5, 1.6, 0.45),
  '<rect x="-14" y="-11" width="6" height="3" rx="1" fill="#1d1d1d"/><rect x="9" y="-11" width="6" height="3" rx="1" fill="#1d1d1d"/>',
  '<rect x="-14" y="8" width="6" height="3" rx="1" fill="#1d1d1d"/><rect x="9" y="8" width="6" height="3" rx="1" fill="#1d1d1d"/>',
  `<g fill="url(#paint)" stroke="#6e140d" stroke-width=".6">${CAR_BODY}</g>`,
  '<path d="M6-7.5Q12-7 13.5 0Q12 7 6 7.5Z" fill="url(#glass)"/>',
  '<path d="M-13-6.8Q-15.5 0-13 6.8L-10 6.5V-6.5Z" fill="url(#glass)" opacity=".9"/>',
  '<rect x="-9" y="-7" width="14" height="14" rx="3" fill="url(#roof)"/>',
  '<path d="M-8-5.5H3" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>',
  '<path d="M14-8Q18.5-7 19.5-3" stroke="#ffb3a6" stroke-opacity=".7" stroke-width="1" fill="none" stroke-linecap="round"/>',
  '<ellipse cx="19.6" cy="-6" rx="1.3" ry="2" fill="#fff6c9"/><ellipse cx="19.6" cy="6" rx="1.3" ry="2" fill="#fff6c9"/>',
  '<rect x="-21" y="-7.5" width="1.6" height="3.5" rx=".6" fill="#ff2a1a"/><rect x="-21" y="4" width="1.6" height="3.5" rx=".6" fill="#ff2a1a"/>',
  '<ellipse cx="6" cy="-10" rx="1.6" ry="1" fill="#b3241a"/><ellipse cx="6" cy="10" rx="1.6" ry="1" fill="#b3241a"/>',
].join('')

const PLANE_SHAPE =
  '<path d="M22 0C22-1.6 20.5-2.6 18-2.6H6L-4-18H-8L-2-2.6H-14L-18-8H-21L-19 0L-21 8H-18L-14 2.6H-2L-8 18H-4L6 2.6H18C20.5 2.6 22 1.6 22 0Z"/>'

export const PLANE_ART = [
  '<defs>',
  '<linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3e9f0"/><stop offset="1" stop-color="#a9b6c4"/></linearGradient>',
  '<linearGradient id="wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#9aabbe"/></linearGradient>',
  '</defs>',
  // A plane is about as wide as it is long: drawn smaller, so its wings fit the box.
  '<g transform="scale(.62)">',
  // Higher off the ground than a car: the shadow falls further and softer.
  shadow(`<g fill="#000">${PLANE_SHAPE}</g>`, 4, 6, 2.4, 0.3),
  '<path d="M6-2.6L-4-18H-8L-2-2.6Z M6 2.6L-4 18H-8L-2 2.6Z" fill="url(#wing)" stroke="#7d8da0" stroke-width=".5"/>',
  '<path d="M-14-2.6L-18-8H-21L-19 0L-21 8H-18L-14 2.6Z" fill="url(#wing)" stroke="#7d8da0" stroke-width=".5"/>',
  '<path d="M-7-17.5L-5-17.5L-4.2-16.2H-6.4Z M-7 17.5L-5 17.5L-4.2 16.2H-6.4Z" fill="#2f6fd6"/>',
  '<ellipse cx="0" cy="-9" rx="3" ry="1.4" fill="#5d6b7c"/><ellipse cx="0" cy="9" rx="3" ry="1.4" fill="#5d6b7c"/>',
  '<path d="M22 0C22-1.6 20.5-2.6 18-2.6H-17Q-19-2.6-19 0Q-19 2.6-17 2.6H18C20.5 2.6 22 1.6 22 0Z" fill="url(#hull)" stroke="#8796a8" stroke-width=".5"/>',
  '<path d="M-17-.9H16" stroke="#2f6fd6" stroke-width=".9"/>',
  '<path d="M-19.5-1.2L-21-1L-21 1L-19.5 1.2Z" fill="#2f6fd6"/>',
  '<path d="M19-1.6Q21 0 19 1.6L17.6 1.2V-1.2Z" fill="#20314a"/>',
  '</g>',
].join('')

const TRAIN_SHAPE = '<path d="M-23-5.5H14Q23-5.5 23 0Q23 5.5 14 5.5H-23Z"/>'

export const TRAIN_ART = [
  '<defs>',
  '<linearGradient id="car" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a31d27"/><stop offset=".3" stop-color="#e5404a"/><stop offset=".7" stop-color="#e5404a"/><stop offset="1" stop-color="#7d121b"/></linearGradient>',
  '<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9eaec"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#b9bcc2"/></linearGradient>',
  '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b2533"/><stop offset="1" stop-color="#5b7a99"/></linearGradient>',
  '</defs>',
  shadow(`<g fill="#000">${TRAIN_SHAPE}</g>`, 1.5, 2.5, 1.4, 0.45),
  `<g fill="url(#car)" stroke="#6b0f17" stroke-width=".6">${TRAIN_SHAPE}</g>`,
  '<rect x="-21" y="-3.6" width="33" height="7.2" rx="1.5" fill="url(#top)"/>',
  '<path d="M-14-3.6V3.6 M-4-3.6V3.6 M6-3.6V3.6" stroke="#9aa0a8" stroke-width=".5"/>',
  // The pantograph on the roof.
  '<path d="M-10 0L-8-2.2L-6 0L-8 2.2Z" stroke="#3b3f45" stroke-width=".6" fill="none"/>',
  '<path d="M13-4.6Q19.5-4.4 20.6-1.2V1.2Q19.5 4.4 13 4.6Z" fill="url(#glass)"/>',
  '<path d="M21.6-3Q23 0 21.6 3" stroke="#ffd23f" stroke-width="1.4" fill="none"/>',
  '<path d="M-23-1H-22M-23 1H-22" stroke="#ff2a1a" stroke-width=".8"/>',
].join('')

// As an image the canvas can draw, sharp up to four times the drawn size.
export const artUrl = (art: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -12 48 24" width="384" height="192">${art}</svg>`)}`
