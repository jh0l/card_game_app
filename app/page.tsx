'use client'

import { GameView } from '@/components/canvas/game'
import { RecoilRoot } from 'recoil'

export default function Page() {
  return (
    <main className='relative h-[100dvh] select-none'>
      <div className='absolute inset-0'>
        <GameView />
      </div>
    </main>
  )
}
