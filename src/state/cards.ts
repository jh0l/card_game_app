import { atom, useRecoilValue, useSetRecoilState } from 'recoil'

const CARDS = 20
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

const cardRangeAtom = atom<number[]>({
  key: 'cardRange',
  default: [0, 7],
})
export const useCardRangeValue = () => useRecoilValue(cardRangeAtom)
export const useSetCardRange = () => useSetRecoilState(cardRangeAtom)
