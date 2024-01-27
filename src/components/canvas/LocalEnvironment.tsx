'use client'
import { Environment } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { RGBELoader } from 'three-stdlib'
import * as THREE from 'three'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import { Button } from '../ui/button'

export function LocalEnvironment() {
  const [gyroData, setGyroData] = useState('')
  const [gyroState, setGyroEnabled] = useState<'init' | 'compatible' | 'false' | 'prompt' | 'listening'>('init')
  const pointer = useThree((state) => state.pointer)
  const texture = useLoader(RGBELoader, 'forest_slope_1k.hdr')
  const [[y, z], setYZ] = useState([0, 0])
  useEffect(() => {
    if (gyroState === 'listening') return
    const id = setInterval(() => {
      let _y = -Math.sin(Math.sin(pointer.y) * 0.01) * Math.PI * 1.5 + y * 0.9
      // rotate in direction slowly coming to a limit after a while
      let _z = z + Math.sin(pointer.x) * 0.0003
      setYZ([_y, _z])
    }, 32)
    return () => clearInterval(id)
  }, [gyroState, pointer.x, pointer.y, y, z])
  useEffect(() => {
    if (gyroState !== 'init') return
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && 'DeviceOrientationEvent' in window) {
      setGyroEnabled('compatible')
    } else {
      setGyroEnabled('false')
    }
  }, [gyroState])
  const handlePermission = () => {
    if ('DeviceOrientationEvent' in window) {
      // @ts-ignore
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // @ts-ignore
        window.DeviceOrientationEvent.requestPermission().then((permissionState) => {
          setGyroData(permissionState)
          if (permissionState === 'granted') {
            setGyroEnabled('listening')
            window.addEventListener('deviceorientation', (e) => {
              const { alpha, beta, gamma } = e
              if (alpha && beta && gamma) {
                setGyroData(`${alpha} ${beta} ${gamma}`)
                const _y = THREE.MathUtils.degToRad(beta)
                const _z = THREE.MathUtils.degToRad(gamma)
                setYZ([_y, _z])
              }
            })
          } else {
            setGyroEnabled('false')
          }
        })
      } else {
        window.addEventListener('deviceorientation', (e) => {
          const { alpha, beta, gamma } = e
          if (alpha && beta && gamma) {
            setGyroData(`${alpha} ${beta} ${gamma}`)
            const _y = THREE.MathUtils.degToRad(beta)
            const _z = THREE.MathUtils.degToRad(gamma)
            setYZ([_y, _z])
          }
        })
      }
    }
  }

  return (
    <Environment background={true} blur={0.5}>
      <HtmlPortal>
        {gyroState === 'compatible' && (
          <div
            className='pointer-events-auto absolute flex h-screen w-screen -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-black/50'
            onClick={handlePermission}
          >
            <Button variant='ghost'>gyro effects prompt</Button>
          </div>
        )}
        {gyroData && <div className='text-white'>{gyroData}</div>}
      </HtmlPortal>
      <mesh scale={10} position={[0, 0, 0]} rotation={[y, z, 0]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0.88} map={texture} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </Environment>
  )
}
