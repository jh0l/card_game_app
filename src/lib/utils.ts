import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import throttle from 'lodash.throttle'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * @param {number} ms
  overcomplicated throttle that allows for an initial delay before the first positive
  for example, if you want to wait 500ms before the first positive, and then 100ms between each positive
  call the function with ms = 100 and initialDelay = 500
  it will reset to the initial delay if not called for half the initial delay
 */
export function throttler(ms: number, initialDelay: number) {
  let resetTimeout: NodeJS.Timeout
  let result = false
  let initial = true
  let ready = -1
  const throt = throttle(() => {
    result = true
  }, ms)
  return () => {
    if (ready < 0) {
      ready = Date.now() + initialDelay
    }
    if (Date.now() > ready) {
      throt()
    }
    const temp = result
    result = false
    clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      result = false
      initial = true
      ready = -1
    }, initialDelay / 2)
    return temp
  }
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

export function crop(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x))
}
