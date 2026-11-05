export type SceneItem =
  | { kind: 'text'; key: string; text: string; x: number; y: number; size: number; opacity?: number }
  | { kind: 'line'; key: string; points: number[]; width: number; opacity: number }
  | { kind: 'dot'; key: string; x: number; y: number; radius: number; fill: string }

export const isText = (item: SceneItem) => item.kind === 'text'
