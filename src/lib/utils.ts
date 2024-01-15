import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
