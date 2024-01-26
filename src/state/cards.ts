import {
  atom,
  atomFamily,
  selector,
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
export const useHandCardsListSet = () => useSetRecoilState(handCardsList)
export const useHandCardsList = () => useRecoilState(handCardsList)
interface ReorderCallback {
  order(CARD_STATE: { positionsIndex: number }[]): void
}
export const useHandCardsReorder = () =>
  useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      (callback: (order: ReorderCallback) => void) => {
        transact_UNSTABLE(({ set, get }) => {
          callback({
            order(CARD_STATE: { positionsIndex: number }[]) {
              const newList = [...get(handCardsList)]
              const cardRange = get(cardRangeAtom)
              const visible = newList.slice(cardRange[0], cardRange[1])
              for (let i = 0; i < visible.length; i++) {
                const newIndex = CARD_STATE[i].positionsIndex + cardRange[0]
                if (visible[i] === undefined) {
                  debugger
                }
                newList[newIndex] = visible[i]
              }
              // remove doubles while keeping order of array
              set(handCardsList, Array.from(new Set(newList)))
            },
          })
        })
      },
    [],
  )

const cardRangeAtom = atom<number[]>({
  key: 'cardRange',
  default: [0, MAX_VISIBLE_CARDS - 1],
})

export const useCardRangeValue = () => useRecoilValue(cardRangeAtom)
export const useCardRangeSet = () => useSetRecoilState(cardRangeAtom)
export const useCardRange = () => useRecoilState(cardRangeAtom)

const visibleCardsSelector = selector<number>({
  key: 'visibleCards',
  get: ({ get }) => {
    const [start, end] = get(cardRangeAtom)
    return end - start
  },
})
export const useVisibleCardsCount = () => useRecoilValue(visibleCardsSelector)

interface CardActive {
  identity: string
  type: 'hand' | 'table'
}
const cardActive = atom<CardActive | false>({
  key: 'activeCard',
  default: false,
})

export const useCardActive = () => useRecoilState(cardActive)
export const useCardActiveValue = () => useRecoilValue(cardActive)
export const useCardActiveSet = () => useSetRecoilState(cardActive)

interface TableParameters {
  size: number
  position: Vec3
  cardSize: number
  subdivisions: number
  edges: {
    left: number
    right: number
    top: number
    bottom: number
  }
}
const tableParams = atom<TableParameters>({
  key: 'tableParams',
  default: {
    size: 1,
    position: [0, 0, 0],
    cardSize: 0.15,
    subdivisions: 20,
    edges: {
      left: -0.5,
      right: 0.5,
      top: 0.5,
      bottom: -0.5,
    },
  },
})

export const useTableParamsValue = () => useRecoilValue(tableParams)
export const useTableParamsSet = () => useSetRecoilState(tableParams)

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
export const useTableCardAdd = () => {
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

export const useCardMoveTableHand = () => {
  return useRecoilCallback(
    ({ set }) =>
      (identity: string) => {
        set(handCardsList, (list) => {
          // for some reason sometimes we get duplicates
          if (list.includes(identity)) {
            return list
          }
          const newList = [...list, identity]
          return newList
        })
        set(tableCardList, (list) => {
          const res = list.filter((card) => card !== identity)
          return res
        })
      },
    [],
  )
}
