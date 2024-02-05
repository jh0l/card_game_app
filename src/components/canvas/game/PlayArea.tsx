'use client'
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { MouseEventHandler, useEffect, useMemo, useRef, useState, Suspense, memo } from 'react'
import { useTexture, Text, MapControls } from '@react-three/drei'
import { crop, mapLinear, throttler } from '@/src/lib/utils'
import * as THREE from 'three'
import * as THREELIB from 'three-stdlib'
import { atom, atomFamily, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import {
  MAX_VISIBLE_CARDS,
  useCardMoveTableHand,
  useTableCardAdd,
  useCardActive,
  useCardActiveValue,
  useCardRangeValue,
  useHandCardsListValue,
  useHandCardsReorder,
  useCardActiveSet,
  useTableParamsSet,
  useTableCardListValue,
  useTableCardParams,
  useTableParamsValue,
  useVisibleCardsCount,
} from '@/src/state/room'
import { PosRot, Vec3 } from '@/src/lib/types'
import { useCamControls, useDontMoveCamera, useSetDontMoveCamera } from '@/src/state/scene'
import { Button } from '../../ui/button'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import { CardInstanceIdType } from '@/src/state/assets'
import { CardMesh } from './CardMesh'

const DEPTH = {
  TABLE_CARDS: 10,
  HAND_CARDS: 1000,
}

const MASS = 1.3
const FRICTION = 77
const CARD_THICK = 0.05
const TEXT = 0.2

const { abs } = Math

const zVec: Vec3 = [0, 0, 0] as const
const zPositions: PosRot = { position: zVec, rotation: zVec }
const zVector3 = new THREE.Vector3(0, 0, 0)
type FastSharedState = {
  active: { cardIndex: number; offset: THREE.Vector3; first?: () => void; closest: number } | false
}
const SELECTED_CARD_STATE: FastSharedState = { active: false }
type FastSelfState = { positionsIndex: number; current: PosRot }[]
const CARD_STATE: FastSelfState = Array.from({ length: MAX_VISIBLE_CARDS }).map((_, i) => ({
  current: { position: zVec, rotation: zVec },
  positionsIndex: i,
}))

const POSITIONS: PosRot[] = Array.from({ length: MAX_VISIBLE_CARDS }).map((_, i) => ({
  position: zVec,
  rotation: zVec,
}))

const defaultRotation = [0, 0.2, 0] as Vec3
const flippingRotation = [0, 1, 0] as Vec3

function isSame(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

const liveDataAtom = atomFamily<string | null, CardInstanceIdType>({
  key: 'liveData',
  default: null,
})

function LiveText({
  index,
  renderOrder: depth,
  position,
}: {
  index: CardInstanceIdType
  renderOrder: number
  position: Vec3
}) {
  const data = useRecoilValue(liveDataAtom(index))
  const isDark = true
  return (
    <Text
      renderOrder={depth}
      material-depthTest={false}
      material-depthWrite={false}
      font='Rubik-Regular.ttf'
      scale={[TEXT / 2, TEXT / 2, TEXT / 2]}
      color={isDark ? 'white' : 'black'}
      anchorX='left'
      anchorY='bottom-baseline'
      position={position}
    >
      {data}
    </Text>
  )
}

const setDataThrottle = throttler(200, 0)

function snapCardToTable(
  position: Vec3,
  tableParams: { size: number; position: Vec3; cardSize: number; subdivisions: number },
) {
  // snap cardPosition to table grid based on size and position of table, top left of card
  // should snap to top left of table, top right of card top right of table, etc
  // card h/w ratio is 1.5/1, table is a square, card is cardSize/size fraction of table width
  // position is the position of the card in world space, not local space of table
  // table position is the center of the table
  // table size is the width of the table
  // card size is scale of the card
  // output position that snaps to grid of table
  // by default there are 10x10 grid squares on the table
  // if subdivisions is 1.5, then there are 10*1.5 grid squares on table
  const [x, y, z] = position
  const { size, cardSize } = tableParams
  const [tableX, _tableY] = tableParams.position
  const tableY = _tableY
  const tableWidth = tableParams.size
  const increment = tableWidth / ((size / cardSize) * 2)
  const offsetX = (x - tableX) / increment
  const offsetY = (y - tableY) / increment
  const gridX = Math.round(offsetX)
  const gridY = Math.round(offsetY)
  const snappedX = tableX + gridX * increment
  const snappedY = tableY + gridY * increment
  return [snappedX, snappedY, z] as Vec3
}

const noneMat = new THREE.MeshBasicMaterial({ color: 'black', transparent: true, opacity: 0 })
const cardMaterialMap = new Map<string, THREE.MeshPhysicalMaterial>()
function useCardMaterial(color: string) {
  let res: THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial = noneMat
  const textures = useTexture({
    map: 'img/cards/melty-boy0-q25.png',
    bumpMap: 'img/cards/melty-boy0-q25_bump.png',
    iridescenceThicknessMap: 'img/cards/melty-boy0-q25_clearcoat.png',
  })
  if (cardMaterialMap.has(color)) {
    res = cardMaterialMap.get(color)!
  } else {
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      bumpScale: 0.5,
      reflectivity: 0.9,
      roughness: 0.1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      iridescence: 0.5,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [280, 750],
      sheenColor: color,
      ...textures,
    })
    cardMaterialMap.set(color, material)
    res = material
  }
  return [noneMat, noneMat, noneMat, noneMat, res, noneMat]
}

