'use client'

import { GameView } from '@/components/canvas/game'

export default function Page() {
  return (
    <main className='relative h-[100dvh]'>
      <div className='absolute inset-0'>
        <GameView />
      </div>
    </main>
  )
}
