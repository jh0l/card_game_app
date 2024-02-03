import { GameView } from '@/src/components/canvas/game'
import GameBar from '@/src/components/dom/GameBar'
import { HandScrubber } from '@/src/components/dom/HandScrubber'
import { TopRightMenu } from '@/src/components/dom/TopRightMenu'

export default function GameClient() {
  return (
    <>
      {/* <GameView /> */}
      <HandScrubber />
      <TopRightMenu />
      <GameBar />
    </>
  )
}
