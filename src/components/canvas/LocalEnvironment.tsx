'use client'
import { Environment } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { RGBELoader } from 'three-stdlib'
import * as THREE from 'three'
import { useSpring, animated, config } from '@react-spring/three'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'

export function LocalEnvironment() {
  const texture = useLoader(RGBELoader, 'forest_slope_1k.hdr')
  const [_z, setZ] = useState(32)
  useEffect(() => {
    const timeoutId = setInterval(() => {
      setZ((x) => x + 0.00002)
    }, 16)
    return () => clearInterval(timeoutId)
  })
  return (
    <Environment background={true} blur={0.5}>
      {/* <HtmlPortal>{_z}</HtmlPortal> */}
      <mesh scale={10} position={[0, 0, 0]} rotation={[0, _z, 0]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0.55} map={texture} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </Environment>
  )
}
