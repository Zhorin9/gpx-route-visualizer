import type { ComponentType } from 'react'
import type { BackgroundKind } from '../../types'

// A kind of background a feature adds (the map): its place in the "Rodzaj tła" switch,
// what choosing it does and its own settings in the panel.
export interface BackgroundKindDef {
  kind: BackgroundKind
  label: string
  select: () => void
  Panel: ComponentType
}

const kinds: BackgroundKindDef[] = []

export function registerBackgroundKind(def: BackgroundKindDef): void {
  const i = kinds.findIndex((k) => k.kind === def.kind)
  if (i >= 0) kinds.splice(i, 1, def)
  else kinds.push(def)
}

export function backgroundKind(kind: BackgroundKind): BackgroundKindDef | undefined {
  return kinds.find((k) => k.kind === kind)
}

export function backgroundKinds(): readonly BackgroundKindDef[] {
  return kinds
}
