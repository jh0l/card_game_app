import { useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useRef, useState } from 'react'
import { useTexture, Text } from '@react-three/drei'
import { mapLinear } from '@/utils'
import * as THREE from 'three'

const MASS = 1.3
const FRICTION = 77
const CARDS = 7
const FIELD_LINE = -1.2
const TEXT = 0.2

const { abs } = Math
type PosRot = { position: Vec3; rotation: Vec3 }
type Vec2 = [x: number, y: number]
type Vec3 = [x: number, y: number, z: number, order?: THREE.EulerOrder]
const zVec: Vec3 = [0, 0, 0] as const
const zPositions: PosRot = { position: zVec, rotation: zVec }
const zVector3 = new THREE.Vector3(0, 0, 0)
type FastSharedState = {
  active: { vector: Vec2; cardIndex: number; offset: THREE.Vector3; first?: () => void; closest: number } | false
}
const SELECTED_CARD_STATE: FastSharedState = { active: false }
type FastSelfState = { positionsIndex: number; current: PosRot }[]
const CARD_STATE: FastSelfState = Array.from({ length: CARDS }).map((_, i) => ({
  current: { position: zVec, rotation: zVec },
  positionsIndex: i,
}))

const POSITIONS: PosRot[] = Array.from({ length: CARDS }).map((_, i) => ({
  position: zVec,
  rotation: zVec,
}))

const defaultRotation = [0, 0.2, 0] as Vec3
const flippingRotation = [0, 1, 0] as Vec3

