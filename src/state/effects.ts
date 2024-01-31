import localforage from 'localforage'
import { AtomEffect, DefaultValue } from 'recoil'

export const localStorageEffect: <T>(key: string) => AtomEffect<T> =
  (key: string) =>
  ({ setSelf, onSet }) => {
    try {
      setSelf(new DefaultValue())
      if (typeof localStorage === 'undefined') return
      const savedValue = localStorage.getItem(key)
      if (savedValue != null) {
        setTimeout(() => setSelf(JSON.parse(savedValue)))
      }
    } catch (e) {
      console.warn('Unable to restore value for key:', key, e)
    }

    onSet((newValue, _, isReset) => {
      try {
        isReset ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(newValue))
      } catch (e) {
        console.warn('Unable to store value for key:', key, e)
      }
    })
  }

export const IndexedDBEffect: <T>(store: string, primary_key: string) => AtomEffect<T> = (
  store: string,
  primary_key: string,
) => {
  return ({ setSelf, onSet }) => {
    const key = store + ':' + primary_key
    setSelf(new DefaultValue())
    if (typeof localStorage === 'undefined') return

    setSelf(localforage.getItem<any>(key).then((savedValue) => (savedValue != null ? savedValue : new DefaultValue())))

    // Subscribe to state changes and persist them to localForage
    onSet((newValue, _, isReset) => {
      isReset ? localforage.removeItem(key) : localforage.setItem(key, newValue)
    })
  }
}

// const currentUserIDState = atom({
//   key: 'CurrentUserID',
//   default: 1,
//   effects: [IndexDBEffect('current_user')],
// })
