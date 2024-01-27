import { AtomEffect } from 'recoil'

export const localStorageEffect: <T>(key: string) => AtomEffect<T> =
  (key: string) =>
  ({ setSelf, onSet }) => {
    try {
      const savedValue = localStorage.getItem(key)
      if (savedValue != null) {
        setSelf(JSON.parse(savedValue))
      }
    } catch (e) {
      console.warn('Unable to restore value for key:', key)
    }

    onSet((newValue, _, isReset) => {
      try {
        isReset ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(newValue))
      } catch (e) {
        console.warn('Unable to store value for key:', key)
      }
    })
  }
