'use client'
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react'
import { useTexture, Text, MapControls } from '@react-three/drei'
import { crop, mapLinear, throttler } from '@/src/lib/utils'
import * as THREE from 'three'
import * as THREELIB from 'three-stdlib'
import { atomFamily, useRecoilValue, useSetRecoilState } from 'recoil'
import {
  MAX_VISIBLE_CARDS,
  useAddHandCard,
  useAddTableCard,
  useCardActive,
  useCardActiveValue,
  useCardColor,
  useCardRangeValue,
  useHandCardsListValue,
  useReorderHandCards,
  useSetCardActive,
  useSetTableParams,
  useTableCardListValue,
  useTableCardParams,
  useTableParamsValue,
  useVisibleCards,
} from '@/src/state/cards'
import { PosRot, Vec3 } from '@/src/lib/types'
import { useCamControls, useDontMoveCamera, useSetCamControls, useSetDontMoveCamera } from '@/src/state/scene'
import { Button } from '../../ui/button'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import HandIcon from '@/src/lib/icons/HandIcon'

const DEPTH = {
  TABLE_CARDS: 10,
  HAND_CARDS: 1000,
}

const MASS = 1.3
const FRICTION = 77
const CARD_THICK = 0.05
const FIELD_LINE = -1.2
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

const liveDataAtom = atomFamily<string | null, string>({
  key: 'liveData',
  default: null,
})

function LiveText({ index, renderOrder: depth }: { index: string; renderOrder: number }) {
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
      position={[-0.45, -0.2, CARD_THICK / 1.9]}
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
  const tableY = _tableY + 0.5
  const tableWidth = tableParams.size
  const subdivisions = tableParams.subdivisions
  const increment = tableWidth / ((size / cardSize) * 2)
  const offsetX = (x - tableX) / increment
  const offsetY = (y - tableY) / increment
  const gridX = Math.round(offsetX)
  const gridY = Math.round(offsetY)
  const snappedX = tableX + gridX * increment
  const snappedY = tableY + gridY * increment
  return [snappedX, snappedY, z] as Vec3
}

