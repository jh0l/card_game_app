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
  ImageDefinitionIdType,
  randomId,
  selectedGraphicDefIdState,
  useGraphicDefinition,
  useGraphicDefinitionIds,
  useGraphicDefinitionIdsList,
  useGraphicDefinitionIdsListSet,
  useGraphicDefinitionReset,
  useGraphicDefinitionSet,
  useImageDefUrl,
  useImageDefUrl2,
  useImageDefinition,
  useImageDefinitionIds,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import { Check, ChevronsUpDown, Focus } from 'lucide-react'
import { MouseEventHandler, Suspense, useState, useRef, useTransition } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE, useSetRecoilState } from 'recoil'
import { TargetIcon } from '@radix-ui/react-icons'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { ImageHandler } from '../ImageHandler'
import { Checkbox } from '../../ui/checkbox'

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
  const setSelectedGfxDefId = useSetRecoilState(selectedGraphicDefIdState)
  const [newGfxDefId, setNewGfxDefId] = useState(() => randomId())
  const setNewGfxDef = useGraphicDefinitionSet(newGfxDefId)
  const handleNewGraphicDefinition = () => {
    setNewGfxDef({
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
      <div className='px-1 pt-1'>
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
          key={sizes[1] + 'p2'}
          className='overflow-y-scroll shadow-inner shadow-black/10'
          defaultSize={sizes[1]}
          id='gfx_editor_panel_2'
        >
          <ScrollArea className='h-full'>
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
  const bumpMapDef = useImageDefUrl(graphic.bumpMap)
  const iridMapDef = useImageDefUrl(graphic.iridescentMap)
  return (
    <div className='flex'>
      <img src={imageDef.url} alt=' ' className='h-8 object-contain pr-0.5' />
      <img src={bumpMapDef.url} alt=' ' className='h-8 object-contain pr-0.5' />
      <img src={iridMapDef.url} alt=' ' className='h-8 object-contain pr-0.5' />
    </div>
  )
}

const selectedGraphicEditorTabState = atom<string>({
  key: 'selectedGraphicEditorTab',
  default: 'image',
  effects: [IndexedDBEffect('selectedGraphicEditorTab', '')],
})

type TextureMapType = 'image' | 'bump' | 'irid'

function GraphicEditor({ handleFocus }: { handleFocus: (gfxDefId: string) => void }) {
  const [clonedId, setClonedId] = useState(() => randomId())
  const setClone = useGraphicDefinitionSet(clonedId)

  const setIds = useGraphicDefinitionIdsListSet()
  const [selectedGfxDefId, setSelected] = useRecoilState(selectedGraphicDefIdState)
  const [gfxDef, setGfxDef] = useGraphicDefinition(selectedGfxDefId)
  const reset = useGraphicDefinitionReset(selectedGfxDefId)
  const [tabValue, setTabValue] = useRecoilState(selectedGraphicEditorTabState)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGfxDef((prev) => ({ ...prev, name: e.target.value }))
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
  if (!gfxDef || !selectedGfxDefId) return null
  return (
    <div className='relative h-full px-2' key={selectedGfxDefId}>
      <div className='flex w-full items-center justify-between gap-2 py-2'>
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
      <Label size='2xs' className='flex'>
        <span className='w-full'>Definition Name</span>
        <div className='w-full select-text text-center font-mono text-[10px] opacity-40'>{selectedGfxDefId}</div>
      </Label>
      <div className='flex w-full items-center justify-between pb-0.5 text-xs'>
        <Input id='card_name' defaultValue={gfxDef.name} onChange={handleNameChange} className='h-9' />
        <div className='flex items-center justify-center pl-2'>
          <Button size='icon' variant='outline' className='scale-75' onClick={() => handleFocus(selectedGfxDefId)}>
            <Focus />
          </Button>
        </div>
      </div>
      <Tabs
        defaultValue='image'
        className='w-full max-w-xs'
        key={selectedGfxDefId}
        value={tabValue}
        onValueChange={setTabValue}
      >
        <TabsList className='grid w-full grid-cols-3' selected>
          <TabsTrigger value='image'>Image</TabsTrigger>
          <TabsTrigger value='bump'>Bump</TabsTrigger>
          <TabsTrigger value='irid'>Irid.</TabsTrigger>
        </TabsList>
        <TabsContent value='image' className='h-full'>
          <GraphicImageEditor type='image' setValue={setGraphicMap} value={gfxDef.image.image_id} />
        </TabsContent>
        <TabsContent value='bump' className='h-full'>
          <GraphicImageEditor type='bump' setValue={setGraphicMap} value={gfxDef.bumpMap.image_id} />
        </TabsContent>
        <TabsContent value='irid' className='h-full'>
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
  const [imageDefIds] = useImageDefinitionIds()
  return (
    <div className='flex flex-col gap-2'>
      {imageDefIds.length > 0 && (
        <div className='flex w-full gap-2'>
          <ImageDefComboBox imageDefId={value} setValue={(s) => setValue(s, type)} />
          <Button variant='outline' size='sm'>
            New
          </Button>
        </div>
      )}
      {!value && imageDefIds.length === 0 && (
        <>
          <div className='flex h-16 items-center justify-center text-xs italic text-gray-500/70'>Import an image</div>
          <ImageHandler image={{ image_id: value }} setImage={(x) => setValue(x.image_id, type)} />
          {/* if bump or iridescence map is missing, show button below */}
          Also apply to
          <Checkbox />
          <Checkbox />
        </>
      )}
    </div>
  )
}

function ImageDefComboBox({ imageDefId, setValue }: { imageDefId: string; setValue: (value: string) => void }) {
  const [imageDef] = useImageDefinition(imageDefId)
  const [open, setOpen] = useState(false)
  const [imageDefIds] = useImageDefinitionIds()
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id='image_definition'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
          size='sm'
        >
          {imageDefId ? (
            <div className='flex items-center justify-start gap-2'>
              <div className='flex'>
                <ImagePreview image={imageDefId} />
              </div>
              {imageDef.name || <span className='italic text-red-500/70'>Image has no name</span>}
            </div>
          ) : (
            <span className='text-xs italic text-gray-500/70'>Select Image</span>
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs p-0'>
        <Command>
          {imageDefIds.length === 0 && <CommandGroup heading='No Images to choose from  ' />}
          {imageDefIds.length > 3 && <CommandInput placeholder='Search Images...' />}
          {imageDefIds.length > 1 && <CommandEmpty>No Images Found</CommandEmpty>}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ImagePreview({ image }: { image?: ImageDefinitionIdType | string }) {
  const id = image ? (typeof image === 'string' ? image : image.image_id) : ''
  const imageDef = useImageDefUrl2(id)
  return <img src={imageDef.url} alt=' ' className='h-8 object-contain pr-0.5' />
}
