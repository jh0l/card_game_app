/* eslint-disable @next/next/no-img-element */

'use client'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import GraphicsContent from '@/src/components/dom/editor2/GraphicsEditor'
import { HandContent, CardsContent } from '@/src/components/dom/editor2/CardTabContent'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })

export default function Page() {
  return (
    <>
      <main className='relative h-[100dvh]'>
        <Editor />
        {/* <GameClient /> */}
      </main>
    </>
  )
}

function Editor() {
  const [show, setShow] = useState(true)
  return (
    <div className='pointer-events-none absolute inset-0 z-50 flex items-end justify-end'>
      <div className='flex h-screen w-full max-w-xs flex-col gap-2'>
        <div className='pointer-events-auto overflow-hidden rounded'>
          <div className='flex items-center justify-between bg-muted/50 p-1 px-2 text-sm'>
            <span>Editor</span>
            <div>
              <Button size='xs' variant={show ? 'outline' : 'default'} onClick={() => setShow((x) => !x)}>
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>
          {!show && <div key='toolbar' className='h-0 bg-muted transition-[height]'></div>}
          {show && (
            <div key='toolbar' className='h-[100svh] bg-muted/90 transition-[height] duration-500'>
              <EditorContent />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// contains tabs for Cards, Graphics, Images, Table
function EditorContent() {
  return (
    <Tabs defaultValue='cards' className='size-full max-w-xs'>
      <TabsList className='grid w-full grid-cols-5' selected>
        <TabsTrigger value='hand'>hand</TabsTrigger>
        <TabsTrigger value='cards'>cards</TabsTrigger>
        <TabsTrigger value='graphics'>gfx</TabsTrigger>
        <TabsTrigger value='images'>images</TabsTrigger>
        <TabsTrigger value='table'>table</TabsTrigger>
      </TabsList>
      <TabsContent value='hand' className='h-full'>
        <HandContent />
      </TabsContent>
      <TabsContent value='cards' className='h-full'>
        <CardsContent />
      </TabsContent>
      <TabsContent value='graphics' className='h-full'>
        <GraphicsContent />
      </TabsContent>
    </Tabs>
  )
}
