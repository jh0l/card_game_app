/* eslint-disable @next/next/no-img-element */
'use client'
import { Spinner } from '@/src/components/dom/Spinner'
import { Button } from '@/src/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/src/components/ui/resizable'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import {
  GraphicDefinitionType,
  GraphicInstanceType,
  randomId,
  selectedGraphicDefIdState,
  useGraphicDefinition,
  useGraphicDefinitionIds,
  useGraphicDefinitionIdsList,
  useImageDefUrl,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import { Check, ChevronsUpDown, Focus } from 'lucide-react'
import { MouseEventHandler, Suspense, useState, useRef, useTransition } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE } from 'recoil'
import { TargetIcon } from '@radix-ui/react-icons'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'

const ResizablePanelSizes = atom<number[]>({
  key: 'gfxEditorresizablePanelSizes',
  default: [50, 50],
  effects: [IndexedDBEffect('gfxEditorresizablePanelSizes', '')],
})

export default function GraphicsContent() {
  const [, startTransition] = useTransition()
  const [sizes, setSizes] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(ResizablePanelSizes)
  const [gfxDefIds] = useGraphicDefinitionIds()
  const listRef = useRef<HTMLDivElement>(null)
  const handleFocus = (gfxDefId: string) => {
    const index = gfxDefIds.findIndex((id) => id === gfxDefId)
    if (index === -1) return
    // use scrollIntoView
    if (!listRef.current) return
    listRef.current.children[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const handleResize: MouseEventHandler<keyof HTMLElementTagNameMap> = (e) => {
    // event trigger
    // determine if the the mouse event was triggered by one of the resizable panels or th handle
    if ('nativeEvent' in e) {
      if ('target' in e.nativeEvent && e.nativeEvent.target instanceof HTMLElement) {
        // updates sizes atom
        const panelGroup = e.nativeEvent.target.closest('[data-panel-group]')
        if (panelGroup) {
          const panel1 = panelGroup.firstChild
          const panel2 = panelGroup.lastChild
          if (panel1 && panel2) {
            startTransition(() => {
              const max = panelGroup.clientHeight
              // @ts-ignore
              const bad = (panel1.clientHeight / max) * 100
              // make sizes add up to 100
              const sizesNormal = [0, 0]
              sizesNormal[0] = Math.min(Number(bad.toFixed(1)), 98)
              sizesNormal[1] = 100 - sizesNormal[0]
              setSizes(sizesNormal)
            })
          }
        }
      }
    }
  }
  return (
    <>
      <div className='px-1 pt-1'>
        <Button size='sm' className='w-full'>
          New Graphic Definition
        </Button>
      </div>
      <ResizablePanelGroup
        onDrag={handleResize}
        onMouseUp={handleResize}
        onMouseLeave={handleResize}
        direction='vertical'
        className='max-w-xs rounded border bg-background/50'
        id='editor_panel_group'
      >
        <ResizablePanel
          key={sizes[0] + 'panel1'}
          defaultSize={sizes[0]}
          className='shadow-inner shadow-black/10'
          id='editor_panel_1'
        >
          <ScrollArea className='size-full'>
            <div className='flex h-full flex-wrap items-center justify-around gap-1 p-1' ref={listRef}>
              {gfxDefIds.map((id, i) => (
                <GfxDefinitionListItem index={i} key={id} definitionId={id} />
              ))}
              <div className='h-24 w-full opacity-0'>.</div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle id='editor_panel_handle' />
        <ResizablePanel
          className='overflow-y-scroll shadow-inner shadow-black/10'
          key={sizes[0] + 'panel2'}
          defaultSize={sizes[1]}
          id='editor_panel_2'
        >
          <ScrollArea className='h-full'>
            <GraphicEditor handleFocus={handleFocus} />
            <div className='my-10 flex w-full items-center justify-center opacity-10'>_____</div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}

function GfxDefinitionListItem({ definitionId, index }: { definitionId: string; index: number }) {
  const [gfxDef] = useGraphicDefinition(definitionId)
  const [selectedId, setSelectedGfxDefId] = useRecoilState(selectedGraphicDefIdState)
  return (
    <>
      <Button
        variant='secondary'
        onClick={() => setSelectedGfxDefId(definitionId)}
        className={cn(
          'relative flex h-11 w-full items-center justify-between gap-2 rounded bg-background/50 p-1 px-2',
          {
            'bg-primary/50 hover:bg-primary': selectedId === definitionId,
          },
        )}
      >
        <div className='flex items-center gap-2 font-mono text-xs'>
          <div>{index}</div>
          <GraphicInstancePreview graphic={gfxDef} />
        </div>
        <div className='text-sm'>{gfxDef.name}</div>
        <div className='absolute -top-0.5 right-1 font-mono text-[9px] opacity-40'>{definitionId}</div>
      </Button>
    </>
  )
}

function GraphicInstancePreview({ graphic }: { graphic: GraphicDefinitionType }) {
  const imageDef = useImageDefUrl(graphic.image)
  return <img src={imageDef.url} alt='.' className='h-8 object-contain pr-0.5' />
}

function GraphicEditor({ handleFocus }: { handleFocus: (gfxDefId: string) => void }) {
  return null
}
