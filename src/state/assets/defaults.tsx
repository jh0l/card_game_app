import { useRecoilCallback } from 'recoil'
import monsterCard from '@/src/assets/Card backing monster.png'
import itemCard from '@/src/assets/Card backing ITEM cards.png'
import iridescent from '@/src/assets/iridescent_map.png'
import goose from '@/src/assets/goose.png'
import sun from '@/src/assets/Sun is back .png'
import eldritch from '@/src/assets/eldritch bodypart ITEM.png'
import potion from '@/src/assets/Basic Potion Lv1 ITEM.png'
import { imgToResizedFile } from '../../components/dom/ImageHandler'
import {
  ImageDefinitionType,
  randomId,
  imageDefinitionIndexed,
  imageDefinitionIds,
  GraphicDefinitionType,
  graphicDefinition,
  graphicDefinitionIds,
  CardDefinitionType,
  cardDefinitionState,
  cardDefinitionIds,
} from '.'
import { handCardsList } from '../room'

const IMAGES = [monsterCard, itemCard, iridescent, goose, eldritch, sun, potion]
const monsterCardIndex = 0
const itemCardIndex = 1
const iridIndex = 2
const gooseIndex = 3
const eldritchIndex = 4
const sunIndex = 5
const potionIndex = 6

export function useCreateDefaultCards() {
  return useRecoilCallback(
    ({ set }) =>
      async () => {
        const images: Array<ImageDefinitionType> = []
        // create image blobs from src/assets
        // resize images
        const loadImages = IMAGES.map((x) => imgToResizedFile(x, x))
        // create image definitions
        const res = await Promise.all(loadImages)
        for (const file of res) {
          if (!file) continue
          const imgDef: ImageDefinitionType = {
            id: randomId(),
            name: file.file.name,
            file: {
              name: file.file.name,
              size: file.file.size,
              type: file.file.type,
              lastModified: file.file.lastModified,
              lastModifiedDate: new Date(file.file.lastModified),
              blob: new Blob([file.file], { type: file.file.type }),
            },
          }
          set(imageDefinitionIndexed(imgDef.id), imgDef)
          images.push(imgDef)
        }
        set(imageDefinitionIds, (list) => [...list, ...images.map((x) => x.id)])
        const graphics: Array<GraphicDefinitionType> = []
        // create graphics
        for (const image of images) {
          if (image.name === images[iridIndex].name) continue
          const gfxDef: GraphicDefinitionType = {
            id: randomId(),
            name: image.name,
            image: { image_id: image.id },
            bumpMap: { image_id: image.id },
            iridescentMap: { image_id: images[iridIndex].id },
            width: image.width || 1,
            height: image.height || 1,
          }
          set(graphicDefinition(gfxDef.id), gfxDef)
          graphics.push(gfxDef)
        }
        set(graphicDefinitionIds, (list) => [...list, ...images.map((x) => x.id)])
        // create card definitions
        const cardDefs: Array<CardDefinitionType> = []
        // create goose, sun, eldritch, potion
        const cardGfx = graphics.find((x) => x.name === images[monsterCardIndex].name)
        if (!cardGfx) throw new Error('card gfx not found')

        // goose card
        const gooseGfx = graphics.find((x) => x.name === images[gooseIndex].name)
        if (!gooseGfx) throw new Error('goose gfx not found')
        // assign gooseGfx to goose gfx instance
        gooseCardDef.graphics[0].graphic_id = cardGfx.id
        gooseCardDef.graphics[1].graphic_id = gooseGfx.id
        cardDefs.push(gooseCardDef)

        // potion card
        const potionGfx = graphics.find((x) => x.name === images[potionIndex].name)
        // assign potionGfx to goose gfx instance
        if (!potionGfx) throw new Error('potion gfx not found')
        potionCardDef.graphics[0].graphic_id = cardGfx.id
        potionCardDef.graphics[1].graphic_id = potionGfx.id
        cardDefs.push(potionCardDef)

        // sun card
        const sunGfx = graphics.find((x) => x.name === images[sunIndex].name)
        if (!sunGfx) throw new Error('sun gfx not found')
        sunCardDef.graphics[0].graphic_id = cardGfx.id
        sunCardDef.graphics[1].graphic_id = sunGfx.id
        cardDefs.push(sunCardDef)

        // eldritch card
        const eldritchGfx = graphics.find((x) => x.name === images[eldritchIndex].name)
        if (!eldritchGfx) throw new Error('eldritch gfx not found')
        eldritchCardDef.graphics[0].graphic_id = cardGfx.id
        eldritchCardDef.graphics[1].graphic_id = eldritchGfx.id
        cardDefs.push(eldritchCardDef)

        // set card def state
        set(cardDefinitionIds, (list) => [...list, ...cardDefs.map((x) => x.id)])
        for (const cardDef of cardDefs) {
          set(cardDefinitionState(cardDef.id), cardDef)
        }

        // add to hand
        set(handCardsList, (list) => [...list, ...cardDefs.map((x) => ({ def_id: x.id, inst_id: randomId() }))])
      },
    [],
  )
}

