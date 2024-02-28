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
  selectedImageDefIdState,
  useImageDefUrl2,
  useImageDefinition,
  useImageDefinitionIds,
  useImageDefinitionIdsSet,
  useImageDefinitionReset,
  useImageDefinitionSet,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import { Focus } from 'lucide-react'
import { MouseEventHandler, useState, useRef, useTransition, useLayoutEffect } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE, useSetRecoilState } from 'recoil'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { ViewImage } from '../ImageHandler'

const ResizablePanelSizes = atom<number[]>({
  key: 'imageEditorResizablePanelSizes',
  default: [50, 50],
  effects: [IndexedDBEffect('imageEditorresizablePanelSizes', '')],
})

export default function ImagesTabContent() {
  const [, startTransition] = useTransition()
  const [sizes, setSizes] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(ResizablePanelSizes)
  const [imageDefIds, setImageDefIds] = useImageDefinitionIds()
  const listRef = useRef<HTMLDivElement>(null)
  const handleFocus = (imgDefId: string, behavior: ScrollBehavior = 'smooth') => {
    const index = imageDefIds.indexOf(imgDefId)
    if (index === -1) return
    if (!listRef.current) return
    listRef.current.children[index].scrollIntoView({ behavior, block: 'center' })
  }
  const handleResize: MouseEventHandler<keyof HTMLElementTagNameMap> = (e) => {
    // this is an event trigger (just like in GraphicsEditor.tsx)
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
  const setSelectedImageDefId = useSetRecoilState(selectedImageDefIdState)
  const [newImageDefId, setNewImageDefId] = useState(() => randomId())
  const setNewImageDef = useImageDefinitionSet(newImageDefId)
  const handleNewImageDefinition = () => {
    setNewImageDef({ id: newImageDefId, name: '' })
    setImageDefIds((ids) => [...ids, newImageDefId])
    setSelectedImageDefId(newImageDefId)
    setNewImageDefId(randomId())
  }
  return (
    <>
      <div className='w-[98%] px-1 pt-1'>
        <Button size='sm' className='w-full' onClick={handleNewImageDefinition}>
          New Image Definition
        </Button>
      </div>

      <ResizablePanelGroup
        onDrag={handleResize}
        onMouseUp={handleResize}
        onMouseLeave={handleResize}
        direction='vertical'
        className='max-w-xs rounded border bg-background/50'
        id='image_editor_panel_group'
      >
        <ResizablePanel
          defaultSize={sizes[0]}
          key={sizes[0] + 'p1'}
          className='shadow-inner shadow-black/10'
          id='image_editor_panel_1'
        >
          <ScrollArea className='size-full'>
            <div className='flex h-full w-[98%] flex-wrap items-center justify-start gap-1 px-1 pt-1' ref={listRef}>
              {imageDefIds.map((id, i) => (
                <ImgDefListItem index={i} key={id} definitionId={id} />
              ))}
              <div className='h-24 w-full opacity-0'>.</div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle id='editor_panel_handle' />
        <ResizablePanel
          defaultSize={sizes[1]}
          key={sizes[1] + 'p2'}
          className='shadow-inner shadow-black/10'
          id='image_editor_panel_2'
        >
          <ScrollArea className='h-full'>
            <ImageEditor handleFocus={handleFocus} />
            <div className='my-20 flex w-full items-center justify-center opacity-10'>_____</div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}

function ImgDefListItem({ definitionId, index }: { definitionId: string; index: number }) {
  const [selected, setSelected] = useRecoilState(selectedImageDefIdState)
  const [def] = useImageDefinition(definitionId)
  const handleSelect = () => {
    setSelected(definitionId)
  }
  return (
    <Button
      variant='secondary'
      onClick={handleSelect}
      className={cn(
        'relative flex h-11 w-full max-w-xs items-center justify-between gap-2 overflow-hidden rounded bg-background/50 p-1 px-1',
        {
          'bg-primary/50 hover:bg-primary/70': selected === definitionId,
        },
      )}
    >
      <div className='h-full font-mono text-xs opacity-60'>{index}</div>
      <div className='w-full overflow-x-auto overflow-y-hidden text-left text-xs'>{def.name}</div>
      <div className='flex w-full max-w-fit items-center justify-center pr-5'>
        <ImagePreview image_id={definitionId} />
      </div>
    </Button>
  )
}

function ImagePreview({ image_id }: { image_id: string }) {
  const img = useImageDefUrl2(image_id)
  const src = img.url
  return <img src={src} alt='.' className='flex h-min max-h-8 max-w-8 items-center justify-center object-contain' />
}

function ImageEditor({ handleFocus }: { handleFocus: (defId: string, behavior?: ScrollBehavior) => void }) {
  const [clonedId, setClonedId] = useState(() => randomId())
  const setClone = useImageDefinitionSet(clonedId)
  const [selectedImgDefId, setSelected] = useRecoilState(selectedImageDefIdState)
  const setIds = useImageDefinitionIdsSet()
  const [imgDef, setImgDef] = useImageDefinition(selectedImgDefId)
  const reset = useImageDefinitionReset(selectedImgDefId)
  const [, startTransition] = useTransition()
  const handleClone = () => {
    const clone = { ...imgDef, id: clonedId }
    setClone(clone)
    setIds((ids) => [...ids, clonedId])
    setSelected(clonedId)
    setClonedId(randomId())
  }
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this image definition?')) {
      setIds((ids) => ids.filter((id) => id !== selectedImgDefId))
      reset()
      setSelected('')
    }
  }
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    startTransition(() => {
      setImgDef((x) => ({ ...x, name }))
    })
  }
  const [mountFocus, setMountFocus] = useState<string>('')
  useLayoutEffect(() => {
    if (selectedImgDefId !== mountFocus) {
      setMountFocus(selectedImgDefId)
      handleFocus(selectedImgDefId, 'instant')
    }
  }, [selectedImgDefId, handleFocus, mountFocus])
  if (!imgDef || !selectedImgDefId) return null
  return (
    <div className='relative h-full w-[98%]' key={selectedImgDefId}>
      <div className='flex w-full items-center justify-between gap-2 p-1'>
        <Label size='xs'>Image Definition</Label>
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
        <div className='w-full select-text text-center font-mono text-[10px] opacity-40'>{selectedImgDefId}</div>
      </Label>
      <div className='flex w-full items-center justify-between p-1 text-xs'>
        <Input id='image_name' defaultValue={imgDef.name} onChange={handleNameChange} className='h-9' />
        <div className='flex items-center justify-center pl-2'>
          <Button size='icon' variant='outline' className='scale-75' onClick={() => handleFocus(selectedImgDefId)}>
            <Focus />
          </Button>
        </div>
      </div>
      <div className='flex w-full flex-col items-center gap-2 overflow-hidden'>
        <ViewImage image_id={imgDef.id} />
        <ReplaceImage />
      </div>
    </div>
  )
}

function ReplaceImage() {
  const [replace, setReplace] = useState(false)
  return (
    <>
      {!replace && (
        <>
          <div className='flex w-full flex-row-reverse justify-between px-1'>
            <Button size='sm' variant='outline' onClick={() => setReplace(true)}>
              Replace
            </Button>
          </div>
        </>
      )}
      {replace && (
        <>
          <div className='flex w-full items-center gap-1 px-1'>
            <div className='relative flex h-[52px] w-full items-center justify-center rounded-xl'>
              <Input
                className='absolute inset-0 cursor-pointer text-clip rounded-lg border-2 border-dashed border-white/50 text-xs text-white/90 transition-colors duration-200 ease-in-out'
                id='image'
                type='file'
              />
            </div>
            <Button variant='outline' onClick={() => setReplace(false)}>
              Cancel
            </Button>
          </div>
          <Button size='sm' variant='outline'>
            Save
          </Button>
        </>
      )}
    </>
  )
}
