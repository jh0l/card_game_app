import { GameView } from '@/src/components/canvas/game'
import { HandScrubber } from '../src/components/dom/HandScrubber'
import { TopRightMenu } from '../src/components/dom/TopRightMenu'
import GameBar from '@/src/components/dom/GameBar'

export default function Page() {
  return (
    <main className='relative h-[100dvh] select-none'>
      <div className='absolute inset-0'>
        <GameView />
        <HandScrubber />
        <TopRightMenu />
        <GameBar />
      </div>
    </main>
  )
}