const gooseCardDef: CardDefinitionType = {
  id: 'lsv7x26o0.33ml7igboxb',
  name: 'goose',
  graphics: [
    {
      label: 'card',
      inst_id: 'lsv7za7h0.buzgaxc2ojd',
      graphic_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
      enabled: true,
    },
    {
      label: 'art',
      inst_id: 'lsv7zic60.wo6btzkt7ta',
      graphic_id: '',
      position: [0, 0.25, 0.01],
      rotation: [0, 0, 0],
      width: 0.75,
      renderOrderOffset: 0,
      enabled: true,
    },
  ],
  props: {
    health: {
      prop_id: 'health',
      value: 'HP: 100',
      position: [-0.25, -0.57, 0.01],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    attack: {
      prop_id: 'attack',
      value: '',
      position: [0, 0, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 1,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    defence: {
      prop_id: 'defence',
      value: '',
      position: [0, 0, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 1,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    description: {
      prop_id: 'description',
      value: 'a magical goose that grants you death',
      position: [-0.41, -0.35, 0.01],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 0.85,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    name: {
      prop_id: 'name',
      value: 'goose',
      position: [-0.4, -0.3, 0.01],
      vertical_anchor: 'middle',
      horizontal_anchor: 'left',
      size: 4,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
  },
  cardType: 'monster',
}

const potionCardDef: CardDefinitionType = {
  id: 'lsv6zf9y0.qpe62pu8dnh',
  name: 'basic potion',
  graphics: [
    {
      label: 'card',
      inst_id: 'lsv76ev80.zuf5alhcpc',
      graphic_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
      enabled: true,
    },
    {
      label: 'art',
      inst_id: 'lsv7gpe30.keoyxxzbjg9',
      graphic_id: '',
      position: [0.15, 0.25, 0.01],
      rotation: [0, 0, 0],
      width: 0.85,
      renderOrderOffset: 0,
      enabled: true,
    },
  ],
  props: {
    description: {
      prop_id: 'description',
      value: 'a magical potion that grants you 10 health',
      position: [-0.21, -0.35, 0.05],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 0.6,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    name: {
      prop_id: 'name',
      value: 'potion',
      position: [-0.2, -0.3, 0.05],
      vertical_anchor: 'middle',
      horizontal_anchor: 'left',
      size: 4,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
  },
  cardType: 'item',
}

const sunCardDef: CardDefinitionType = {
  id: 'lsv8oqov0.hes468i5kn',
  name: 'the sun',
  graphics: [
    {
      label: 'card',
      inst_id: 'lsv8qv8p0.955drk8ixfv',
      graphic_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
      enabled: true,
    },
    {
      label: 'art',
      inst_id: 'lsv8raeq0.9nfm8jmtvio',
      graphic_id: '',
      position: [0, 0.25, 0.01],
      rotation: [0, 0, 0],
      width: 0.85,
      renderOrderOffset: 0,
      enabled: true,
    },
  ],
  props: {
    health: {
      prop_id: 'health',
      value: 'HP: 99999',
      position: [-0.25, -0.57, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 1,
      x_scale: 0.75,
      render_order_offset: 0,
      enabled: true,
    },
    attack: {
      prop_id: 'attack',
      value: '',
      position: [0, 0, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 1,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    defence: {
      prop_id: 'defence',
      value: '',
      position: [0, 0, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 1,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    description: {
      prop_id: 'description',
      value:
        "A magical star that grants you skin cancer if you spend too long exposed to it's harmful ultraviolet rays",
      position: [-0.41, -0.35, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 0.85,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    name: {
      prop_id: 'name',
      value: 'the sun',
      position: [-0.4, -0.3, 0],
      vertical_anchor: 'middle',
      horizontal_anchor: 'left',
      size: 4,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
  },
  cardType: 'monster',
}

const eldritchCardDef: CardDefinitionType = {
  id: 'lt03x9pi0.0xyy6x43h1q',
  name: 'Eldritch Body Part',
  graphics: [
    {
      label: 'card',
      inst_id: 'lt03zaxk0.7vzqrcc8soe',
      graphic_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
      enabled: true,
    },
    {
      label: 'art',
      inst_id: 'lt043kts0.86de2toqzlc',
      graphic_id: '',
      position: [0.15, 0.2, 0],
      rotation: [0, 0, 0],
      width: 0.8,
      renderOrderOffset: 0,
      enabled: true,
    },
  ],
  props: {
    health: {
      prop_id: 'health',
      value: '',
      position: [0, 0, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 1,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: false,
    },
    attack: {
      prop_id: 'attack',
      value: 'ATK: 2000',
      position: [-0.1, -0.6, 0],
      vertical_anchor: 'middle',
      horizontal_anchor: 'center',
      size: 2,
      width: 1,
      x_scale: 0.9,
      render_order_offset: 0,
      enabled: false,
    },
    defence: {
      prop_id: 'defence',
      value: 'DEF: 2000',
      position: [0, -0.55, 0],
      vertical_anchor: 'middle',
      horizontal_anchor: 'center',
      size: 2,
      width: 1,
      x_scale: 1,
      render_order_offset: 0,
      enabled: false,
    },
    description: {
      prop_id: 'description',
      value: 'a magical Body Part that grants you 10 health',
      position: [-0.21, -0.35, 0],
      vertical_anchor: 'top',
      horizontal_anchor: 'left',
      size: 2,
      width: 0.6,
      x_scale: 1,
      render_order_offset: 0,
      enabled: true,
    },
    name: {
      prop_id: 'name',
      value: 'Eldritch Body Part',
      position: [-0.2, -0.25, 0],
      vertical_anchor: 'middle',
      horizontal_anchor: 'left',
      size: 3,
      width: 1,
      x_scale: 0.7,
      render_order_offset: 0,
      enabled: true,
    },
  },
  cardType: 'item',
}
const cardDefJSON: CardDefinitionType[] = [gooseCardDef, sunCardDef, eldritchCardDef, potionCardDef]
