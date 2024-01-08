import { Vector3, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import { mapLinear } from '@/utils'
import * as THREE from 'three'

const MASS = 1.3
const CARDS = 7

const { abs } = Math
type PosRot = { position: Vec3; rotation: Vec3 }
type Vec3 = [number, number, number]
const zVec: Vec3 = [0, 0, 0] as const
const zPositions: PosRot = { position: zVec, rotation: zVec }
const zVector3 = new THREE.Vector3(0, 0, 0)
type FastSharedState = { active: { x: number; i: number; offset: THREE.Vector3; first?: () => void } | false }
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

function isSame(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

// bright pastel colors
const COLORS = ['#ff6b6b', '#ffb26b', '#fbff6b', '#6bff8c', '#6bffff', '#6bb2ff', '#b26bff', '#ff6bff', '#ff6bb2'].sort(
  () => Math.random() - 0.5,
)

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
      scale: [1, 1, 1],
      position: zVec,
      rotation: zVec,
      config: { mass: MASS, friction: 66, tension: 2000 },
    }),
    [zVec],
  )
  const bind = useDrag(({ movement: [x, y], event, first, last }) => {
    const SELF = SELF_STATE[i][0]

    event.stopPropagation()
    if (first) {
      setActive(true)
      SHARED_STATE.active = { x, i, offset: zVector3 }
    }
    if (last) {
      setActive(false)
      SHARED_STATE.active = false
    }
    const flippingRotation = [0, 0.75, 0] as Vec3
    if (SHARED_STATE.active) {
      // if card has not moved, rotate the card 45 degrees
      if (x < 1 && x > -1 && y < 1 && y > -1) {
        if (!isSame(SELF.current.rotation, flippingRotation)) {
          setSpring.start({ rotation: flippingRotation })
          SELF.current.rotation = flippingRotation
        }
      }
      // delay the drag to allow raycastboard to update
      const update = () => {
        if (!SHARED_STATE.active) return
        const x_ = SHARED_STATE.active.offset.x //((x_init + x) / size.width - 0.5) * 2.3

        // if drag is close enough to the top of the screen, bump the card up so at most above the hand
        //

        const y_ = SHARED_STATE.active.offset.y + 3
        // setData([y, y_])
        const dragPos = [x_, y_, -2] as Vec3
        // if (!isSame(SELF.current.position, dragPos)) {
        setSpring.start({
          position: dragPos,
        })
        SELF.current.position = dragPos
        // }
        // distance drag has travelled on x axis
        // setData(x_init + ' ' + size.left)
        if (abs(x) > 10) {
          // find direction of drag, left or right
          // find closest position in POSITIONS
          const x__ = x_ + 0.5
          let closest = 0
          for (let i = 0; i < POSITIONS.length; i++) {
            if (abs(POSITIONS[i].position[0] - x__) < abs(POSITIONS[closest].position[0] - x__)) {
              closest = i
            }
          }
          // set indices of all SELF_STATE.index offset by the number of cards between SELF.current.position and POSITIONS index
          // will need to wrap around indices to the other side of the array
          const offset = closest - SELF.index

          // set new positions of all cards
        }
      }
      if (first) {
        SHARED_STATE.active.first = update
      } else {
        update()
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
        <meshStandardMaterial color={COLORS[i]} />
      </a.mesh>
    </>
    // </group>
  )
}

export default function Hand({ setActive }: { setActive: (active: boolean) => void }) {
  const { raycaster, viewport } = useThree()

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
        <mesh ref={raycastBoard} position={[0, viewport.height / 3, -2.9]}>
          <planeGeometry args={[viewport.width * 2, viewport.height * 2, 1, 1]} />
          {/* transparent material */}
          <meshBasicMaterial map={planeTexture} opacity={0.03} transparent />
        </mesh>
      </group>
    </>
  )
}
