import { GameView } from '@/src/components/canvas/game'
import { HandScrubber } from './HandScrubber'

export default function Page() {
  return (
    <main className='relative h-[100dvh] select-none'>
      <div className='absolute inset-0'>
        <GameView />
        <HandScrubber />
      </div>
    </main>
  )
}
