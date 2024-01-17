import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** after `ms` of not being called, the next time it is called it will be throttled and timer of `ms` will be set to allow, then it will act as a normal throttle function, repeating the process */
export function throttler(ms: number) {
  let timeoutId: { id: number } | null = null
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
