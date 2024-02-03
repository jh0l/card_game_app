import {
  SerializableParam,
  atom,
  atomFamily,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil'
import { IndexedDBEffect, localStorageEffect } from '@/src/state/effects'
import { Vec3 } from '../lib/types'

export function randomId() {
  return Date.now().toString(36) + Math.random().toString(36)
}

/** CARD STATE */

export const cardDefinitionIds = atom<string[]>({
  key: 'cardDefinitions',
  default: [],
  effects: [IndexedDBEffect('card_definition_id_list', '')],
})
export const useCardDefinitionList = () => useRecoilState(cardDefinitionIds)
export const useCardDefinitionsListSet = () => useSetRecoilState(cardDefinitionIds)

/** used for looking up ImageDefinition in imageDefinitionIndexed */
export interface ImageDefinitionIdType {
  image_id: string
}
export interface TextureDefinitionIdType {
  texture_id: string
}

export interface CardInstanceIdType extends Readonly<{ [key: string]: SerializableParam }> {
  def_id: string
  inst_id: string
}

export interface TextureInstanceType {
  inst_id: string
  texture_id: string
  position: Vec3
  rotation: Vec3
  width: number
  renderOrderOffset: number
}
export interface CardDefinitionType {
  id: string
  description: string
  label: string
  name: string
  graphics: TextureInstanceType[]
  health?: string
  attack?: string
  defence?: string
}
const cardDefinition = atomFamily<CardDefinitionType, string>({
  key: 'cardDefinition',
  default: {
    id: '',
    name: '',
    graphics: [],
    label: '',
    description: '',
  },
  effects: (key) => [IndexedDBEffect('card_definition', key)],
})
export const useCardDefinition = (id: string) => useRecoilState(cardDefinition(id))
export const useSetCardDefinition = (id: string) => useSetRecoilState(cardDefinition(id))

/** TEXTURE STATE */
export interface TextureDefinitionType {
  name: string
  image: ImageDefinitionIdType
  bumpMap: ImageDefinitionIdType
  iridescentMap: ImageDefinitionIdType
  width: number
  height: number
  available?: number
}
const textureDefinition = atomFamily<TextureDefinitionType, string>({
  key: 'textureDefinition',
  default: {
    name: '',
    image: { image_id: '' },
    bumpMap: { image_id: '' },
    iridescentMap: { image_id: '' },
    width: 1,
    height: 1,
  },
  effects: (key) => [IndexedDBEffect('texture_definition', key)],
})
export const useTextureDefinition = (id: string) => useRecoilState(textureDefinition(id))
export const useSetTextureDefinition = (id: string) => useSetRecoilState(textureDefinition(id))
const textureDefinitionIds = atom<string[]>({
  key: 'textureDefinitionIds',
  default: [],
  effects: [localStorageEffect('texture_definition_ids')],
})
export const useTextureDefinitionIds = () => useRecoilState(textureDefinitionIds)
export const useTextureDefinitionIdsList = () => useRecoilValue(textureDefinitionIds)
export const useTextureDefinitionIdsListSet = () => useSetRecoilState(textureDefinitionIds)

/** IMAGE STATE */

const imageDefinitionIds = atom<string[]>({
  key: 'image_ids',
  default: [],
  effects: [IndexedDBEffect('image_definition_ids', '')],
})
export const useImageDefinitionIdsList = () => useRecoilValue(imageDefinitionIds)
export const useImageDefinitionIds = () => useRecoilState(imageDefinitionIds)
export const useImageDefinitionIdsSet = () => useSetRecoilState(imageDefinitionIds)

export interface BlobFile {
  blob: Blob
  lastModified: number
  lastModifiedDate: Date
  name: string
  size: number
  type: string
}

interface ImageDefinitionType {
  id: string
  name: string
  file?: BlobFile
  url?: string
  width?: number
  height?: number
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

interface ImageDefinitionUrl extends ImageDefinitionType {
  url: string
  width: number
  height: number
}

export const imageDefinitionURLSelector = selectorFamily<ImageDefinitionUrl, string>({
  key: 'image_definition_url_selector',
  get:
    (id) =>
    async ({ get }) => {
      const image = get(imageDefinitionIndexed(id))
      const imageUrl: ImageDefinitionUrl = { ...image, width: 1, height: 1, url: image.url || '' }
      if (imageUrl.file) {
        const url = URL.createObjectURL(imageUrl.file.blob)
        const img = new Image()
        img.src = url
        await new Promise((resolve) => (img.onload = resolve))
        const width = img.width
        const height = img.height
        return { ...imageUrl, url, width, height }
      }
      if (imageUrl.url) {
        const url: string = imageUrl.url
        const img = new Image()
        img.src = url
        await new Promise((resolve) => (img.onload = resolve))
        const width = img.width
        const height = img.height
        return { ...imageUrl, width, height }
      }
      return { ...imageUrl, width: 0, height: 0 }
    },
})
export const useImageDefUrl = (id: { image_id: string }) => useRecoilValue(imageDefinitionURLSelector(id.image_id))