/** given a square at tableParams.position of width and height tableParams.size units across
 * - if at least half the bounds of the rectangle of at `position` of width tableParams.cardSize and 1.5* tableParams.cardSize  is within bounds of square, return true
 */
function withinSquareBounds(position: Vec3, tableParams: { size: number; position: Vec3; cardSize: number }): boolean {
  const [x, y] = position
  const [tableX, tableY] = tableParams.position
  const tableWidth = tableParams.size
  const w2 = tableWidth / 2 - tableParams.cardSize / 2
  const h2 = tableWidth / 2 - (tableParams.cardSize * 1.5) / 2
  const xClamped = crop(x, tableX - w2, tableX + w2)
  const yClamped = crop(y, tableY - h2, tableY + h2)
  return xClamped === x && yClamped === y
}

// BVH raycasting example
// https://codesandbox.io/p/sandbox/drei-mesh-bvh-forked-y2z8r3
const raycaster = new THREE.Raycaster()
const originVec = new THREE.Vector3()
const dirVec = new THREE.Vector3(0, 0, -1)

function collisionDetect(position: Vec3, tableGroupRef: React.MutableRefObject<THREE.Group | null>): false | string[] {
  if (tableGroupRef.current === null) return false
  const [x, y, z] = position
  originVec.set(x, y, z + CARD_THICK * 3)
  raycaster.set(originVec, dirVec)
  const intersects = raycaster.intersectObject(tableGroupRef.current, false)
  if (intersects.filter((x) => x.object.name !== 'table').length > 0) {
    debugger
  }
  return false
}
const HAND_Z = -2.9
const HandCard = memo(_HandCard)
const clickViewCardAtom = atom<(CardInstanceIdType & { now: number }) | null>({
  key: 'clickViewCard',
  default: null,
})
const useClickViewCard = () => useRecoilState(clickViewCardAtom)
function _HandCard({
  i,
  identity,
  tableGroupRef,
}: {
  i: number
  identity: CardInstanceIdType
  tableGroupRef: React.MutableRefObject<THREE.Group | null>
}) {
  const addTableCard = useTableCardAdd()
  const tableParams = useTableParamsValue()
  const [cardActive, setCardActive] = useCardActive()
  const [clickViewCard, setClickViewCard] = useClickViewCard()
  const { viewport } = useThree()
  // const { color } = useCardColor(identity)
  // const material = useCardMaterial(color)
  const reorderHandCards = useHandCardsReorder()
  const visibleCards = useVisibleCardsCount()
  const setData = useSetRecoilState(liveDataAtom(identity))
  const [recalculate, setRecal] = useState(0)
  const [spring, setSpring] = useSpring(() => ({
    scale: [0, 0, 0] as Vec3,
    // position should be based on if the card is coming from the left or right
    position: POSITIONS[i].position || zVec,
    rotation: zVec,
    config: { mass: MASS, friction: FRICTION, tension: 2000 },
  }))
  const isClickViewCard =
    clickViewCard &&
    clickViewCard.def_id === identity.def_id &&
    clickViewCard.inst_id === identity.inst_id &&
    Date.now()
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    if (isClickViewCard) {
      const pos = [0, tableParams.position[1], HAND_Z] as Vec3
      setSpring.start({ scale: [2, 2, 2], position: pos, rotation: zVec })
      return
    }
    const width = Math.min(viewport.width, 3.75)
    const increment = Math.min(width / visibleCards, 1)
    const x = (i - (visibleCards - 1) / 2) * increment
    const pos = [x, 0.07, HAND_Z + CARD_THICK * i] as Vec3
    POSITIONS[i].position = pos
    setSpring.start({ position: pos, scale: [1, 1, 1], rotation: defaultRotation })
  }, [i, viewport.width, setSpring, recalculate, visibleCards, isClickViewCard, tableParams])

  const bind = useDrag(
    ({ event, first, last }) => {
      const SELF = CARD_STATE[i]
      // get card's current position
      event.stopPropagation()
      if (first) {
        setCardActive({ identity, type: 'hand' })
        setClickViewCard(null)
        SELECTED_CARD_STATE.active = {
          cardIndex: i,
          offset: zVector3,
          closest: CARD_STATE[i].positionsIndex,
        }
        setSpring.start({ rotation: flippingRotation })
        SELF.current.rotation = flippingRotation
      }

      if (SELECTED_CARD_STATE.active) {
        // delay the drag to allow raycastboard to update
        const update = () => {
          if (!SELECTED_CARD_STATE.active) return
          const offset = SELECTED_CARD_STATE.active.offset
          const [x, y] = offset.toArray()
          const pos = spring.position.get()
          const isZeroBug = pos[1].toFixed(2) === '0.00' && y.toFixed(2) === '0.00'
          if (isZeroBug) return
          const onTable = withinSquareBounds([x, y + 2.15, 0], tableParams)
          // sometimes the card will get stuck at 0,0,0 - ignore this
          const [_x, _y] = pos.map((x) => (x as any).toFixed(1))
          const zoom = onTable
            ? tableParams.cardSize
            : mapLinear(y + 2.15, tableParams.edges.bottom - 1.1, tableParams.edges.bottom - 1.8, 1, 2)
          let y_ = zoom > 1 ? zoom - 0.6 : y + 1.75 + zoom * 0.9
          const z = CARD_THICK * SELF.positionsIndex
          setDataThrottle() && setData(`y:${y_.toFixed(2)}\n${zoom.toFixed(2)}`)
          const scale = [zoom, zoom, zoom] as Vec3
          let position = [x, y_, onTable ? tableParams.position[2] + CARD_THICK : -2 + z] as Vec3
          if (onTable) {
            // snap cardPosition to table grid based on tableParams.size and tableParams.position
            // card ration is 1.5/1, table ratio is 1/1
            // card is 1/10th of table size, top left of card should snap to grid of 20x20 on table
            position = snapCardToTable(position, tableParams)
            // raycast to see if card is colliding with a card in the tableGroupRef
            const target = collisionDetect(pos, tableGroupRef)
            if (target) setData('COLLISION!!!!')
          }
          if (!isSame(SELF.current.position, position)) {
            setSpring.start({
              position,
            })
            SELF.current.position = position
            setSpring.start({
              scale,
              config: {
                friction: FRICTION * 2,
              },
            })
          }
          if (onTable && !isSame(SELF.current.rotation, zVec)) {
            setSpring.start({
              rotation: zVec,
              config: {
                friction: FRICTION * 4,
              },
            })
            SELF.current.rotation = zVec
          }
          if (last) {
            setCardActive(false)
            SELECTED_CARD_STATE.active = false
            if (onTable) {
              addTableCard(
                {
                  position,
                  rotation: [0, 0, 0],
                },
                identity,
              )
            } else {
              // reorder card list to reflect new card order in transactions to prevent doubles
              reorderHandCards((callback) => {
                callback.order(CARD_STATE)
              })
              setRecal((x) => x + 1)
              for (let i = 0; i < CARD_STATE.length; i++) {
                CARD_STATE[i].positionsIndex = i
              }
              setSpring.start({ rotation: flippingRotation })
              SELF.current.rotation = flippingRotation
            }
          }
        }
        if (first) {
          SELECTED_CARD_STATE.active.first = update
        } else {
          update()
          if (SELECTED_CARD_STATE.active) {
            SELECTED_CARD_STATE.active.first = undefined
          }
        }
      }
    },
    {
      filterTaps: true,
    },
  )

  // the card is rotated to face the center of the circle of cards
  useFrame(() => {
    const SELF = CARD_STATE[i]
    const target = POSITIONS[SELF.positionsIndex] || zPositions
    const { active } = SELECTED_CARD_STATE
    if (active && active.cardIndex === -1) return
    const [x, y, z] = spring.position.get()
    if (active && active.cardIndex === i) {
      const spring_x = x
      if (active.offset.y + 2.15 < tableParams.edges.bottom) {
        // if spring_x is far enough away from POSITIONS[SELF.positionsIndex] then swap the cards index with the closest card
        const increment = Math.min(viewport.width / visibleCards, 1) / 1.5
        if (abs(spring_x - (target.position[0] - increment)) > increment) {
          // for POSITIONS, find the position closest to spring_x, and swap that card's index with the current cards index
          const range = POSITIONS.map((x, i) => [x.position[0], i])
          const [, closestIndex] = range.reduce((prev, curr) =>
            abs(curr[0] - spring_x) < abs(prev[0] - spring_x) ? curr : prev,
          )
          const targetCard = CARD_STATE.find((x) => x.positionsIndex === closestIndex)
          const dist = abs(SELF.positionsIndex - (targetCard?.positionsIndex || -1))
          if (targetCard && dist === 1) {
            const temp = SELF.positionsIndex
            SELF.positionsIndex = closestIndex
            targetCard.positionsIndex = temp
          }
        }
      }
      const rotation = [0, -x / 30, 0] as Vec3
      if (!isSame(SELF.current.rotation, rotation) && active.offset.y < tableParams.edges.bottom) {
        setTimeout(() => {
          setSpring.start({ rotation, config: { friction: 300 } })
          SELF.current.rotation = rotation
        }, 100)
      }
    } else if (active !== false) {
      // if card index is < active index,
      // else if card index is > active index, move card to the right
      const onField = withinSquareBounds([x, y, z], tableParams)
      const OFFSET = onField ? 0 : 0.4
      const offset = SELF.positionsIndex > CARD_STATE[active.cardIndex].positionsIndex ? OFFSET : -OFFSET
      const xOff = target.position[0] + offset
      if (!isSame(SELF.current.position, [xOff, y, z])) {
        setSpring.start({ position: [xOff, y, z] })
        SELF.current.position = [xOff, y, z]
      }
    } else if (!isSame(SELF.current.rotation, defaultRotation) || !isSame(SELF.current.position, target.position)) {
      SELF.current.rotation = defaultRotation
      SELF.current.position = target.position
      setSpring.start({
        rotation: defaultRotation,
        position: target.position,
        scale: [1, 1, 1],
        config: {
          friction: FRICTION,
        },
      })
    }
  })
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    console.log(identity)
    setCardActive(false)
    setClickViewCard({ ...identity, now: Date.now() })
  }
  // @ts-ignore
  const bindType = bind()
  const isActive =
    cardActive && cardActive.identity.def_id === identity.def_id && cardActive.identity.inst_id === identity.inst_id
  const meshDepth = DEPTH.HAND_CARDS * (i + (isActive ? Math.pow(DEPTH.HAND_CARDS, 2) : 1))
  const textDepth = meshDepth + 1
  const textOffSurface = -CARD_THICK
  const name = `${identity.def_id}-${identity.inst_id}`
  return (
    <a.mesh {...(spring as any)} {...bindType} renderOrder={meshDepth} name={name} onClick={onClick}>
      {/* <planeGeometry args={[1, 1.5, 1, 1]} /> */}
      <boxGeometry args={[1, 1.5, CARD_THICK]} />
      <meshBasicMaterial color='black' transparent opacity={0} />
      <CardMesh cardDefId={identity.def_id} name={name} meshDepth={meshDepth} />
      {/* <LiveText index={identity} renderOrder={textDepth} position={[-0.45, -0.2, textOffSurface]} /> */}
    </a.mesh>
  )
}