function Card({ i, identity }: { i: number; identity: string }) {
  const addTableCard = useAddTableCard()
  const tableParams = useTableParamsValue()
  const [cardActive, setCardActive] = useCardActive()
  const { viewport } = useThree()
  const texture = useTexture(`img/cards/melty-boy0-q25.png`)
  const reorderHandCards = useReorderHandCards()
  const visibleCards = useVisibleCards()
  const setData = useSetRecoilState(liveDataAtom(identity))
  const [recalculate, setRecal] = useState(0)
  const [spring, setSpring] = useSpring(() => ({
    scale: [0, 0, 0] as Vec3,
    // position should be based on if the card is coming from the left or right
    position: POSITIONS[i].position || zVec,
    rotation: zVec,
    config: { mass: MASS, friction: FRICTION, tension: 2000 },
  }))
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const width = Math.min(viewport.width, 3.75)
    const increment = Math.min(width / visibleCards, 1)
    const x = (i - (visibleCards - 1) / 2) * increment
    const z = -2.9
    const pos = [x, 0, z + CARD_THICK * i] as Vec3
    POSITIONS[i].position = pos
    setSpring.start({ position: pos, scale: [1, 1, 1] })
  }, [i, viewport.width, setSpring, recalculate, visibleCards])

  const bind = useDrag(({ event, first, last }) => {
    const SELF = CARD_STATE[i]
    // get card's current position
    event.stopPropagation()
    if (first) {
      setCardActive(identity)
      SELECTED_CARD_STATE.active = {
        cardIndex: i,
        offset: zVector3,
        closest: CARD_STATE[i].positionsIndex,
      }
      setSpring.start({ rotation: flippingRotation })
      SELF.current.rotation = flippingRotation
    }
    if (last && SELECTED_CARD_STATE.active) {
      setCardActive(false)
      // if card is on field, add to table
      const { offset } = SELECTED_CARD_STATE.active

      // if on field and within bounds of table
      const onTable = offset.y > FIELD_LINE && abs(offset.x - tableParams.position[0]) < tableParams.size / 2
      if (onTable) {
        const cardPosition = spring.position.get()

        const position = snapCardToTable(cardPosition, tableParams)
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
      SELECTED_CARD_STATE.active = false
    }
    if (SELECTED_CARD_STATE.active) {
      // delay the drag to allow raycastboard to update
      const update = () => {
        if (!SELECTED_CARD_STATE.active) return

        const state_y = SELECTED_CARD_STATE.active.offset.y
        const onTable = state_y > FIELD_LINE
        let x_ = SELECTED_CARD_STATE.active.offset.x * 0.9
        const pos = spring.position.get()
        // sometimes the card will get stuck at 0,0,0 - ignore this
        const isZeroBug = pos[1].toFixed(2) === '0.00' && state_y.toFixed(2) === '0.00'
        const [_x, _y] = pos.map((x) => (x as any).toFixed(1))
        setDataThrottle && setData(`${_x}\n${_y}`)
        const zoom = onTable ? tableParams.cardSize : mapLinear(state_y, -2.7, FIELD_LINE - 0.2, 1, 2)
        let y_ = state_y + 1.75 + zoom * 0.9 + (onTable ? 0.4 : 0)
        const z = CARD_THICK * SELF.positionsIndex
        const scale = [zoom, zoom, zoom] as Vec3
        let position = [x_, y_, onTable ? -2.95 : -2 + z] as Vec3
        if (onTable) {
          // snap cardPosition to table grid based on tableParams.size and tableParams.position
          // card ration is 1.5/1, table ratio is 1/1
          // card is 1/10th of table size, top left of card should snap to grid of 20x20 on table
          position = snapCardToTable(position, tableParams)
        }
        if (!isSame(SELF.current.position, position) && !isZeroBug) {
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
      }
      if (first) {
        SELECTED_CARD_STATE.active.first = update
      } else {
        update()
        SELECTED_CARD_STATE.active.first = undefined
      }
    }
  })

  // the card is rotated to face the center of the circle of cards
  useFrame(() => {
    const SELF = CARD_STATE[i]
    const target = POSITIONS[SELF.positionsIndex] || zPositions
    const { active } = SELECTED_CARD_STATE
    const [x, y, z] = spring.position.get()
    if (active && active.cardIndex === -1) return
    if (active && active.cardIndex === i) {
      const spring_x = x
      if (active.offset.y < FIELD_LINE) {
        // if spring_x is far enough away from POSITIONS[SELF.positionsIndex] then swap the cards index with the closest card
        const increment = Math.min(viewport.width / visibleCards, 1) / 1.5
        if (abs(spring_x - (target.position[0] - increment)) > increment) {
          // for POSITIONS, find the position closest to spring_x, and swap that card's index with the current cards index
          const range = POSITIONS.map((x, i) => [x.position[0], i])
          const [, closestIndex] = range.reduce((prev, curr) =>
            abs(curr[0] - spring_x) < abs(prev[0] - spring_x) ? curr : prev,
          )
          const targetCard = CARD_STATE.find((x) => x.positionsIndex === closestIndex)
          const dist = abs(SELF.positionsIndex - targetCard?.positionsIndex)
          if (dist === 1) {
            const temp = SELF.positionsIndex
            SELF.positionsIndex = closestIndex
            targetCard.positionsIndex = temp
          }
        }
      }
      const rotation = [0, -x / 30, 0] as Vec3
      if (!isSame(SELF.current.rotation, rotation) && active.offset.y < FIELD_LINE) {
        setTimeout(() => {
          setSpring.start({ rotation, config: { friction: 300 } })
          SELF.current.rotation = rotation
        }, 100)
      }
    } else if (active !== false) {
      // if card index is < active index,
      // else if card index is > active index, move card to the right
      const state_y = active.offset.y
      const onField = state_y > FIELD_LINE
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
  const { color } = useCardColor(identity)
  const isDark = true // luma < 0.2
  const label = identity
  // @ts-ignore
  const bindType = bind()
  const meshDepth = DEPTH.HAND_CARDS * (i + (cardActive === identity ? 10 : 1))
  const textDepth = meshDepth + 1
  return (
    <a.mesh {...spring} {...bindType} renderOrder={meshDepth}>
      <planeGeometry args={[1, 1.5, 1, 1]} />
      <meshStandardMaterial
        map={texture}
        bumpMap={texture}
        transparent
        color={color}
        depthTest={false}
        depthWrite={false}
      />
      <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='Rubik-Regular.ttf'
        scale={[TEXT, TEXT, TEXT]}
        color={isDark ? 'white' : 'black'}
        anchorX='left'
        anchorY='top'
        position={[-1 / 2.2, 1.5 / 2.2, CARD_THICK / 1.9]}
      >
        {label}
      </Text>
      <LiveText index={identity} renderOrder={textDepth} />
      <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='Rubik-Regular.ttf'
        scale={[TEXT, TEXT, TEXT]}
        color={isDark ? 'white' : 'black'}
        anchorX='right'
        anchorY='bottom-baseline'
        position={[-1 / -2.2, 1.5 / -2.2, CARD_THICK / 1.9]}
      >
        {label}
      </Text>
      <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='Rubik-Regular.ttf'
        scale={[TEXT / 3.2, TEXT / 3.2, TEXT / 3.2]}
        color={isDark ? 'white' : 'black'}
        outlineWidth={0.005}
        outlineColor={!isDark ? 'white' : 'black'}
        anchorX='center'
        anchorY='top-baseline'
        position={[0, -0.28, CARD_THICK / 1.9]}
      >
        Lorem Ipsum Lorem Ipsum
      </Text>
    </a.mesh>
  )
}

function Hand() {
  const cardRange = useCardRangeValue()
  const cardsList = useHandCardsListValue()
  if (cardsList.indexOf(undefined) !== -1) {
    debugger
  }
  return (
    <>
      {cardsList.slice(cardRange[0], cardRange[1]).map((identity, i) => (
        <Card identity={identity} i={i} key={identity} />
      ))}
    </>
  )
}

function TableCard({ identity, i }: { identity: string; i: number }) {
  const addHandCard = useAddHandCard()
  const [cardActive, setCardActive] = useCardActive()
  const setDontMoveCamera = useSetDontMoveCamera()

  const [depthOffset, setDepthOffset] = useState(0)
  const tableParams = useTableParamsValue()
  const { size, position, cardSize } = tableParams
  const texture = useTexture(`img/cards/melty-boy0-q25.png`)
  const handTex = useTexture(`img/handwhite.png`)
  const [params, setParams] = useTableCardParams(identity)
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
      SELECTED_CARD_STATE.active = {
        cardIndex: -1,
        offset: zVector3,
        closest: -1,
      }
    }
    let pos
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
          // offset y by
          const y = _y + 2.85
          position = snapCardToTable([x, y, params.position[2]], tableParams)
        }
        setSpring.start({ position })
        pos = position
      }
      if (first) {
        SELECTED_CARD_STATE.active.first = update
      } else {
        update()
        SELECTED_CARD_STATE.active.first = undefined
      }
      if (last) {
        SELECTED_CARD_STATE.active = false
        pos && setParams((x) => ({ ...x, position: pos }))
      }
    }
  })
  const bind = useDrag(
    ({ event, first, last, xy, initial }) => {
      // if (xy[0] > 0 && xy[1] > 0) {
      //   debugger
      // }
      if (first) {
        setDontMoveCamera(true)
        setDragging(true)
        setDepthOffset(10000)
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
        setSpring.start({
          position: [x, y, z],
          scale: [scale, scale, scale],
        })
      }
    },
    { bounds: { left: -MAX_DIST, right: MAX_DIST, top: -MAX_DIST, bottom: MAX_DIST }, rubberband: true },
  )
  useEffect(() => {
    if (cardActive !== identity && !dragging) {
      setSpring.start({
        position: params.position,
        rotation: params.rotation,
        scale: [cardSize, cardSize, cardSize] as Vec3,
      })
    } else {
      // const [x, y, z] = position
      // setSpring.start({
      //   position: [x, y, z + 1],
      //   scale: [zoomSize, zoomSize, zoomSize],
      //   rotation: [0, 0, 0],
      // })
    }
  }, [params.position, params.rotation, setSpring, cardActive, identity, cardSize, dragging])
  const visibleCards = useVisibleCards()
  const { color } = useCardColor(identity)
  const isDark = true // luma < 0.2
  const label = identity
  const meshDepth = DEPTH.TABLE_CARDS * (i + 1) * (identity === cardActive ? 1000 : 1) + depthOffset
  const onClick = async (event: ThreeEvent<MouseEvent>) => {
    // check that this is the object with the highest renderOrder
    let max = event.intersections.reduce((max, v) => (max.object.renderOrder > v.object.renderOrder ? max : v))
    if (max.object.renderOrder !== meshDepth) return
    event.stopPropagation()
    if (cardActive !== identity) {
      setCardActive(identity)
    } else {
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
      scale: [0.5, 0.5, 0.5],
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
  const textDepth = meshDepth + 1
  const showControls = cardActive === identity && !unmounting
  return (
    <>
      <a.mesh {...(spring as any)} {...bindType} onClick={onClick} renderOrder={meshDepth}>
        <group position={[0, size * 0.15, 0]}>
          {showControls && (
            <HtmlPortal>
              <div className='pointer-events-auto flex -translate-y-full gap-2 rounded bg-white/50 p-2 shadow-lg'>
                <Button variant='secondary' onClick={pickup}>
                  PICKUP
                </Button>
              </div>
            </HtmlPortal>
          )}
        </group>
        {showControls && !dragging && (
          <a.mesh renderOrder={meshDepth * 10} {...moverBindType} position={[0, -1.75, 0]} name='grabby'>
            <planeGeometry args={[0.75, 0.75, 1, 1]} />
            <meshStandardMaterial
              map={handTex}
              bumpMap={handTex}
              transparent
              color='white'
              depthTest={false}
              depthWrite={false}
            />
            <a.mesh renderOrder={meshDepth * 10}>
              <circleGeometry args={[0.65]} />
              <meshBasicMaterial color='black' transparent opacity={0.75} depthTest={false} depthWrite={false} />
            </a.mesh>
          </a.mesh>
        )}
        <planeGeometry args={[1, 1.5, 1, 1]} />
        <Text
          renderOrder={textDepth}
          material-depthTest={false}
          material-depthWrite={false}
          font='Rubik-Regular.ttf'
          scale={[TEXT, TEXT, TEXT]}
          color={isDark ? 'white' : 'black'}
          anchorX='left'
          anchorY='top'
          position={[-1 / 2.2, 1.5 / 2.2, CARD_THICK / 1.9]}
        >
          {label}
        </Text>
        <LiveText index={identity} renderOrder={textDepth} />
        <Text
          renderOrder={textDepth}
          material-depthTest={false}
          material-depthWrite={false}
          font='Rubik-Regular.ttf'
          scale={[TEXT, TEXT, TEXT]}
          color={isDark ? 'white' : 'black'}
          anchorX='right'
          anchorY='bottom-baseline'
          position={[-1 / -2.2, 1.5 / -2.2, CARD_THICK / 1.9]}
        >
          {label}
        </Text>
        <Text
          renderOrder={textDepth}
          material-depthTest={false}
          material-depthWrite={false}
          font='Rubik-Regular.ttf'
          scale={[TEXT / 3.2, TEXT / 3.2, TEXT / 3.2]}
          color={isDark ? 'white' : 'black'}
          outlineWidth={0.005}
          outlineColor={!isDark ? 'white' : 'black'}
          anchorX='center'
          anchorY='top-baseline'
          position={[0, -0.28, CARD_THICK / 1.9]}
        >
          Lorem Ipsum Lorem Ipsum
        </Text>
        <Text
          renderOrder={textDepth}
          material-depthTest={false}
          material-depthWrite={false}
          font='Rubik-Regular.ttf'
          scale={[TEXT, TEXT, TEXT]}
          color={isDark ? 'white' : 'black'}
          outlineWidth={0.005}
          outlineColor={!isDark ? 'white' : 'black'}
          anchorX='center'
          anchorY='top-baseline'
          position={[0, -0.5, CARD_THICK / 1.9]}
        >
          {meshDepth}
        </Text>
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          transparent
          color={color}
          depthTest={false}
          depthWrite={false}
        />
      </a.mesh>
    </>
  )
}

function CameraControls() {
  const dontMoveCamera = useDontMoveCamera()
  const cardActive = useCardActiveValue()
  const [camControls, setCamControls] = useCamControls()
  const controlRef = useRef<THREELIB.MapControls>()
  const camera = useThree((three) => three.camera)
  useEffect(() => {
    // modify the PresentationControls props to pan on the XY plane instead of the XZ plane
    camera.up.set(0, 0, 1)
  }, [camera.up])
  useEffect(() => {
    if (camControls === 'reset') {
      controlRef.current?.reset()
      setCamControls('disabled')
    }
  }, [camControls, setCamControls])
  return (
    <MapControls
      ref={controlRef}
      zoomSpeed={2}
      enabled={camControls === 'enabled' && !cardActive && !dontMoveCamera}
      enableRotate={false}
    />
  )
}

function Table() {
  const setCardActive = useSetCardActive()
  const tableCardsList = useTableCardListValue()
  const { viewport } = useThree()
  const planeTexture = useTexture('./uv_grid.jpg')
  const meshBasicMaterial = useRef<THREE.MeshBasicMaterial>(null)
  /* stretch uv map of texture vertically so image repeats twice */
  const subdivisions = 1.8
  useEffect(() => {
    if (meshBasicMaterial.current) {
      // repeat texture
      meshBasicMaterial.current.map.wrapS = THREE.RepeatWrapping
      meshBasicMaterial.current.map.wrapT = THREE.RepeatWrapping
      // stretch texture
      meshBasicMaterial.current.map.repeat.set(subdivisions, subdivisions)
      meshBasicMaterial.current.map.needsUpdate = true
    }
  }, [])
  const setParams = useSetTableParams()
  // set so table reaches edges of screen if screen long enough
  // max W, H - 5.429 5.095
  const width = crop(viewport.width, 2, 5.429)
  const height = crop(viewport.height, 2, 5.095)
  const size = Math.min(width * 1.3, height * 0.84)
  const position = useMemo(() => [0, (height * 1.85) / 3, -3] as Vec3, [height])
  useEffect(() => {
    setParams({
      size,
      position,
      cardSize: size / 9,
      subdivisions,
    })
  }, [size, setParams, position])

  return (
    <>
      <mesh
        position={position as any}
        // onClick={(e) => {
        //   e.stopPropagation()
        //   setCardActive(false)
        // }}
      >
        <planeGeometry args={[size, size, 1, 1]} />
        {/* stretch uv map of texture vertically so image repeats twice */}
        <meshBasicMaterial map={planeTexture} ref={meshBasicMaterial} />
      </mesh>
      {tableCardsList.map((card, i) => (
        <TableCard identity={card} key={card} i={i} />
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
  const width = Math.min(viewport.width, 5.429)
  const height = Math.min(viewport.height, 5.095)
  return (
    <>
      {/* <Html className='pointer-events-none w-96 font-mono'></Html> */}
      <CameraControls />
      <group position={[0, -2, 0]} rotation={[0, 0, 0]}>
        <Table />
        <Hand />
        <mesh ref={raycastBoard} position={[0, height / 3, -3]}>
          <planeGeometry args={[width * 2, height * 2, 1, 1]} />
          {/* transparent material */}
          {/* <meshBasicMaterial map={planeTexture} color='red' opacity={0.5} transparent /> */}
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
