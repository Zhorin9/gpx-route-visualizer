export interface ColorRun {
  color: string
  // Vertex range [from, to], inclusive; neighbouring runs share their end vertex.
  from: number
  to: number
}

// Consecutive pieces of the same colour become one path: few strokes, no seams.
export function colorRuns(positions: readonly number[], at: (pos: number) => string): ColorRun[] {
  const runs: ColorRun[] = []
  for (let i = 0; i + 1 < positions.length; i++) {
    const color = at((positions[i] + positions[i + 1]) / 2)
    const last = runs[runs.length - 1]
    if (last && last.color === color) last.to = i + 1
    else runs.push({ color, from: i, to: i + 1 })
  }
  return runs
}