function Hand({ tableGroupRef }: { tableGroupRef: React.MutableRefObject<THREE.Group | null> }) {
  const cardRange = useCardRangeValue()
  const cardsList = useHandCardsListValue()

  return (
    <>
      {cardsList.slice(cardRange[0], cardRange[1]).map((identity, i) => (
        <HandCard identity={identity} i={i} key={identity.inst_id} tableGroupRef={tableGroupRef} />
      ))}
    </>
  )
}

/** table card move is active - ignore scaling dragging */
let tableCardMoverActive = false
function TableCard({ identity, i }: { identity: CardInstanceIdType; i: number }) {
  const addHandCard = useCardMoveTableHand()
  const [cardActive, setCardActive] = useCardActive()
  const setDontMoveCamera = useSetDontMoveCamera()
  const [depthOffset, setDepthOffset] = useState(0)
  const tableParams = useTableParamsValue()
  const { size, position, cardSize } = tableParams
  const [params, setParams] = useTableCardParams(identity)
  // const { color } = useCardColor(identity)
  // const material = useCardMaterial(color)
  const handTex = useTexture(`img/handwhite.png`)
  const [unmounting, setUnmounting] = useState(false)
  const zoomSize = size * 0.4
  const [spring, setSpring] = useSpring(() => ({
    scale: [cardSize, cardSize, cardSize] as Vec3,
    position: params.position,
    rotation: params.rotation,
    config: { mass: MASS, friction: FRICTION, tension: 2000 },
  }))
  const [dragging, setDragging] = useState(false)
  const MAX_DIST = 50
  const moverBind = useDrag(({ event, first, last, xy, initial }) => {
    event.stopPropagation()
    if (first) {
      tableCardMoverActive = true
      SELECTED_CARD_STATE.active = {
        cardIndex: -1,
        offset: zVector3,
        closest: -1,
      }
    }
    let pos: Vec3 = zVec
    if (SELECTED_CARD_STATE.active) {
      const update = () => {
        if (!SELECTED_CARD_STATE.active) return
        const distClamped = Math.sqrt((xy[0] - initial[0]) ** 2 + (xy[1] - initial[1]) ** 2)
        let position = zVec
        if (distClamped < 10) {
          position = params.position
        } else {
          const { offset } = SELECTED_CARD_STATE.active
          const [x, _y] = offset.toArray()
          // offset y by distance from dragger
          const y = _y + 2.45
          position = snapCardToTable([x, y, params.position[2]], tableParams)
          // limit position to within bounds of table including card perimeter
          const [tableX, tableY] = tableParams.position
          const tableWidth = tableParams.size
          const w2 = tableWidth / 2 - cardSize / 2
          const h2 = tableWidth / 2 - (cardSize * 1.5) / 2
          const xClamped = crop(position[0], tableX - w2, tableX + w2)
          const yClamped = crop(position[1], tableY - h2, tableY + h2)
          position = [xClamped, yClamped, position[2]] as Vec3
        }
        setSpring.start({ position })
        pos = position
      }
      if (first) {
        setDontMoveCamera(true)

        SELECTED_CARD_STATE.active.first = update
      } else {
        update()
        SELECTED_CARD_STATE.active.first = undefined
      }
      if (last) {
        tableCardMoverActive = false
        setDontMoveCamera(false)
        SELECTED_CARD_STATE.active = false
        pos && setParams((x) => ({ ...x, position: pos }))
        lastDrag = Date.now()
      }
    }
  })
  const bind = useDrag(
    ({ first, last, xy, initial }) => {
      // if (xy[0] > 0 && xy[1] > 0) {
      //   debugger
      // }
      if (tableCardMoverActive) return
      if (first) {
        setDontMoveCamera(true)
        setDragging(true)
        setDepthOffset(10000)
        setCardActive({ identity, type: 'table' })
      }
      if (last) {
        setDontMoveCamera(false)
        setSpring.start({
          position: params.position,
          rotation: params.rotation,
          scale: [cardSize, cardSize, cardSize],
          onResolve: () => {
            setDragging(false)
            setDepthOffset(0)
            setCardActive({ identity, type: 'table' })
          },
        })
      } else {
        const OVER_DIST = MAX_DIST * 1.1
        const distClamped = Math.sqrt((xy[0] - initial[0]) ** 2 + (xy[1] - initial[1]) ** 2)
        //const distClamped = Math.max(Math.min(distance, 50), 0)
        // linear map x coord between params.position[0] and position[0]
        const x = mapLinear(distClamped, 0, OVER_DIST, params.position[0], position[0])
        const y = mapLinear(distClamped, 0, OVER_DIST, params.position[1], position[1] - 0.25)
        const z = mapLinear(distClamped, 0, OVER_DIST, params.position[2], position[2] + 2)
        const scale = mapLinear(distClamped, 0, OVER_DIST, cardSize, zoomSize)
        // rotate card in direction of mouse pointer in 3d space
        const [mx, my] = xy
        const rotation = [0, 0, 0] as Vec3
        rotation[0] = mapLinear(my, 0, window.innerHeight, -0.3, 0.3)
        rotation[1] = mapLinear(mx, 0, window.innerWidth, -0.3, 0.3)
        setSpring.start({
          position: [x, y, z],
          scale: [scale, scale, scale],
          rotation,
        })
      }
    },
    {
      filterTaps: true,
    },
  )
  const isActive =
    cardActive && cardActive.identity.def_id === identity.def_id && cardActive.identity.inst_id === identity.inst_id
  useEffect(() => {
    if (!isActive && !dragging) {
      setSpring.start({
        position: params.position,
        rotation: params.rotation,
        scale: [cardSize, cardSize, cardSize] as Vec3,
      })
    }
  }, [params.position, params.rotation, setSpring, isActive, cardSize, dragging])
  const visibleCards = useVisibleCardsCount()
  const setClickViewCard = useSetRecoilState(clickViewCardAtom)
  const isDark = true // luma < 0.2
  const label = JSON.stringify(identity)
  const meshDepth = DEPTH.TABLE_CARDS * (i + 1) * (!unmounting && isActive ? 1000 : 1) + depthOffset
  const name = `${identity.def_id}-${identity.inst_id}`
  const onClick = async (event: ThreeEvent<MouseEvent>) => {
    // check that this is the object with the highest renderOrder
    let max = event.intersections.reduce((max, v) => (max.object.renderOrder > v.object.renderOrder ? max : v))
    if (max.object.name !== name) return
    event.stopPropagation()
    if (!isActive && !dragging) {
      setCardActive({ identity, type: 'table' })
      setSpring.start({
        scale: [zoomSize, zoomSize, zoomSize] as Vec3,
      })
      setDragging(true)
      setClickViewCard(null)
    } else if (!dragging) {
      setCardActive(false)
    }
  }
  const pickup: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setUnmounting(true)
    const posIndex = Math.min(Math.floor(visibleCards + 1), POSITIONS.length - 1)
    const position = POSITIONS[posIndex].position as Vec3

    setSpring.start({
      position,
      scale: [1, 1, 1],
      // rotation: [0, 1, 0],

      onResolve: () => {
        setCardActive(false)
        // prevent anymore spring updates
        addHandCard(identity)
        setParams({
          position,
          rotation: [0, 0, 0],
        })
      },
    })
  }
  // @ts-ignore
  const bindType = bind()
  // @ts-ignore
  const moverBindType = moverBind()
  const showControls = isActive && !unmounting
  const textOffSurface = -CARD_THICK
  return (
    <>
      <a.mesh {...(spring as any)} {...bindType} onClick={onClick} renderOrder={meshDepth} name={name}>
        {/* <planeGeometry args={[1, 1.5, 1, 1]} /> */}
        <boxGeometry args={[1, 1.5, CARD_THICK]} />
        <meshBasicMaterial color='black' transparent opacity={0} />
        <CardMesh cardDefId={identity.def_id} meshDepth={meshDepth} name={name} />
        <group position={[0, size * 0.15, 0]}>
          {showControls && (
            <HtmlPortal>
              <div className='pointer-events-auto flex -translate-y-full gap-2 rounded bg-white/80 p-2 shadow-lg'>
                <Button variant='secondary' onClick={pickup}>
                  PICKUP
                </Button>
              </div>
            </HtmlPortal>
          )}
        </group>
        {showControls && !dragging && (
          <a.mesh
            renderOrder={meshDepth * 10}
            {...(moverBindType as any)}
            position={[0, -1, 0]}
            name={`${identity}-grabby`}
          >
            <planeGeometry args={[0.5, 0.5, 1, 1]} />
            <meshStandardMaterial
              map={handTex}
              bumpMap={handTex}
              transparent
              color='black'
              depthTest={false}
              depthWrite={false}
            />
            <a.mesh renderOrder={meshDepth * 10} {...(moverBindType as any)}>
              <circleGeometry args={[0.4]} />
              <meshBasicMaterial
                color='white'
                transparent
                opacity={0.95}
                depthTest={false}
                depthWrite={false}
                {...moverBindType}
              />
            </a.mesh>
          </a.mesh>
        )}

        {/* <LiveText index={identity} renderOrder={textDepth} position={[-0.45, -0.2, textOffSurface]} /> */}
      </a.mesh>
    </>
  )
}

