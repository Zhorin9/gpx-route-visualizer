export interface LabelPlacer {
  reserve: (from: number, to: number) => void
  isFree: (x: number, width: number) => boolean
}

export function createLabelPlacer(): LabelPlacer {
  const taken: [number, number][] = []
  return {
    reserve: (from, to) => {
      taken.push([from, to])
    },
    isFree: (x, width) => !taken.some(([from, to]) => x < to && x + width > from),
  }
}
