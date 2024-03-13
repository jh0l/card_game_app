/* eslint-disable @next/next/no-img-element */
'use client'
import { Button } from '@/src/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/src/components/ui/resizable'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import {
  GraphicDefinitionType,
  ImageDefinitionIdType,
  randomId,
  selectedGraphicDefIdState,
  useGraphicDefinition,
  useGraphicDefinitionIds,
  useGraphicDefinitionIdsListSet,
  useGraphicDefinitionReset,
  useGraphicDefinitionSet,
  useImageDefUrl,
  useImageDefUrl2,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import { Focus } from 'lucide-react'
import { MouseEventHandler, useState, useRef, useTransition, useLayoutEffect } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE, useSetRecoilState } from 'recoil'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { ImageHandler } from '../ImageHandler'

const ResizablePanelSizes = atom<number[]>({
  key: 'gfxEditorresizablePanelSizes',
  default: [50, 50],
  effects: [IndexedDBEffect('gfxEditorresizablePanelSizes', '')],
})

export default function GraphicsContent() {
  const [, startTransition] = useTransition()
  const [sizes, setSizes] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(ResizablePanelSizes)
  const [gfxDefIds, setGfxDefIds] = useGraphicDefinitionIds()
  const listRef = useRef<HTMLDivElement>(null)
  const handleFocus = (gfxDefId: string, behavior: ScrollBehavior = 'smooth') => {
    const index = gfxDefIds.findIndex((id) => id === gfxDefId)
    if (index === -1) return
    // use scrollIntoView
    if (!listRef.current) return
    listRef.current.children[index].scrollIntoView({ behavior, block: 'center' })
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
  const setSelectedGfxDefId = useSetRecoilState(selectedGraphicDefIdState)
  const [newGfxDefId, setNewGfxDefId] = useState(() => randomId())
  const setNewGfxDef = useGraphicDefinitionSet(newGfxDefId)
  const handleNewGraphicDefinition = () => {
    setNewGfxDef({
      id: newGfxDefId,
      name: '',
      image: { image_id: '' },
      bumpMap: { image_id: '' },
      iridescentMap: { image_id: '' },
      width: 0,
      height: 0,
    })
    setGfxDefIds((prev) => [...prev, newGfxDefId])
    setSelectedGfxDefId(newGfxDefId)
    setNewGfxDefId(randomId())
  }
  return (
    <>
      <div className='w-[98%] px-1 pt-1'>
        <Button size='sm' className='w-full' onClick={handleNewGraphicDefinition}>
          New Graphic Definition
        </Button>
      </div>
      <ResizablePanelGroup
        onDrag={handleResize}
        onMouseUp={handleResize}
        onMouseLeave={handleResize}
        direction='vertical'
        className='max-w-xs rounded border bg-background/50'
        id='gfx_editor_panel_group'
      >
        <ResizablePanel
          defaultSize={sizes[0]}
          key={sizes[0] + 'p1'}
          className='shadow-inner shadow-black/10'
          id='gfx_editor_panel_1'
        >
          <ScrollArea className='size-full'>
            <div className='flex h-full w-[98%] flex-wrap items-center justify-start gap-1 px-1 pt-1' ref={listRef}>
              {gfxDefIds.map((id, i) => (
                <GfxDefinitionListItem index={i} key={id} definitionId={id} />
              ))}
              <div className='h-24 w-full opacity-0'>.</div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle id='editor_panel_handle' />
        <ResizablePanel
          key={sizes[1] + 'p2'}
          className='overflow-y-scroll shadow-black/10'
          defaultSize={sizes[1]}
          id='gfx_editor_panel_2'
        >
          <ScrollArea className='size-full max-w-xs overflow-hidden'>
            <GraphicEditor handleFocus={handleFocus} />
            <div className='my-20 flex w-full items-center justify-center opacity-10'>_____</div>
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
          'relative flex h-11 w-full max-w-xs items-center justify-between gap-2 overflow-hidden rounded bg-background/50 p-1 px-1',
          {
            'bg-primary/50 hover:bg-primary/70': selectedId === definitionId,
          },
        )}
      >
        <div className='h-full font-mono text-xs opacity-60'>{index}</div>
        <div className='w-full overflow-x-auto overflow-y-hidden text-left text-xs'>{gfxDef.name}</div>
        <div className='flex w-full max-w-fit items-center justify-center'>
          <GraphicInstancePreview graphic={gfxDef} />
        </div>
      </Button>
    </>
  )
}

function GraphicInstancePreview({ graphic }: { graphic: GraphicDefinitionType }) {
  const imageDef = useImageDefUrl(graphic.image)
  const bumpMapDef = useImageDefUrl(graphic.bumpMap)
  const iridMapDef = useImageDefUrl(graphic.iridescentMap)
  return (
    <div className='flex'>
      <img src={imageDef.url} alt=' ' className='h-8 max-w-8 object-contain pr-0.5' />
      <img src={bumpMapDef.url} alt=' ' className='h-8 max-w-8 object-contain pr-0.5' />
      <img src={iridMapDef.url} alt=' ' className='h-8 max-w-8 object-contain pr-0.5' />
    </div>
  )
}

