import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

export const MAX_VISIBLE_CARDS = 7
const CARDS = 14

const cards = Array.from({ length: CARDS })
  .fill(0)
  .map((_, i) => {
    return String(i + 1)
  })
const cardsList = atom<string[]>({
  key: 'cardsList',
  default: cards,
})

export const useCardsListValue = () => useRecoilValue(cardsList)
export const useSetCardsList = () => useSetRecoilState(cardsList)
export const useCardsList = () => useRecoilState(cardsList)

const cardRangeAtom = atom<number[]>({
  key: 'cardRange',
  default: [0, MAX_VISIBLE_CARDS - 1],
})
export const useCardRangeValue = () => useRecoilValue(cardRangeAtom)
export const useSetCardRange = () => useSetRecoilState(cardRangeAtom)
export const useCardRange = () => useRecoilState(cardRangeAtom)