function CameraControls() {
  const dontMoveCamera = useDontMoveCamera()
  const cardActive = useCardActiveValue()
  const [camControls, setCamControls] = useCamControls()
  const controlRef = useRef<THREELIB.MapControls>(null)
  const camera = useThree((three) => three.camera)
  useEffect(() => {
    // modify the PresentationControls props to pan on the XY plane instead of the XZ plane
    camera.up.set(0, 0, 1)
  }, [camera.up])
  useEffect(() => {
    function updateDrag() {
      lastDrag = Date.now()
    }
    const refCopy = controlRef.current
    if (camControls === 'reset') {
      controlRef.current?.reset()
      setCamControls('disabled')
    } else if (camControls === 'enabled') {
      controlRef.current?.addEventListener('change', updateDrag)
    }
    return () => {
      refCopy && refCopy.removeEventListener('change', updateDrag)
    }
  }, [camControls, setCamControls])
  const handCardNone = !cardActive || cardActive.type !== 'hand'
  return (
    <MapControls
      ref={controlRef}
      zoomSpeed={2}
      enabled={camControls === 'enabled' && handCardNone && !dontMoveCamera}
      enableRotate={false}
    />
  )
}

/** time of last drag event that may have ended on Table triggering erroneous Table onClick */
let lastDrag = 0
function Table() {
  const setCardActive = useCardActiveSet()
  const tableCardsList = useTableCardListValue()
  const planeTexture = useTexture('./uv_grid.jpg')
  const meshBasicMaterial = useRef<THREE.MeshBasicMaterial>(null)
  /* stretch uv map of texture vertically so image repeats twice */
  const subdivisions = 0.9
  useEffect(() => {
    if (meshBasicMaterial.current && meshBasicMaterial.current.map) {
      // repeat texture
      meshBasicMaterial.current.map.wrapS = THREE.RepeatWrapping
      meshBasicMaterial.current.map.wrapT = THREE.RepeatWrapping
      // stretch texture
      meshBasicMaterial.current.map.repeat.set(subdivisions, subdivisions)
      meshBasicMaterial.current.map.needsUpdate = true
    }
  }, [])
  const setParams = useTableParamsSet()
  // set so table reaches edges of screen if screen long enough
  // max W, H - 5.429 5.095
  const width = 5
  const height = 5
  const size = Math.min(width * 1.3, height * 0.84)
  const position = useMemo(() => [0, (height * 1.85) / 3, -3] as Vec3, [height])

  useEffect(() => {
    const edges = {
      bottom: position[1] - size / 2,
      top: position[1] + size / 2,
      left: position[0] - size / 2,
      right: position[0] + size / 2,
    }
    setParams({
      size,
      position,
      cardSize: size / 9,
      subdivisions,
      edges,
    })
  }, [size, setParams, position])

  return (
    <>
      <mesh
        name='table'
        position={position as any}
        onClick={(e) => {
          if (lastDrag + 100 > Date.now()) return
          setCardActive(false)
        }}
      >
        <planeGeometry args={[size, size, 1, 1]} />
        {/* stretch uv map of texture vertically so image repeats twice */}
        <meshBasicMaterial map={planeTexture} ref={meshBasicMaterial} />
      </mesh>
      {tableCardsList.map((card, i) => (
        <Suspense fallback={null} key={card.inst_id}>
          <TableCard identity={card} i={i} />
        </Suspense>
      ))}
    </>
  )
}