const selectedGraphicEditorTabState = atom<string>({
  key: 'selectedGraphicEditorTab',
  default: 'image',
  effects: [IndexedDBEffect('selectedGraphicEditorTab', '')],
})

type TextureMapType = 'image' | 'bump' | 'irid'

function GraphicEditor({ handleFocus }: { handleFocus: (defId: string, behavior?: ScrollBehavior) => void }) {
  const [clonedId, setClonedId] = useState(() => randomId())
  const setClone = useGraphicDefinitionSet(clonedId)
  const [, startTransition] = useTransition()
  const setIds = useGraphicDefinitionIdsListSet()
  const [selectedGfxDefId, setSelected] = useRecoilState(selectedGraphicDefIdState)
  const [gfxDef, setGfxDef] = useGraphicDefinition(selectedGfxDefId)
  const reset = useGraphicDefinitionReset(selectedGfxDefId)
  const [tabValue, setTabValue] = useRecoilState(selectedGraphicEditorTabState)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setGfxDef((prev) => ({ ...prev, name: e.target.value }))
    })
  }
  const setGraphicMap = (value: string, type: TextureMapType) => {
    setGfxDef((prev) => {
      switch (type) {
        case 'image':
          return { ...prev, image: { image_id: value } }
        case 'bump':
          return { ...prev, bumpMap: { image_id: value } }
        case 'irid':
          return { ...prev, iridescentMap: { image_id: value } }
      }
    })
  }
  const handleClone = () => {
    const deepClone = JSON.parse(JSON.stringify(gfxDef)) as GraphicDefinitionType
    setClone({ ...deepClone })
    setIds((prev) => [...prev, clonedId])
    setSelected(clonedId)
    setClonedId(randomId())
  }
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this graphic definition')) {
      setIds((prev) => prev.filter((x) => x !== selectedGfxDefId))
      reset()
      setSelected('')
    }
  }
  const [mountFocus, setMountFocus] = useState<string>('')
  useLayoutEffect(() => {
    if (selectedGfxDefId !== mountFocus) {
      setMountFocus(selectedGfxDefId)
      handleFocus(selectedGfxDefId, 'instant')
    }
  }, [selectedGfxDefId, handleFocus, mountFocus])
  if (!gfxDef || !selectedGfxDefId) return null
  return (
    <div className='relative h-full w-[98%]' key={selectedGfxDefId}>
      <div className='flex w-full items-center justify-between gap-2 p-1'>
        <Label size='xs'>Graphic Definition</Label>
        <div className='flex gap-2'>
          <Button size='xs' variant='secondary' onClick={handleClone}>
            Clone
          </Button>
          <Button size='xs' variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
      <Label size='2xs' className='flex p-1'>
        <span className='w-full'>Definition Name</span>
        <div className='w-full select-text text-center font-mono text-[10px] opacity-40'>{selectedGfxDefId}</div>
      </Label>
      <div className='flex w-full items-center justify-between p-1 text-xs'>
        <Input id='card_name' defaultValue={gfxDef.name} onChange={handleNameChange} className='h-9' />
        <div className='flex items-center justify-center pl-2'>
          <Button size='icon' variant='outline' className='scale-75' onClick={() => handleFocus(selectedGfxDefId)}>
            <Focus />
          </Button>
        </div>
      </div>
      <Tabs
        defaultValue='image'
        className='max-w-xs overflow-hidden'
        key={selectedGfxDefId}
        value={tabValue}
        onValueChange={setTabValue}
      >
        <TabsList className='grid w-full grid-cols-3' selected>
          <TabsTrigger value='image'>Image</TabsTrigger>
          <TabsTrigger value='bump'>Bump</TabsTrigger>
          <TabsTrigger value='irid'>Irid.</TabsTrigger>
        </TabsList>
        <TabsContent value='image' className='h-full px-1'>
          <GraphicImageEditor type='image' setValue={setGraphicMap} value={gfxDef.image.image_id} />
        </TabsContent>
        <TabsContent value='bump' className='h-full px-1'>
          <GraphicImageEditor type='bump' setValue={setGraphicMap} value={gfxDef.bumpMap.image_id} />
        </TabsContent>
        <TabsContent value='irid' className='h-full px-1'>
          <GraphicImageEditor type='irid' setValue={setGraphicMap} value={gfxDef.iridescentMap.image_id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GraphicImageEditor({
  value,
  setValue,
  type,
}: {
  value: string
  setValue: (value: string, type: TextureMapType) => void
  type: TextureMapType
}) {
  return (
    <div className='flex flex-col gap-2 overflow-hidden py-3'>
      <Label size='2xs'>Image Definition</Label>
      <ImageHandler image={{ image_id: value }} setImage={(x) => setValue(x.image_id, type)} />
    </div>
  )
}

export function ImagePreview({ image }: { image?: ImageDefinitionIdType | string }) {
  const id = image ? (typeof image === 'string' ? image : image.image_id) : ''
  const imageDef = useImageDefUrl2(id)
  return <img src={imageDef.url} alt=' ' className=' max-w-6 object-contain pr-0.5' />
}
