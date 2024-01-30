'use client'
import { useTableParamsValue } from '@/src/state/room'
import { Dog, Duck } from '@/src/components/canvas/Examples'

export default function Players() {
  const { size, position } = useTableParamsValue()
  const x = size / 3
  const z = position[2] - 0.5
  const scale = 0.6
  return (
    <group position={[0, size / 1.05, z]} rotation={[Math.PI / 2, 0, 0]}>
      <Duck position={[x, 0, 0]} scale={scale} rotation={[0, -0.3, 0]} />
      <Dog position={[-x, 0, 0]} scale={scale} rotation={[0, 0.3, 0]} />
    </group>
  )
}
