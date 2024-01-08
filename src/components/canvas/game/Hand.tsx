import { Vector3, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import { mapLinear } from '@/utils'
import * as THREE from 'three'

const MASS = 1.3
const FRICTION = 66
const CARDS = 7

const { abs } = Math
type PosRot = { position: Vec3; rotation: Vec3 }
type Vec3 = [x: number, y: number, z: number, order?: THREE.EulerOrder]
const zVec: Vec3 = [0, 0, 0] as const
const zPositions: PosRot = { position: zVec, rotation: zVec }
const zVector3 = new THREE.Vector3(0, 0, 0)
type FastSharedState = {
  active:
    | { x: number; i: number; offset: THREE.Vector3; first?: () => void; POSITIONS: number[]; closest: number }
    | false
}
const SHARED_STATE: FastSharedState = { active: false }
type FastSelfState = [{ index: number; current: PosRot }][]
const SELF_STATE: FastSelfState = Array.from({ length: CARDS }).map((_, i) => [
  {
    current: { position: zVec, rotation: zVec },
    index: i,
  },
])

const POSITIONS: PosRot[] = Array.from({ length: CARDS }).map((_, i) => ({
  position: zVec,
  rotation: zVec,
}))

const defaultRotation = [0, 0.2, 0] as Vec3
const flippingRotation = [0, 0.75, 0] as Vec3

function isSame(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

// comic book sticker colors
const COLORS = [
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
].sort(() => Math.random() - 0.5)

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
  const [spring, setSpring] = useSpring(
    () => ({
      scale: [1, 1, 1] as Vec3,
      position: zVec,
      rotation: zVec,
      config: { mass: MASS, friction: FRICTION, tension: 2000 },
    }),
    [zVec],
  )
  const bind = useDrag(({ offset, movement, event, first, last, delta }) => {
    const SELF = SELF_STATE[i][0]

    event.stopPropagation()
    if (first) {
      setActive(true)
      SHARED_STATE.active = {
        x: movement[0],
        i,
        offset: zVector3,
        POSITIONS: SELF_STATE.map(([{ index }]) => index),
        closest: SELF_STATE[i][0].index,
      }
      setSpring.start({ rotation: flippingRotation })
      SELF.current.rotation = flippingRotation
    }
    if (last) {
      setActive(false)
      SHARED_STATE.active = false
    }
    if (SHARED_STATE.active) {
      // delay the drag to allow raycastboard to update
      const update = () => {
        const [x, y] = movement
        const zoomDrag = -75
        if (!SHARED_STATE.active) return

        // if drag is close enough to the top of the screen, bump the card up so at most above the hand
        //
        const state_y = SHARED_STATE.active.offset.y
        const onField = state_y > -1.2
        let x_ = SHARED_STATE.active.offset.x * 0.9
        //setData([state_y])
        const zoom = onField ? 1 : mapLinear(y, 0, zoomDrag, 1, 2.5)
        let y_ = state_y + 1.75 + zoom * 0.9
        if (onField) {
          // y_ = y_ * mapLinear(state_y, -1.2, 0, 1, 1.5)
        }
        // console.log(zoom)
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
        // distance drag has travelled on x axis
        // setData(x_init + ' ' + size.left)
        if (abs(x) > 0.1) {
          // find direction of drag, left or right
          // find closest position in POSITIONS
          const x__ = x_
          let closest = 0
          for (let i = 0; i < POSITIONS.length; i++) {
            if (abs(POSITIONS[i].position[0] - x__) < abs(POSITIONS[closest].position[0] - x__)) {
              closest = i
            }
          }
          if (closest != SHARED_STATE.active.closest) {
            SHARED_STATE.active.closest = closest
            // shuffle all cards left or right as card being drags moves to closest position in POSITION
            const dir = delta[0] > 0 ? 1 : -1
            // set new positions of all cards in active.POSITIONS
            for (let i = 0; i < SELF_STATE.length; i++) {
              SHARED_STATE.active.POSITIONS[i] = (SHARED_STATE.active.POSITIONS[i] + dir + CARDS) % CARDS
            }
          }
        }
      }
      if (first) {
        SHARED_STATE.active.first = update
      } else {
        update()
        SHARED_STATE.active.first = undefined
      }
    } else {
      setSpring.start({
        rotation: flippingRotation,
      })
      SELF.current.rotation = flippingRotation
    }
  })

  // the card is rotated to face the center of the circle of cards
  useFrame(() => {
    const SELF = SELF_STATE[i][0]

    const { index } = SELF
    const target = POSITIONS[index] || zPositions
    const { active } = SHARED_STATE
    const [x, y, z] = spring.position.get()
    if (active && active.i === i) {
      const rotation = [0, -x / 5, 0] as Vec3
      if (!isSame(SELF.current.rotation, rotation)) {
        setTimeout(() => {
          setSpring.start({ rotation })
          SELF.current.rotation = rotation
        }, 100)
      }
    } else if (active !== false) {
      // if card index is < active index,
      // else if card index is > active index, move card to the right
      const OFFSET = 0.2
      const offset = index > SELF_STATE[active.i][0].index ? OFFSET : -OFFSET
      const xOff = POSITIONS[active.POSITIONS[i]].position[0] + offset
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

  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <>
      <a.mesh {...spring} {...bindType} castShadow>
        {data && (
          <Html>
            <div className='pointer-events-none w-20 select-none break-before-all overflow-hidden'>
              {JSON.stringify(data, null, 2)}
            </div>
          </Html>
        )}
        <boxGeometry args={[1, 1.5, 0.01]} />
        <meshPhysicalMaterial
          color={COLORS[i]}
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
    if (SHARED_STATE.active && raycastBoard.current) {
      // const vec = new THREE.Vector2(mouse.x, mouse.y)
      // raycaster.setFromCamera(vec, camera)
      const intersect = raycaster.intersectObject(raycastBoard.current)[0]
      if (!intersect) return
      // convert intersect point from local space to world space
      SHARED_STATE.active.offset = intersect.point
      SHARED_STATE.active.first?.()
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
