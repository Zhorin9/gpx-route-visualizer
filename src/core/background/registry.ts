import type { ComponentType } from 'react'
import type { BackgroundKind } from '../../types'

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
