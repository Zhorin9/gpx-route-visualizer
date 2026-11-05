export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const clamp01 = (value: number) => clamp(value, 0, 1)

export function niceStep(rough: number) {
  const power = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 5, 10].map((m) => m * power).find((step) => step >= rough) ?? power * 10
}
