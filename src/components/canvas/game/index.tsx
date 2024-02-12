'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import { View, Common } from '@/src/components/canvas/View'
import Players from '@/src/components/canvas/game/Players'
import { Bvh, StatsGl } from '@react-three/drei'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
const PlayArea = dynamic(() => import('@/src/components/canvas/game/PlayArea'), {
  ssr: false,
  loading: () => (
    <HtmlPortal>
      <SpinnerLight />
    </HtmlPortal>
  ),
})
//*/

export function GameView() {
  return (
    <View className='mx-auto size-full max-w-screen-lg bg-black opacity-[0.14]'>
      <StatsGl horizontal={false} logsPerSecond={5} className='translate-y-[50px]' />
      <Common />
      <Players />
      <Bvh firstHitOnly>
        <PlayArea />
      </Bvh>
    </View>
  )
}
