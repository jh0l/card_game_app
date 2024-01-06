import { Vector3, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { mapLinear } from '@/utils'

const MASS = 1.3
const CARDS = 7

const { abs } = Math
type PosRot = { position: Vec3; rotation: Vec3 }
type Vec3 = [number, number, number]
const zVec: Vec3 = [0, 0, 0] as const
const zPositions: PosRot = { position: zVec, rotation: zVec }

type FastSharedState = { active: number | false }
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

function Card({ i }: { i: number; setActive: (active: boolean) => void }) {
  const { size, viewport } = useThree()
  const [data, setData] = useState<any>([0, 0])
  const aspect = size.width / viewport.width
  useEffect(() => {
    // determines the position of the card based on its index, the number of cards and the width of the viewport
    // the card is positioned in a stack evenly spread from left of screeen to right of the viewport
    const increment = Math.min(viewport.width / CARDS, 1)
    const x = (i - (CARDS - 1) / 2) * increment
    const z = -2.9
    const pos = [x, 0, z] as Vec3

    POSITIONS[i].position = pos
  }, [i, viewport])
  const [spring, setSpring] = useSpring(
    () => ({
      position: zVec,
      rotation: zVec,
      config: { mass: MASS, friction: 66, tension: 2000 },
    }),
    [zVec],
  )
  const bind = useDrag(({ movement: [x, y], down, event, initial: [x_init, y_init] }) => {
    const SELF = SELF_STATE[i][0]

    event.stopPropagation()

    SHARED_STATE.active = down && i
    const flippingRotation = [0, 0.75, 0] as Vec3

    if (down) {
      // if card has not moved, rotate the card 45 degrees
      if (x < 2 && x > -2 && y < 2 && y > -2) {
        if (!isSame(SELF.current.rotation, flippingRotation)) {
          setSpring.start({ rotation: flippingRotation })
          SELF.current.rotation = flippingRotation
        }
      }
      let x_ = ((x_init + x) / size.width - 0.5) * 2.75

      // if drag is close enough to the top of the screen, bump the card up so at most above the hand
      //
      const toBump = -35
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
      if (!isSame(SELF.current.position, dragPos)) {
        setSpring.start({
          position: dragPos,
        })
        SELF.current.position = dragPos
      }
      // distance drag has travelled on x axis
      setData((x_init + x) / size.width)
      // for POSITIONS, find the position closest to x_, and swap that cards index with the current cards index
      const range = POSITIONS.map((x) => x.position[0])
      const closest = range.reduce((prev, curr) => (abs(curr - x_) < abs(prev - x_) ? curr : prev))
      const closestIndex = range.indexOf(closest)
      const temp = SELF.index
      SELF_STATE.find((x) => x[0].index === closestIndex)[0].index = temp
      SELF.index = closestIndex
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
    if (active === i) {
      const rotation = [0, -x / 5, 0] as Vec3
      if (!isSame(SELF.current.rotation, rotation)) {
        setTimeout(() => {
          setSpring.start({ rotation })
          SELF.current.rotation = rotation
        }, 75)
      }
    } else if (true && active !== false) {
      // if card index is < active index,
      // else if card index is > active index, move card to the right
      const offset = index > SELF_STATE[active][0].index ? 0.15 : -0.15
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
      })
    }
  })

  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <>
      <a.mesh {...spring} {...bindType} castShadow>
        <Html>
          <div className='w-20 -translate-x-1/2 select-none break-before-all overflow-hidden'>
            {JSON.stringify(data, null, 2)}
          </div>
        </Html>
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
