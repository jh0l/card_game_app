'use client'
import { Environment } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RGBELoader } from 'three-stdlib'
import * as THREE from 'three'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import { Button } from '../ui/button'
import { atom, useRecoilState } from 'recoil'
import { localStorageEffect } from '@/src/state/effects'

const permissionAtom = atom<'init' | 'compatible' | 'false' | 'prompt' | 'listen'>({
  key: 'permission',
  default: 'init',
  effects: [localStorageEffect('device_orientation_permission_v5')],
})

const useOrientationPermission = () => useRecoilState(permissionAtom)

const quaternion = new THREE.Quaternion()
export function LocalEnvironment() {
  const three = useThree()
  const [intensity] = useState(0.66)
  // const [quaternionState, setQuaternion] = useState<THREE.Quaternion>(quaternion)
  // const [gyroData, setGyroData] = useState('')
  // const [gyroState, setGyroEnabled] = useOrientationPermission()
  const pointer = useThree((state) => state.pointer)
  const texture = useLoader(RGBELoader, 'forest_slope_1k.hdr')
  // const meshRef = useRef<THREE.Mesh>()
  const [[x, y, z], setYZ] = useState([0, Math.PI / 2, 0])
  useEffect(() => {
    //   if (gyroState === 'listen') return
    const id = setInterval(() => {
      // vertical
      let _x = -Math.sin(Math.sin(pointer.y - 100) * 0.01) * Math.PI
      // rotate in direction slowly coming to a limit after a while
      // horizontal
      let _y = y + Math.sin(pointer.x) * 0.003
      setYZ([_x, _y, 0])
    }, 150)
    return () => clearInterval(id)
  }, [pointer.x, pointer.y, x, y, z])
  // useEffect(() => {
  //   if (gyroState !== 'init') return
  //   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  //   if (false && isMobile && 'DeviceOrientationEvent' in window) {
  //   } else {
  //     setGyroEnabled('false')
  //   }
  // }, [gyroState, setGyroEnabled])

  // useEffect(() => {
  //   if (gyroState === 'listen') {
  //     const controls = new DeviceOrientationControls()
  //     const id = setInterval(() => {
  //       if (meshRef.current) {
  //         if (controls.update(quaternion)) {
  //           meshRef.current.quaternion.copy(quaternion)
  //           setQuaternion(quaternion.clone())
  //           three.invalidate()
  //         }
  //       }
  //     }, 32)
  //     return () => {
  //       clearInterval(id)
  //       controls.dispose()
  //     }
  //   }
  // }, [gyroState, three])
  // const handlePermission = () => {
  //   if ('DeviceOrientationEvent' in window) {
  //     // @ts-ignore
  //     if (typeof DeviceMotionEvent.requestPermission === 'function') {
  //       // @ts-ignore
  //       window.DeviceOrientationEvent.requestPermission().then((permissionState) => {
  //         setGyroData(permissionState)
  //         if (permissionState === 'granted') {
  //           setGyroEnabled('listen')
  //         } else {
  //           setGyroEnabled('false')
  //         }
  //       })
  //     } else {
  //       setGyroEnabled('listen')
  //     }
  //   }
  // }

  return (
    <>
      <Environment background={true} blur={0.5}>
        {/* <HtmlPortal>
          {gyroState === 'compatible' && (
            <div
              className='pointer-events-auto absolute flex h-screen w-screen -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-black/50'
              onClick={handlePermission}
            >
              <Button variant='ghost'>gyro effects prompt</Button>
            </div>
          )}
          {gyroData && <div className='text-white'>{gyroData}</div>}
        </HtmlPortal> */}
        <mesh scale={10} position={[0, 0, 0]} rotation={[x, y, z]}>
          <sphereGeometry args={[4, 4, 4, 4]} />
          <meshBasicMaterial transparent opacity={intensity} map={texture} side={THREE.BackSide} toneMapped={false} />
        </mesh>
      </Environment>
    </>
  )
}

class DeviceOrientationControls {
  private EPS = 0.000001

  public enabled = true
  public deviceOrientation: Partial<DeviceOrientationEvent> = { alpha: 0, beta: 0, gamma: 0 }
  public screenOrientation: string | number = 0
  public alphaOffset = 0 // radians

  constructor() {
    this.connect()
  }

  private onDeviceOrientationChangeEvent = (event: DeviceOrientationEvent): void => {
    this.deviceOrientation = event
  }

  private onScreenOrientationChangeEvent = (): void => {
    this.screenOrientation = window.orientation || 0
  }

  // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

  private zee = new THREE.Vector3(0, 0, 1)
  private euler = new THREE.Euler()
  private q0 = new THREE.Quaternion()
  private q1 = new THREE.Quaternion(Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // - PI/2 around the x-axis
  private setObjectQuaternion = (
    quaternion: THREE.Quaternion,
    alpha: number,
    beta: number,
    gamma: number,
    orient: number,
  ): void => {
    this.euler.set(beta, alpha, -gamma, 'YXZ') // 'ZXY' for the device, but 'YXZ' for us
    quaternion.setFromEuler(this.euler) // orient the device
    quaternion.multiply(this.q1) // camera looks out the back of the device, not the top
    quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient)) // adjust for screen orientation
  }

  public connect = (askPermission: boolean = false): void => {
    this.onScreenOrientationChangeEvent() // run once on load

    window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent)
    window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent)

    this.enabled = true
  }

  public disconnect = (): void => {
    window.removeEventListener('orientationchange', this.onScreenOrientationChangeEvent)
    window.removeEventListener('deviceorientation', this.onDeviceOrientationChangeEvent)

    this.enabled = false
  }

  private lastQuaternion = new THREE.Quaternion()
  public update = (quaternion: THREE.Quaternion): boolean => {
    if (this.enabled === false) return false

    const device = this.deviceOrientation

    if (device) {
      const alpha = device.alpha ? THREE.MathUtils.degToRad(device.alpha) + this.alphaOffset : 0 // Z
      const beta = device.beta ? THREE.MathUtils.degToRad(device.beta) : 0 // X'
      const gamma = device.gamma ? THREE.MathUtils.degToRad(device.gamma) : 0 // Y''
      const orient = this.screenOrientation ? THREE.MathUtils.degToRad(this.screenOrientation as number) : 0 // O

      this.setObjectQuaternion(quaternion, alpha, beta, gamma, orient)

      if (8 * (1 - this.lastQuaternion.dot(quaternion)) > this.EPS) {
        this.lastQuaternion.copy(quaternion)
        // @ts-ignore
        return true
      }
    }
    return false
  }

  public dispose = (): void => this.disconnect()
}
