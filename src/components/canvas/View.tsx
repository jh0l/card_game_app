'use client'

import {
  DetailedHTMLProps,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  Suspense,
  useImperativeHandle,
  useRef,
} from 'react'
import { PerspectiveCamera, View as ViewImpl } from '@react-three/drei'
import { Three } from '@/src/helpers/components/Three'
import { LocalEnvironment } from './LocalEnvironment'

export const Common = ({ color }: { color?: string }) => (
  <Suspense fallback={null}>
    {/* {color && <color attach='background' args={[color]} />} */}
    <ambientLight />
    <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
    <pointLight position={[-10, -10, -10]} color='blue' decay={0.2} />
    <PerspectiveCamera makeDefault fov={40} position={[0, -1, 8]} />
    <Suspense fallback={null}>
      <LocalEnvironment />
    </Suspense>
  </Suspense>
)

// props containing children, orbit (boolean), and props for Div element
type ViewProps = PropsWithChildren<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>

const View = forwardRef<{}, ViewProps>(({ children, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>{children}</ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
