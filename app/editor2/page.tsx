'use client'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { useCardDefinition, useCardDefinitionList } from '@/src/state/assets'
import dynamic from 'next/dynamic'
import { useState } from 'react'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })

export default function Page() {
  return (
    <>
      <main className='relative h-[100dvh]'>
        <Editor />
        <GameClient />
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
          {!show && <div key='toolbar' className='h-0 bg-muted'></div>}
          {show && (
            <div key='toolbar' className='h-[100svh] bg-muted/90'>
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
    <Tabs defaultValue='cards' className='w-full max-w-xs'>
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='cards'>Cards</TabsTrigger>
        <TabsTrigger value='graphics'>Graphics</TabsTrigger>
        <TabsTrigger value='images'>Images</TabsTrigger>
        <TabsTrigger value='table'>Table</TabsTrigger>
      </TabsList>
      <TabsContent value='cards'>
        <CardsContent />
      </TabsContent>
    </Tabs>
  )
}

function CardsContent() {
  const [cardDefinitionIds] = useCardDefinitionList()
  return (
    <div className='flex flex-col gap-2 p-2'>
      {cardDefinitionIds.map((id) => (
        <CardDefinitionListItem key={id} definitionId={id} />
      ))}
    </div>
  )
}

function CardDefinitionListItem({ definitionId }: { definitionId: string }) {
  const [cardDefinition] = useCardDefinition(definitionId)
  return (
    <div className='flex items-center gap-2 rounded bg-background/50 p-2'>
      <div className='size-12 rounded bg-gray-300'></div>
      <div className='flex flex-col gap-1'>
        <div className='text-sm'>{cardDefinition.name}</div>
        <div className='text-xs text-gray-500'></div>
      </div>
    </div>
  )
}