function isSame(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

// comic book sticker colors
const COLORS: { color: string; luma: number }[] = [
  '#4c69f6',
  '#4c94f6',
  '#f6db35',
  '#ffc510',
  '#ee5454',
  '#f76433',
  '#ffb252',
  '#94d46f',
  '#63cdb0',
  '#1d120d',
]
  .sort(() => Math.random() - 0.5)
  .map((color) => ({ color, luma: luma(color) }))

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

function Card({ i, setActive }: { i: number; setActive: (active: boolean) => void }) {
  const { viewport } = useThree()
  const [data, setData] = useState<any>(false)
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const increment = Math.min(viewport.width / CARDS, 1)
    const x = (i - (CARDS - 1) / 2) * increment
    const z = -2.9
    const pos = [x, 0, z] as Vec3

    POSITIONS[i].position = pos
  }, [i, viewport.width])
  const [spring, setSpring] = useSpring(() => ({
    scale: [1, 1, 1] as Vec3,
    position: zVec,
    rotation: zVec,
    config: { mass: MASS, friction: FRICTION, tension: 2000 },
  }))
  const bind = useDrag(({ movement, event, first, last }) => {
    const SELF = CARD_STATE[i]
    // get card's current position
    event.stopPropagation()
    if (first) {
      setActive(true)
      SELECTED_CARD_STATE.active = {
        vector: movement,
        cardIndex: i,
        offset: zVector3,
        closest: CARD_STATE[i].positionsIndex,
      }
      setSpring.start({ rotation: flippingRotation })
      SELF.current.rotation = flippingRotation
    }
    if (last && SELECTED_CARD_STATE.active) {
      setActive(false)
      SELECTED_CARD_STATE.active = false
      setSpring.start({ rotation: flippingRotation })
      SELF.current.rotation = flippingRotation
    }
    if (SELECTED_CARD_STATE.active) {
      // delay the drag to allow raycastboard to update
      const update = () => {
        if (!SELECTED_CARD_STATE.active) return

        const state_y = SELECTED_CARD_STATE.active.offset.y
        const onField = state_y > FIELD_LINE
        let x_ = SELECTED_CARD_STATE.active.offset.x * 0.9
        setData(spring.position.get()[1].toFixed(2))
        const zoom = onField ? 1 : mapLinear(state_y, -1.7, FIELD_LINE - 0.2, 1, 2)
        let y_ = state_y + 1.75 + zoom * 0.9

        const scale = [zoom, zoom, zoom] as Vec3
        const position = [x_, y_, onField ? -2.6 : -2] as Vec3
        if (!isSame(SELF.current.position, position)) {
          setSpring.start({
            position,
            scale,
            config: {
              friction: onField ? FRICTION : 456,
            },
          })
          SELF.current.position = position
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
    if (active && active.cardIndex === i) {
      const spring_position = spring.position.get()
      if (active.offset.y < FIELD_LINE) {
        const spring_x = spring_position[0]
        // if spring_x is far enough away from POSITIONS[SELF.positionsIndex] then swap the cards index with the closest card
        const increment = Math.min(viewport.width / CARDS, 1) / 2
        if (abs(spring_x - (target.position[0] - increment)) > increment) {
          // for POSITIONS, find the position closest to spring_x, and swap that card's index with the current cards index
          const range = POSITIONS.map((x, i) => [x.position[0], i])
          const [, closestIndex] = range.reduce((prev, curr) =>
            abs(curr[0] - spring_x) < abs(prev[0] - spring_x) ? curr : prev,
          )
          const targetCard = CARD_STATE.find((x) => x.positionsIndex === closestIndex)
          const dist = abs(SELF.positionsIndex - targetCard?.positionsIndex)
          console.log(dist)
          if (dist === 1) {
            const temp = SELF.positionsIndex
            SELF.positionsIndex = closestIndex
            targetCard.positionsIndex = temp
          }
        }
      }
      const rotation = [0, -x / 30, 0] as Vec3
      if (!isSame(SELF.current.rotation, rotation)) {
        setTimeout(() => {
          setSpring.start({ rotation, config: { friction: 300 } })
          SELF.current.rotation = rotation
        }, 100)
      }
    } else if (active !== false) {
      // if card index is < active index,
      // else if card index is > active index, move card to the right
      const OFFSET = 0.5
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
  const { color, luma } = COLORS[i]
  const isDark = luma < 0.2
  const label = i + 1
  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <>
      <a.mesh {...spring} {...bindType} castShadow>
        {/*  for index */}
        <Text
          scale={[TEXT, TEXT, TEXT]}
          color={isDark ? 'white' : 'black'}
          outlineWidth={0.005}
          outlineColor={isDark ? 'white' : 'black'}
          anchorX='left'
          anchorY='top'
          position={[-1 / 2.1, 1.5 / 2.1, 0.01]}
        >
          {label}
        </Text>
        <Text
          scale={[TEXT / 2, TEXT / 2, TEXT / 2]}
          color={isDark ? 'white' : 'black'}
          anchorX='center'
          anchorY='bottom-baseline'
          position={[0, 0.2, 0.01]}
        >
          {data}
        </Text>
        <Text
          scale={[TEXT, TEXT, TEXT]}
          color={isDark ? 'white' : 'black'}
          outlineWidth={0.005}
          outlineColor={!isDark ? 'white' : 'black'}
          anchorX='right'
          anchorY='bottom-baseline'
          position={[-1 / -2.1, 1.5 / -2.1, 0.01]}
        >
          {label}
        </Text>
        <Text
          scale={[TEXT / 2, TEXT / 2, TEXT / 2]}
          color={isDark ? 'white' : 'black'}
          outlineWidth={0.005}
          outlineColor={!isDark ? 'white' : 'black'}
          anchorX='center'
          anchorY='top-baseline'
          position={[0, 0, 0.01]}
        >
          {Array(label).fill('Lorem Ipsum').join('\n')}
        </Text>
        <boxGeometry args={[1, 1.5, 0.01]} />
        <meshPhysicalMaterial
          color={color}
          // shiny
        />
      </a.mesh>
    </>
    // </group>
  )
}

export default function Hand({ setActive }: { setActive: (active: boolean) => void }) {
  const { raycaster, viewport, camera } = useThree()

  const planeTexture = useTexture('./uv_grid.jpg')
  const [transforms] = useState(
    Array.from({ length: CARDS }, () => ({
      key: Math.random(),
    })),
  )
  // plane for raycasting intersection with cursor in 3d scene, should not have touch events
  const raycastBoard = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (SELECTED_CARD_STATE.active && raycastBoard.current) {
      // const vec = new THREE.Vector2(mouse.x, mouse.y)
      // raycaster.setFromCamera(vec, camera)
      const intersect = raycaster.intersectObject(raycastBoard.current)[0]
      if (!intersect) return
      // convert intersect point from local space to world space
      SELECTED_CARD_STATE.active.offset = intersect.point
      SELECTED_CARD_STATE.active.first?.()
    }
  })
  return (
    <>
      {/* <Html className='pointer-events-none w-96 font-mono'></Html> */}
      <group position={[0, -1.6, 0]} rotation={[-0.1, 0, 0]}>
        {transforms.map(({ key }, i) => (
          <Card i={i} key={key} setActive={setActive} />
        ))}
        <mesh ref={raycastBoard} position={[0, viewport.height / 3, -3]}>
          <planeGeometry args={[viewport.width * 2, viewport.height * 2, 1, 1]} />
          {/* transparent material */}
          <meshBasicMaterial map={planeTexture} color='blue' opacity={0.5} transparent />
        </mesh>
      </group>
    </>
  )
}
