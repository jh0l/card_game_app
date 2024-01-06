import { Vector3, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { mapLinear } from '@/utils'

const MASS = 1.3
const CARDS = 7

type FastSharedState = { active: number | false }
const FAST_SHARED_STATE: FastSharedState = { active: false }
type FastSelfState = [{ index: number }][]
const FAST_SELF_STATE: FastSelfState = Array.from({ length: CARDS }).map((_, i) => [
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
  const [coords, setCoords] = useState<any>([0, 0])
  const aspect = size.width / viewport.width
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const increment = Math.min(viewport.width / CARDS, 1)
    const x = (i - (CARDS - 1) / 2) * increment
    const z = -2.9
    const pos = [x, 0, z] as Vec3

    POSITIONS[i].target.position = pos
  }, [i, viewport])
  const FAST = FAST_SELF_STATE[i]
  const [spring, setSpring] = useSpring(
    () => ({
      position: zVec,
      rotation: zVec,
      config: { mass: MASS, friction: 66, tension: 2000 },
    }),
    [zVec],
  )
  const bind = useDrag(({ movement: [x, y], down, event, initial: [x_init, y_init] }) => {
    const pos = POSITIONS[FAST[0].index] || zPositions
    event.stopPropagation()

    FAST_SHARED_STATE.active = down && i

    if (down) {
      let x_ = ((x_init + x) / size.width - 0.5) * 2.5

      // if drag is close enough to the top of the screen, bump the card up so at most above the hand
      //
      const toBump = -25
      const isBump = y_init + y < size.height * 0.68
      x_ =
        isBump || y > toBump
          ? x_ * 2 * (size.width / size.height)
          : Math.min(Math.max(x_, -viewport.width / 4), viewport.width / 4)
      const bump = isBump
        ? 1.7 * (1 - -y / (size.height * 0.4))
        : y > toBump
          ? mapLinear(y, 0, toBump, 0.6, 1.7 * (1 - y_init / (size.height * 1.1)) * 2.5 + 0.2)
          : 1.7 * (1 - y_init / (size.height * 1.1)) * 2.5 + 0.2
      const y_ = -y / aspect + bump
      // setCoords([y_init, y, bump, y_])
      // increase zoom from 0.5 to 2 as y decreases from 0 to -10 then clamp to 1.7x
      const zoom = mapLinear(y, 0, toBump, -2, 2)
      const dragPos = [x_, y_, isBump ? -2.5 : zoom] as Vec3
      if (!isSame(pos.current.position, dragPos)) {
        setSpring.start({
          position: dragPos,
        })
        pos.current.position = dragPos
      }
      // update FAST_STATE
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
    <>
      <a.mesh {...spring} {...bindType} castShadow>
        {/* <Html>
          <div className='w-20 -translate-x-1/2 select-none break-before-all overflow-hidden'>
            {JSON.stringify(coords, null, 2)}
            <br />
            {aspect}
          </div>
        </Html> */}
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
    </>
    // </group>
  )
}

export default function Hand({ setActive }: { setActive: (active: boolean) => void }) {
  const [transforms] = useState(
    Array.from({ length: CARDS }, () => ({
      key: Math.random(),
    })),
  )
  return (
    <>
      {/* <Html className='pointer-events-none w-96 font-mono'></Html> */}
      <group position={[0, -1.6, 0]} rotation={[-0.1, 0, 0]}>
        {transforms.map(({ key }, i) => (
          <Card i={i} key={key} setActive={setActive} />
        ))}
      </group>
    </>
  )
}
