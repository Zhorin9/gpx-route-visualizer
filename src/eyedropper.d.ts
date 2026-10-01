// The EyeDropper API isn't in TypeScript's bundled DOM lib yet.
interface EyeDropperOpenResult {
  sRGBHex: string
}

interface EyeDropper {
  open: () => Promise<EyeDropperOpenResult>
}

interface EyeDropperConstructor {
  new (): EyeDropper
}

interface Window {
  EyeDropper?: EyeDropperConstructor
}
