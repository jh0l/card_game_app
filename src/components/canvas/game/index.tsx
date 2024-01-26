'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
/*
const View = dynamic(() => import('@/src/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/src/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const Dog = dynamic(() => import('@/src/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
const Duck = dynamic(() => import('@/src/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
const Hand = dynamic(() => import('@/src/components/canvas/game/Hand').then((mod) => mod.default), { ssr: false })
/*/
import { View, Common } from '@/src/components/canvas/View'
import PlayArea from '@/src/components/canvas/game/PlayArea'
import Players from '@/src/components/canvas/game/Players'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import { PerspectiveCamera } from '@react-three/drei'
import { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { useSpring } from '@react-spring/three'

//*/

export function GameView() {
  return (
    <View className='mx-auto h-full w-full max-w-screen-lg bg-black opacity-[0.14]'>
      <Common />
      <GyroGroup>
        <PerspectiveCamera makeDefault fov={40} position={[0, 0, 7]} />
        <Suspense fallback={null}>
          <Players />
          <PlayArea />
        </Suspense>
      </GyroGroup>
    </View>
  )
}

function GyroGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<Group>()
  const [permission, setPermission] = useState(false)
  useEffect(() => {
    if (!permission) {
      // ask for device orientation permission on webkit and chrome and firefox and edge
      if (
        'requestPermission' in DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === 'granted') {
              setPermission(true)
            } else {
              alert('Permission denied')
            }
          })
          .catch(console.error)
      }
    }
  }, [permission])
  useEffect(() => {
    if (!permission) return
    const listener = (e: DeviceOrientationEvent) => {
      if (!groupRef.current) return
      const { alpha, beta, gamma } = e
      if (alpha === null || beta === null || gamma === null) return
      groupRef.current.rotation.set(beta * (Math.PI / 180), alpha * (Math.PI / 180), -gamma * (Math.PI / 180))
    }
    window.addEventListener('deviceorientation', listener)
    return () => window.removeEventListener('deviceorientation', listener)
  }, [permission])

  // @ts-ignore
  return <group ref={groupRef}>{children}</group>
}
