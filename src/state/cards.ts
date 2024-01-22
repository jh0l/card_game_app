import {
  atom,
  atomFamily,
  selectorFamily,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil'
import { Vec3 } from '../lib/types'
import { createHash } from 'crypto'

export const MAX_VISIBLE_CARDS = 7
const CARDS = 20

// comic book sticker colors
export const COLORS: { color: string; luma: number }[] = [
  '#4f4cf6',
  '#4c69f6',
  '#4c94f6',
  '#4ccbf6',
  '#4cf6e5',
  '#4cf6b8',
  '#4cf68c',
  '#4cf65f',
  '#4cf633',
  '#6ef633',
  '#9cf633',
  '#c8f633',
  '#f6f633',
  '#f6db35',
  '#ffc510',
  '#ffb252',
  '#f76433',
  '#ee5454',
  '#ee54a8',
  '#ee54f0',
  '#c454ee',
  '#9b54ee',
  '#7c54ee',
  '#5e54ee',
  '#545bee',
].map((color) => ({ color, luma: luma(color) }))

function luma(color: string): number {
  // https://www.w3.org/TR/AERT/#color-contrast
  const rgb = parseInt(color.slice(1), 16)
  const red = (rgb >> 16) & 0xff
  const green = (rgb >> 8) & 0xff
  const blue = (rgb >> 0) & 0xff
  // returns the perceptive luminance of a color as a value between 0 and 1
  const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue // per ITU-R BT.709
  return luma / 255
}

function hash(str: string): number {
  const hasher = createHash('md5')
  const res = hasher.update(str).digest('hex')
  return parseInt(res, 16)
}

const cardColorSelector = selectorFamily<{ color: string; luma: number }, string>({
  key: 'cardColor',
  get: (identity) => () => {
    if (identity === undefined) {
      debugger
    }
    // convert identity to character code
    let id = parseInt(identity.toLowerCase(), 36)
    if (isNaN(id)) {
      id = Math.floor(Math.random() * COLORS.length)
    }
    const color = COLORS[id % COLORS.length]
    return color
  },
})

export const useCardColor = (identity: string) => useRecoilValue(cardColorSelector(identity))

const cards = Array.from({ length: CARDS })
  .fill(0)
  .map((_, i) => {
    return String(i + 1)
  })
const handCardsList = atom<string[]>({
  key: 'handsCardsList',
  default: cards,
})

export const useHandCardsListValue = () => useRecoilValue(handCardsList)
export const useSetHandCardsList = () => useSetRecoilState(handCardsList)
export const useHandCardsList = () => useRecoilState(handCardsList)

const cardRangeAtom = atom<number[]>({
  key: 'cardRange',
  default: [0, MAX_VISIBLE_CARDS - 1],
})
export const useCardRangeValue = () => useRecoilValue(cardRangeAtom)
export const useSetCardRange = () => useSetRecoilState(cardRangeAtom)
export const useCardRange = () => useRecoilState(cardRangeAtom)

const cardActive = atom<string | false>({
  key: 'activeCard',
  default: false,
})

export const useCardActive = () => useRecoilState(cardActive)
export const useCardActiveValue = () => useRecoilValue(cardActive)
export const useSetCardActive = () => useSetRecoilState(cardActive)

const tableParams = atom<{ size: number; position: Vec3; cardSize: number; subdivisions: number }>({
  key: 'tableParams',
  default: {
    size: 1,
    position: [0, 0, 0],
    cardSize: 0.15,
    subdivisions: 20,
  },
})

export const useTableParamsValue = () => useRecoilValue(tableParams)
export const useSetTableParams = () => useSetRecoilState(tableParams)

const tableCardList = atom<string[]>({
  key: 'tableCardList',
  default: [],
})

type CardParams = { position: Vec3; rotation: Vec3 }
const tableCardParams = atomFamily<CardParams, string>({
  key: 'tableCardParams',
  default: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
})

export const useTableCardListValue = () => useRecoilValue(tableCardList)
export const useAddTableCard = () => {
  return useRecoilCallback(
    ({ set }) =>
      (params: CardParams, identity: string) => {
        set(tableCardParams(identity), params)
        set(tableCardList, (list) => [...list, identity])
        set(handCardsList, (list) => list.filter((card) => card !== identity))
      },
    [],
  )
}

export const useTableCardParams = (identity: string) => useRecoilState(tableCardParams(identity))

export const useAddHandCard = () => {
  return useRecoilCallback(
    ({ set }) =>
      (identity: string) => {
        set(handCardsList, (list) => {
          console.log('HAND LIST', list)
          // for some reason sometimes we get duplicates
          if (list.includes(identity)) {
            return list
          }
          const newList = [...list, identity]
          return newList
        })
        set(tableCardList, (list) => {
          const res = list.filter((card) => card !== identity)
          console.log('TABLE LIST', res)
          return res
        })
      },
    [],
  )
}
