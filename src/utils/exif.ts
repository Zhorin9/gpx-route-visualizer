import type { PhotoGeo } from '../types'

const EXIF_IFD = 0x8769
const GPS_IFD = 0x8825
const DATE_TIME_ORIGINAL = 0x9003
const OFFSET_TIME_ORIGINAL = 0x9011
const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

type Entry = { type: number; count: number; valueOffset: number }

function readIfd(view: DataView, tiff: number, offset: number, little: boolean): Map<number, Entry> {
  const entries = new Map<number, Entry>()
  if (tiff + offset + 2 > view.byteLength) return entries
  const count = view.getUint16(tiff + offset, little)
  for (let i = 0; i < count; i++) {
    const at = tiff + offset + 2 + i * 12
    if (at + 12 > view.byteLength) break
    const type = view.getUint16(at + 2, little)
    const n = view.getUint32(at + 4, little)
    // Values of up to 4 bytes sit in the entry itself, longer ones elsewhere.
    const inline = (TYPE_SIZES[type] ?? 1) * n <= 4
    entries.set(view.getUint16(at, little), { type, count: n, valueOffset: inline ? at + 8 : tiff + view.getUint32(at + 8, little) })
  }
  return entries
}

function ascii(view: DataView, e: Entry | undefined): string | undefined {
  if (!e || e.valueOffset + e.count > view.byteLength) return undefined
  let s = ''
  for (let i = 0; i < e.count; i++) {
    const c = view.getUint8(e.valueOffset + i)
    if (c === 0) break
    s += String.fromCharCode(c)
  }
  return s
}

function rationals(view: DataView, e: Entry | undefined, little: boolean): number[] | undefined {
  if (!e || e.type !== 5 || e.valueOffset + e.count * 8 > view.byteLength) return undefined
  return Array.from({ length: e.count }, (_, i) => {
    const den = view.getUint32(e.valueOffset + i * 8 + 4, little)
    return den ? view.getUint32(e.valueOffset + i * 8, little) / den : 0
  })
}

const pointer = (view: DataView, e: Entry | undefined, little: boolean) => (e ? view.getUint32(e.valueOffset, little) : undefined)

// "2026:07:14 06:12:40" with an optional "+02:00".
export function parseExifDate(value: string, offset?: string): number | undefined {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(value)
  if (!m) return undefined
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number)
  const o = offset && /^([+-])(\d{2}):(\d{2})$/.exec(offset)
  if (o) return Date.UTC(y, mo - 1, d, h, mi, s) - (o[1] === '-' ? -1 : 1) * (Number(o[2]) * 60 + Number(o[3])) * 60_000
  const t = new Date(y, mo - 1, d, h, mi, s).getTime()
  return Number.isFinite(t) ? t : undefined
}

// Reads the TIFF block of a JPEG's APP1 segment; anything else (PNG, HEIC, a damaged file) has no EXIF here.
export function parseExif(buffer: ArrayBuffer): PhotoGeo {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {}
  let at = 2
  while (at + 4 <= view.byteLength) {
    const marker = view.getUint16(at)
    const size = view.getUint16(at + 2)
    if (marker === 0xffe1 && at + 10 <= view.byteLength && view.getUint32(at + 4) === 0x45786966) return parseTiff(view, at + 10)
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break
    at += 2 + size
  }
  return {}
}

function parseTiff(view: DataView, tiff: number): PhotoGeo {
  if (tiff + 8 > view.byteLength) return {}
  const little = view.getUint16(tiff) === 0x4949
  const ifd0 = readIfd(view, tiff, view.getUint32(tiff + 4, little), little)
  const out: PhotoGeo = {}

  const exifAt = pointer(view, ifd0.get(EXIF_IFD), little)
  if (exifAt !== undefined) {
    const exif = readIfd(view, tiff, exifAt, little)
    const date = ascii(view, exif.get(DATE_TIME_ORIGINAL))
    if (date) out.time = parseExifDate(date, ascii(view, exif.get(OFFSET_TIME_ORIGINAL)))
  }

  const gpsAt = pointer(view, ifd0.get(GPS_IFD), little)
  if (gpsAt !== undefined) {
    const gps = readIfd(view, tiff, gpsAt, little)
    const lat = rationals(view, gps.get(2), little)
    const lon = rationals(view, gps.get(4), little)
    const deg = ([d, m, s]: number[]) => d + m / 60 + s / 3600
    // Cameras without a fix write zeros.
    if (lat?.length === 3 && lon?.length === 3 && deg(lat) + deg(lon) > 0) {
      out.lat = deg(lat) * (ascii(view, gps.get(1)) === 'S' ? -1 : 1)
      out.lon = deg(lon) * (ascii(view, gps.get(3)) === 'W' ? -1 : 1)
    }
  }
  return out
}

// EXIF sits at the start of the file; the rest of a 10 MB photo isn't needed.
export async function readExif(file: Blob): Promise<PhotoGeo> {
  try {
    return parseExif(await file.slice(0, 256 * 1024).arrayBuffer())
  } catch {
    return {}
  }
}
