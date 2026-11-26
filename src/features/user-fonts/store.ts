import fallbackFontUrl from '@fontsource/patrick-hand/files/patrick-hand-latin-ext-400-normal.woff2?url'
import { isBuiltInFont, provideUserFontLoad, provideUserFonts } from '../../utils/fonts'
import { missingPolishLetters } from './polishLetters'

export interface UserFont {
  family: string
  fileName: string
  missing: string[]
}

interface StoredFont extends UserFont {
  data: ArrayBuffer
}

const DB_NAME = 'tripcard-fonts'
const STORE = 'fonts'
const ACCEPTED = /\.(ttf|otf|woff2?)$/i

let fonts: UserFont[] = []
const listeners = new Set<() => void>()
const faces = new Map<string, FontFace[]>()

function changed(next: UserFont[]) {
  fonts = next
  listeners.forEach((l) => l())
}

export const userFonts = () => fonts

export function subscribeUserFonts(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'family' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function inStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const codePoints = (letters: string[]) => letters.map((l) => `U+${l.codePointAt(0)!.toString(16).toUpperCase()}`).join(', ')

async function register(font: StoredFont): Promise<void> {
  const own = new FontFace(font.family, font.data.slice(0))
  document.fonts.add(await own.load())
  const added = [own]
  if (font.missing.length) {
    const borrowed = new FontFace(font.family, `url(${fallbackFontUrl})`, { unicodeRange: codePoints(font.missing) })
    document.fonts.add(await borrowed.load())
    added.push(borrowed)
  }
  faces.set(font.family, added)
}

function familyFromFile(fileName: string): string {
  const base = fileName.replace(ACCEPTED, '').replace(/[_-]+/g, ' ').trim() || 'Mój krój'
  let family = base
  for (let n = 2; isBuiltInFont(family) || fonts.some((f) => f.family === family); n++) family = `${base} ${n}`
  return family
}

export async function addUserFont(file: File): Promise<UserFont> {
  if (!ACCEPTED.test(file.name)) throw new Error('format')
  const data = await file.arrayBuffer()
  const family = familyFromFile(file.name)
  const own = await new FontFace(family, data.slice(0)).load()
  document.fonts.add(own)
  const missing = missingPolishLetters(family)
  document.fonts.delete(own)
  const stored: StoredFont = { family, fileName: file.name, missing, data }
  const load = register(stored)
  provideUserFontLoad(family, load)
  await load
  await inStore('readwrite', (store) => store.put(stored))
  const font = { family, fileName: file.name, missing }
  changed([...fonts, font])
  return font
}

export async function removeUserFont(family: string): Promise<void> {
  faces.get(family)?.forEach((face) => document.fonts.delete(face))
  faces.delete(family)
  await inStore('readwrite', (store) => store.delete(family))
  changed(fonts.filter((f) => f.family !== family))
}

export function restoreUserFonts(): void {
  const listed = inStore<StoredFont[]>('readonly', (store) => store.getAll())
    .then((stored) => {
      stored.forEach((font) => provideUserFontLoad(font.family, register(font).catch(() => undefined)))
      changed(stored.map(({ family, fileName, missing }) => ({ family, fileName, missing })))
    })
    .catch(() => undefined)
  provideUserFonts(listed)
}
