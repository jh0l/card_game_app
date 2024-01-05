import { useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/three'
import { useEffect, useMemo, useState } from 'react'

const MASS = 1.5
const CARDS = 7

function Card({ i }: { i: number }) {
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width
  const transform = useMemo(() => {
    // array of positions and rotations for each card so they are in an arc with the center card in front while the other cards are behind the center card
    // taking into account size of cards and viewport
    const angle = (Math.PI / 180) * 15
    const center = (CARDS - 1) / 2
    const radius = viewport.width / 2
    const scale = viewport.width / 6
    const x = (Math.cos(angle * (i - center)) * radius) / 2
    const z = Math.sin(angle * (i - center)) * radius
    return [z, scale - 0.7, -x] as [number, number, number]
    // rotations.push([0, angle * (i - center) + Math.PI, 0])
  }, [viewport, i])
  const [spring, setSpring] = useSpring(() => ({
    position: [0, 0, 0],
    config: { mass: MASS, friction: 40, tension: 800 },
  }))
  const bind = useDrag(({ movement: [x, y], down, event }) => {
    event.stopPropagation()
    setSpring({
      position: down ? [x / aspect, -y / aspect, 0] : transform,
    })
  })
  // spring for moving Card to transform position
  useEffect(() => {
    setSpring({
      position: transform,
    })
  }, [transform, setSpring])

  // @ts-ignore
  const bindType = bind()
  return (
    // <group position={transform}>
    <a.mesh {...spring} {...bindType} castShadow>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshNormalMaterial />
    </a.mesh>
    // </group>
  )
}

export default function Hand() {
  const [transforms, setTransforms] = useState(
    Array.from({ length: CARDS }, () => ({
      key: Math.random(),
    })),
  )
  return (
    <group position={[0, -1.2, 0]} rotation={[-0.1, 0, 0]}>
      {transforms.map(({ key }, i) => (
        <Card i={i} key={key} />
      ))}
    </group>
  )
}
