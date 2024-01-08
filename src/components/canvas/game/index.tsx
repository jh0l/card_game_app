import { Suspense, useState } from 'react'
/*
import dynamic from 'next/dynamic'
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
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
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
const Duck = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
/*/
import { View, Common } from '@/components/canvas/View'
import { Dog, Duck } from '@/components/canvas/Examples'
import Hand from '@/components/canvas/game/Hand'
//*/

export function GameView() {
  const [active, setActive] = useState(false)
  return (
    <View orbit={!active} className='mx-auto h-full w-full max-w-screen-lg bg-pink-100'>
      <Suspense fallback={null}>
        <Duck position={[0, -0.6, -3]} scale={1} rotation={[0.0, -0.3, 0]} />
        <Dog position={[0, 1, -4]} scale={1} rotation={[0.0, -0.3, 0]} />
        <Hand setActive={setActive} />
      </Suspense>
      <Common />
    </View>
  )
}
