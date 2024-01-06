/**
.mapLinear ( x : Float, a1 : Float, a2 : Float, b1 : Float, b2 : Float ) : Float

x — Value to be mapped.
a1 — Minimum value for range A.
a2 — Maximum value for range A.
b1 — Minimum value for range B.
b2 — Maximum value for range B.

Linear mapping of x from range [a1, a2] to range [b1, b2]. 
// clamp x to [a1, a2]
 */
// export function mapLinear(x: number, a1: number, a2: number, b1: number, b2: number) {
//   x = Math.max(a1, Math.min(a2, x))
//   return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1)
// }
// Swap a1 and a2 if the range is descending
// Swap b1 and b2 if the range is descending
// Clamp x to the range [a1, a2]
// Map x to the range [b1, b2]
export function mapLinear(x, a, b, c, d) {
  let invert = false
  if (a > b) {
    ;[a, b] = [b, a]
    invert = true
  }
  if (c > d) {
    ;[c, d] = [d, c]
    invert = !invert
  }
  x = Math.max(a, Math.min(b, x))
  let v = c + ((x - a) * (d - c)) / (b - a)
  v = invert ? c + d - v : v
  return v
}
