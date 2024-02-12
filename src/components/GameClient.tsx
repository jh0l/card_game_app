'use client'
import { GameView } from '@/src/components/canvas/game'
import GameBar from '@/src/components/dom/GameBar'
import { HandScrubber } from '@/src/components/dom/HandScrubber'
import { TopRightMenu } from '@/src/components/dom/TopRightMenu'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Portal } from '@/src/helpers/components/HtmlPortal'

export default function GameClient() {
  return (
    <>
      <GameView />
      <HandScrubber />
      <TopRightMenu />
      <GameBar />
    </>
  )
}
