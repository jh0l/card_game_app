import { useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useMemo, useState } from 'react'

const MASS = 1.3
const CARDS = 7

const FAST_STATE: [{ active: boolean; index: number }][] = Array.from({ length: CARDS }).map((_, i) => [
  {
    active: false,
    index: i,
  },
])

const POSITIONS = []

// bright pastel colors
const COLORS = [
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
  '#ff6b6b',
  '#ffb26b',
  '#fbff6b',
  '#6bff8c',
  '#6bffff',
  '#6bb2ff',
  '#b26bff',
  '#ff6bff',
  '#ff6bb2',
].sort(() => Math.random() - 0.5)

function Card({ i }: { i: number; setActive: (active: boolean) => void }) {
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const increment = viewport.width / CARDS
    const x = increment * i - viewport.width / 2 + increment / 2.3 - 0.19
    const z = -2.9
    const pos = [x, Math.abs(x) * 0.03 + i * 0.01, z + i * 0.3]

    POSITIONS[i] = pos
  }, [i, viewport])
  const FAST = FAST_STATE[i]
  const [spring, setSpring] = useSpring(() => ({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    config: { mass: MASS, friction: 66, tension: 2000 },
  }))
  const bind = useDrag(({ movement: [x, y], down, event }) => {
    const transform = POSITIONS[FAST[0].index] || [0, 0, 0]

    event.stopPropagation()
    setSpring({
      position: down ? [x / aspect + transform[0] * 0.4 + i * 0.015, (-y * 1.5) / aspect + 0.8, 0.9] : transform,
    })
    FAST[0].active = down
    // increment with modulo each card in FAST_STATE
    if (!down) {
      FAST_STATE.forEach((_, i) => {
        FAST_STATE[i][0].index = (FAST_STATE[i][0].index + 1) % CARDS
      })
    }
  })

  // the card is rotated to face the center of the circle of cards
  useFrame(() => {
    const transform = POSITIONS[FAST[0].index] || [0, 0, 0]

    const [x, y, z] = spring.position.get()
    setSpring(
      FAST[0].active
        ? { rotation: [0, -x / 10, 0] }
        : {
            rotation: [0, -x / 10, 0],
            position: transform,
          },
    )
  })

  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <a.mesh {...spring} {...bindType} castShadow>
      <boxGeometry args={[1, 1.5, 0.05]} />
      <meshPhysicalMaterial
        color={COLORS[i]}
        iridescence={1}
        iridescenceIOR={1}
        // iridescenceThicknessRange={[0, 1400]}
        roughness={1}
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