export default function PlayArea() {
  const { raycaster, viewport } = useThree()

  const planeTexture = useTexture('./uv_grid.jpg')

  // plane for raycasting intersection with cursor in 3d scene, should not have touch events
  const raycastBoard = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (SELECTED_CARD_STATE.active && raycastBoard.current) {
      // const vec = new THREE.Vector2(mouse.x, mouse.y)
      // raycaster.setFromCamera(vec, camera)
      const intersect = raycaster.intersectObject(raycastBoard.current)[0]
      if (!intersect) return
      // if intersect point is too close to the intersect.object.position, then ignore
      //if (intersect.point.distanceTo(intersect.object.position) < 0.1) return
      // convert intersect point from local space to world space
      SELECTED_CARD_STATE.active.offset = intersect.point
      SELECTED_CARD_STATE.active.first?.()
    }
  })
  const scale = 3.39
  const width = 5
  const height = 5
  const tableGroupRef = useRef<THREE.Group>(null)
  return (
    <>
      {/* <Html className='pointer-events-none w-96 font-mono'></Html> */}
      <CameraControls />
      <group position={[0, -2, 0]} rotation={[0, 0, 0]}>
        <group ref={tableGroupRef}>
          <Table />
        </group>
        <Hand tableGroupRef={tableGroupRef} />
        <mesh ref={raycastBoard} position={[0, height / 2, -3]}>
          <planeGeometry args={[width * 2, height * 2, 1, 1]} />
          {/* transparent material */}
          {/* <meshBasicMaterial map={planeTexture} color='red' opacity={0.3} transparent /> */}
          <meshBasicMaterial opacity={0} transparent />
        </mesh>
        <mesh position={[0, 4, -10]}>
          <planeGeometry args={[width * scale, height * scale, 1, 1]} />
          {/* transparent material */}
          <meshBasicMaterial map={planeTexture} color='blue' opacity={0.4} transparent />
          {/* <meshBasicMaterial map={planeTexture} color='red' /> */}
          {/* <meshBasicMaterial opacity={0} transparent /> */}
        </mesh>
      </group>
    </>
  )
}
