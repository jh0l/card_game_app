import { Vector3, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useState } from 'react'

const MASS = 1.3
const CARDS = 7

type FastSharedState = { active: number | false }
const FAST_SHARED_STATE: FastSharedState = { active: false }
type FastSelfState = [{ index: number }][]
const FAST_STATE: FastSelfState = Array.from({ length: CARDS }).map((_, i) => [
  {
    index: i,
  },
])
type Vec3 = [number, number, number]
type PosRot = { position: Vec3; rotation: Vec3 }
// current is the current position of the card, target is the position the card should be in when not being dragged
// current is set to the dragged position when the card is active in FAST_STATE
// current is set to target when the card is not active in FAST_STATE
type Positions = { current: PosRot; target: PosRot }
const zVec: Vec3 = [0, 0, 0] as const
const zPositions: Positions = {
  current: { position: zVec, rotation: zVec },
  target: { position: zVec, rotation: zVec },
}

const POSITIONS: Positions[] = Array.from({ length: CARDS }).map((_, i) => ({
  current: { position: zVec, rotation: zVec },
  target: { position: zVec, rotation: zVec },
}))

function isSame(a: Vec3, b: Vec3) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

// bright pastel colors
const COLORS = ['#ff6b6b', '#ffb26b', '#fbff6b', '#6bff8c', '#6bffff', '#6bb2ff', '#b26bff', '#ff6bff', '#ff6bb2'].sort(
  () => Math.random() - 0.5,
)

function Card({ i }: { i: number; setActive: (active: boolean) => void }) {
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const increment = viewport.width / CARDS
    const x = increment * i - viewport.width / 2 + increment / 2.3
    const z = -2.9
    const pos = [x, 0, z] as Vec3

    POSITIONS[i].target.position = pos
  }, [i, viewport])
  const FAST = FAST_STATE[i]
  const [spring, setSpring] = useSpring(
    () => ({
      position: zVec,
      rotation: zVec,
      config: { mass: MASS, friction: 66, tension: 2000 },
    }),
    [zVec],
  )
  const bind = useDrag(({ movement: [x, y], down, event }) => {
    const pos = POSITIONS[FAST[0].index] || zPositions

    event.stopPropagation()

    FAST_SHARED_STATE.active = down && i

    if (down) {
      const y_ = Math.min((-y * 1.5) / aspect + 0.8, viewport.height / 1.7)
      const dragPos = [x / aspect + pos.target.position[0] * 0.4 + i * 0.015, y_, 0.9] as Vec3
      if (!isSame(pos.current.position, dragPos)) {
        setSpring.start({
          position: dragPos,
        })
        pos.current.position = dragPos
      }
    }
  })

  // the card is rotated to face the center of the circle of cards
  useFrame(() => {
    const transform = POSITIONS[FAST[0].index] || zPositions
    const [x, y, z] = spring.position.get()
    const defaultRotation = [0, 0.2, 0] as Vec3
    if (FAST_SHARED_STATE.active === i) {
      const rotation = [0, -x / 5, 0] as Vec3
      if (!isSame(transform.current.rotation, rotation)) {
        setSpring.start({ rotation })
        transform.current.rotation = rotation
      }
    } else if (
      !isSame(transform.target.rotation, defaultRotation) ||
      !isSame(transform.target.position, transform.current.position)
    ) {
      transform.current.rotation = defaultRotation
      transform.current.position = transform.target.position
      setSpring.start({
        rotation: defaultRotation,
        position: transform.current.position,
      })
    }
  })

  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <a.mesh {...spring} {...bindType} castShadow>
      <boxGeometry args={[1, 1.5, 0.01]} />
      <meshPhysicalMaterial
        color={COLORS[i]}
        iridescence={1}
        iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1400]}
        roughness={0.2}
        clearcoat={0.5}
        metalness={0.75}
      />
    </a.mesh>
    // </group>
  )
}

export default function Hand({ setActive }: { setActive: (active: boolean) => void }) {
  const [transforms, setTransforms] = useState(
    Array.from({ length: CARDS }, () => ({
      key: Math.random(),
    })),
  )
  return (
    <group position={[0, -1.6, 0]} rotation={[-0.1, 0, 0]}>
      {transforms.map(({ key }, i) => (
        <Card i={i} key={key} setActive={setActive} />
      ))}
    </group>
  )
}
