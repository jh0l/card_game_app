import { atom, atomFamily, selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { IndexedDBEffect, localStorageEffect } from '@/src/state/effects'

export function randomId() {
  return Date.now().toString(36) + Math.random().toString(36)
}

const cardDefinitionIds = atom<string[]>({
  key: 'cardDefinitions',
  default: [],
  effects: [localStorageEffect('card_indices')],
})
export const useCardDefinitionList = () => useRecoilState(cardDefinitionIds)
export const useCardDefinitionsListSet = () => useSetRecoilState(cardDefinitionIds)

/** used for looking up ImageDefinition in imageDefinitionIndexed */
export interface ImageDefinitionIdType {
  image_id: string
}

export interface CardDefinitionType {
  id: string
  tint: string
  description: string
  descriptionStyle: React.CSSProperties
  label: string
  labelStyle: React.CSSProperties
  name: string
  image?: ImageDefinitionIdType
  bumpMap?: ImageDefinitionIdType
  iridescentMap?: ImageDefinitionIdType
  health?: string
  attack?: string
  defence?: string
}
const cardDefinition = atomFamily<CardDefinitionType, string>({
  key: 'cardDefinition',
  default: {
    id: '',
    tint: '',
    name: '',
    image: undefined,
    bumpMap: undefined,
    iridescentMap: undefined,
    label: '',
    description: '',
    labelStyle: {},
    descriptionStyle: {},
  },
  effects: (key) => [localStorageEffect(key + '_card_definition')],
})
export const useCardDefinition = (id: string) => useRecoilState(cardDefinition(id))

const imageDefinitionIds = atom<string[]>({
  key: 'image_ids',
  default: [],
  effects: [IndexedDBEffect('image_definition_ids', '')],
})
export const useImageDefinitionIds = () => useRecoilState(imageDefinitionIds)
export const useImageDefinitionIdsSet = () => useSetRecoilState(imageDefinitionIds)

interface ImageDefinitionType {
  id: string
  name: string
  file?: File
  url?: string
}

const imageDefinitionIndexed = atomFamily<ImageDefinitionType, string>({
  key: 'image_definition_index',
  default: {
    id: '',
    name: '',
  },
  effects: (id) => [IndexedDBEffect('image_definition_index', id)],
})
export const useImageDefinition = (id: string) => useRecoilState(imageDefinitionIndexed(id))
export const useImageDefinitionSet = (id: string) => useSetRecoilState(imageDefinitionIndexed(id))

export const imageDefinitionURLSelector = selectorFamily<{ url: string | null }, string>({
  key: 'image_definition_url_selector',
  get:
    (id) =>
    ({ get }) => {
      const image = get(imageDefinitionIndexed(id))
      if (image.url) return { url: image.url }
      if (image.file) {
        const url = URL.createObjectURL(image.file)
        return { url }
      }
      return { url: null }
    },
})
const useImageDef = (id: { image_id: string }) => useRecoilValue(imageDefinitionURLSelector(id.image_id))
