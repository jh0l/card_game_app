import { atom, atomFamily, useRecoilCallback, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { Vec3 } from '../lib/types'

export const MAX_VISIBLE_CARDS = 7
const CARDS = 20

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

export const useCardActiveValue = () => useRecoilValue(cardActive)
export const useSetCardActive = () => useSetRecoilState(cardActive)

const tableParams = atom<{ size: number; position: Vec3 }>({
  key: 'tableParams',
  default: {
    size: 1,
    position: [0, 0, 0],
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
export const useTableCardParams = (identity: string) => useRecoilValue(tableCardParams(identity))
