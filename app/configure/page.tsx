'use client'
import * as React from 'react'
import { useControls } from 'leva'
import GameClient from '@/src/components/GameClient'
// import SpinnerLight from '@/src/components/dom/SpinnerLight'
// import dynamic from 'next/dynamic'
// const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'

import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/src/lib/utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  CardDefinitionType,
  ImageDefinitionIdType,
  randomId,
  useCardDefinition,
  useCardDefinitionList,
  useCardDefinitionsListSet,
  useImageDef,
  useImageDefinitionIds,
  useImageDefinitionIdsList,
  useImageDefinitionIdsSet,
  useImageDefinitionSet,
} from '@/src/state/assets'
import { atomFamily, useRecoilState } from 'recoil'
import { localStorageEffect } from '@/src/state/effects'
import SpinnerLight from '@/src/components/dom/SpinnerLight'

export default function Page() {
  // const Settings = true
  const { Configure } = useControls({ Configure: true })
  return (
    <main className='relative h-[100dvh]'>
      {Configure && <CardManager />}
      {/* <GameClient /> */}
    </main>
  )
}

/** cards definitions
 *    > image reference
 *      > option to upload image with card definition
 *    > label, description, label style, description style
 *    > bump map reference
 *      > option to upload bump map with card definition
 *    > iridescent map reference
 *      > option to upload iridescent map with card definition
 *    material settings?
// bump maps
// iridescent maps
*/

function CardManager() {
  const [cardDefIds, setCardIds] = useCardDefinitionList()
  const handleDelete = (id: string) => {
    setCardIds((x) => {
      return x.filter((x) => x !== id)
    })
  }
  return (
    <div className='pointer-events-none absolute inset-0 z-20 flex flex-col items-end justify-end p-2'>
      <div className='pointer-events-auto flex h-[90%] w-full max-w-lg flex-col gap-2 overflow-y-scroll'>
        <div className='flex w-full flex-col gap-2 rounded border bg-background p-2'>
          <h2 className='text-lg font-bold'>Hand</h2>
          <HandCard />
          <AddHandCard />
        </div>
        <div className='flex w-full flex-col gap-4 rounded border bg-background p-3'>
          <h2 className='text-lg font-bold'>Card Definitions</h2>
          {cardDefIds.map((id) => (
            <CardDefinition key={id} id={id} handleDelete={() => handleDelete(id)} />
          ))}
          <CreateNewCardDefinition />
        </div>
        <div className='flex w-full flex-col gap-2 rounded border bg-background p-3'>
          <h2 className='text-lg font-bold'>Images</h2>
          <ImageDefinition />
          <CreateNewImageDefinition />
        </div>
        <div className='flex w-full flex-col gap-2 rounded border bg-background p-3'>
          <h2 className='text-lg font-bold'>Table</h2>
          <TableManager />
        </div>
      </div>
    </div>
  )
}
function HandCard() {
  return <div className='grid w-full items-center gap-1.5'>{/* <ImageDefSelector /> */}</div>
}
function AddHandCard() {
  return (
    <div className='grid w-full items-center gap-1.5'>
      <Button size='sm'>Add Card</Button>
    </div>
  )
}

function CreateNewCardDefinition() {
  const setCardDefinitions = useCardDefinitionsListSet()
  const handle = () => {
    const id = randomId()
    setCardDefinitions((prev) => [...prev, id])
  }
  return (
    <div className='grid w-full items-center gap-1.5'>
      <Button onClick={handle} size='sm'>
        New Card
      </Button>
    </div>
  )
}

/** control which definitions are expanded */
const expandedFamily = atomFamily<string, string>({
  key: 'expanded',
  default: '',
  effects: (key) => [localStorageEffect(key + '_expanded')],
})
export const useExpanded = (id: string) => useRecoilState(expandedFamily(id))

function CardDefinition({ id, handleDelete }: { id: string; handleDelete: () => void }) {
  const [cardDefinitionState, setCardDefinition] = useCardDefinition(id)
  const [show, setShow] = useExpanded('card_definitions')
  // const setName = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setCardDefinition((prev) => ({ ...prev, name: event.target.value }))
  // }
  // const setDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setCardDefinition((prev) => ({ ...prev, description: event.target.value }))
  // }
  // const setLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setCardDefinition((prev) => ({ ...prev, label: event.target.value }))
  // }
  const setDefValue = (key: keyof CardDefinitionType) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setCardDefinition((prev) => ({ ...prev, [key]: event.target.value }))
  const setImage = (image: ImageDefinitionIdType) => {
    setCardDefinition((prev) => ({ ...prev, image }))
  }
  const setBumpMap = (bumpMap: ImageDefinitionIdType) => {
    setCardDefinition((prev) => ({ ...prev, bumpMap }))
  }
  const setIridescentMap = (iridescentMap: ImageDefinitionIdType) => {
    setCardDefinition((prev) => ({ ...prev, iridescentMap }))
  }
  return (
    <div className='relative grid w-full items-center gap-3 rounded border bg-gray-700/20 p-2'>
      <span className='absolute top-1 flex w-full justify-center font-mono text-xs text-white/20'>id: {id}</span>
      <div>
        <Label htmlFor='name'>Name</Label>
        <Input id='name' type='text' value={cardDefinitionState.name} onChange={setDefValue('name')} />
        <div className='absolute right-1 top-1'>
          <Button
            size='sm'
            onClick={() => setShow((x) => (x === id ? '' : id))}
            variant={show === id ? 'outline' : 'default'}
          >
            {show === id ? '-' : '+'}
          </Button>
        </div>
      </div>
      {show === id && (
        <>
          <div>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              type='text'
              value={cardDefinitionState.description}
              onChange={setDefValue('description')}
            />
          </div>
          <div>
            <Label htmlFor='health'>Health</Label>
            <Input id='health' type='number' value={cardDefinitionState.health} onChange={setDefValue('health')} />
          </div>
          <div>
            <Label htmlFor='attack'>Attack</Label>
            <Input id='attack' type='number' value={cardDefinitionState.attack} onChange={setDefValue('attack')} />
          </div>
          <div>
            <Label htmlFor='defence'>Defence</Label>
            <Input id='defence' type='number' value={cardDefinitionState.defence} onChange={setDefValue('defence')} />
          </div>
          {/* <div>
            <Label htmlFor='label'>Denomination</Label>
            <Input id='label' type='text' value={cardDefinitionState.label} onChange={setDefValue('label')} />
          </div> */}
          <div>
            <Label htmlFor='image'>Image</Label>
            <ImageHandler image={cardDefinitionState.image} setImage={setImage} />
          </div>
          <div>
            <Label htmlFor='bumpMap'>Bump Map</Label>
            <ImageHandler image={cardDefinitionState.bumpMap} setImage={setBumpMap} />
          </div>
          <div>
            <Label htmlFor='iridescentMap'>Iridescent Map</Label>
            <ImageHandler image={cardDefinitionState.iridescentMap} setImage={setIridescentMap} />
          </div>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => {
              confirm('Are you sure you want to delete this card?\nThere is no undo (yet)') && handleDelete()
            }}
          >
            Delete Card
          </Button>
          <Button>Duplicate Definition</Button>
          <Button>Add to hand</Button>
        </>
      )}
    </div>
  )
}
function ImageHandler({
  image,
  setImage,
}: {
  image?: ImageDefinitionIdType
  setImage: (image: ImageDefinitionIdType) => void
}) {
  // option to choose existing image or upload a new image or use a URL
  // setImage is a function that sets the image
  const [newId, setNewId] = React.useState<false | string>(false)
  const [newName, setNewName] = React.useState('')
  const [newType, setNewType] = React.useState<'url' | 'db'>('db')
  const [newImageObj, setNewImageObj] = React.useState<{ src: string; file?: File } | null>(null)
  const [imageDefIds, setimageDefIds] = useImageDefinitionIds()
  const setNewImage = useImageDefinitionSet(newId || '')
  const newImage = React.useMemo(() => {
    if (!newImageObj) return null
    if (!newName) {
      setNewName(newImageObj?.file?.name || newImageObj.src.split('/').pop() || 'untitled')
    }
    if (newImageObj.file) {
      console.log('newImageObj.file', newImageObj.file)
      return {
        src: URL.createObjectURL(newImageObj.file),
        file: newImageObj,
      }
    }
    return newImageObj
  }, [newImageObj, newName])
  const handleNewImageDefinition = () => {
    // use `newId` for image id
    // save image file/url to image atomFamily backed by indexedDB
    if (!newId) throw new Error('tried to save image while newId is false')
    if (newImageObj === null) throw new Error('tried to save image while newImageObj is null')
    const file = newImageObj
    setNewImage({
      id: newId,
      name: newName,
      file:
        newType === 'db' && file?.file
          ? {
              name: file.file.name,
              size: file.file.size,
              type: file.file.type,
              lastModified: file.file.lastModified,
              lastModifiedDate: new Date(file.file.lastModified),
              blob: new Blob([file.file], { type: file.file.type }),
            }
          : undefined,
      url: newType === 'url' ? newImageObj.src : undefined,
    })
    // save image id to image definition list
    setimageDefIds((prev) => [...prev, newId])
    // use setImage to set image id on parent card definition
    setImage({ image_id: newId })
    // setCreateNew(false)
    setNewId(false)
    // selectorFamily for getting blob from image id?
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImageObj((e.target.files && e.target.files[0] && { src: '', file: e.target.files[0] }) || null)
  }
  console.log(image)
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-1'>
        <ImageDefSelector value={image} setValue={setImage} />
        <Button
          size='sm'
          variant={newId ? 'destructive' : 'outline'}
          onClick={() => setNewId((x) => (!x ? randomId() : false))}
        >
          {newId ? 'cancel' : '+'}
        </Button>
      </div>
      <div
        className={cn('grid items-center gap-2 rounded border bg-gray-500/10 p-2 shadow', {
          'invisible h-0': !newId,
        })}
      >
        <Label>Create New Image Definition</Label>
        <Input
          className={cn({ 'invisible -my-5 h-0': newType !== 'db' })}
          id='image'
          type='file'
          onChange={handleFileChange}
        />
        <div className={cn('flex items-center gap-1', { 'invisible -my-5 h-0': newType !== 'url' })}>
          <Input id='image_url' type='text' placeholder='Image URL' />
          <Button
            size='sm'
            onClick={() => {
              try {
                const input = document.getElementById('image_url') as HTMLInputElement
                const url = new URL(input.value).toString()
                setNewImageObj({ src: url })
              } catch (e) {
                alert(e)
              }
            }}
          >
            Load
          </Button>
        </div>
        <div className='flex min-h-[64px] w-full items-center justify-center rounded border bg-gray-500/10'>
          {newImage ? (
            <a href={newImage.src} target='_blank' rel='noreferrer'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={newImage.src}
                width={64}
                height={64}
                alt='new image'
                className='border border-dashed border-white'
              />
            </a>
          ) : (
            <span className='text-white'>👁👄👁</span>
          )}
        </div>
        <Label htmlFor='image'>Source</Label>
        <Select onValueChange={(e) => setNewType(e === 'url' ? e : 'db')}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Local File' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='db'>From File</SelectItem>
            <SelectItem value='url'>From URL</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor='image_name'>Image Name</Label>
        <Input
          id='image_name'
          type='text'
          placeholder='Image Name'
          onChange={(e) => setNewName(e.target.value)}
          value={newName}
        />
        {newImage && (
          <Button onClick={handleNewImageDefinition} size='sm'>
            Save Image
          </Button>
        )}
      </div>
    </div>
  )
}

function ImageDefinition() {
  return (
    <div className='grid w-full items-center gap-1.5'>
      <Label htmlFor='image'>Image</Label>
      <Input id='image' type='file' />
    </div>
  )
}
function CreateNewImageDefinition() {
  return (
    <div className='grid w-full items-center gap-1.5'>
      <Button size='sm'>New Image</Button>
    </div>
  )
}
/**
 * table image
 * table segments
 * card size
 */
function TableManager() {
  return null
}

export function ImageDefSelector({
  value,
  setValue,
}: {
  value?: ImageDefinitionIdType
  setValue: (value: ImageDefinitionIdType) => void
}) {
  const [open, setOpen] = React.useState(false)
  const imageDefIds = useImageDefinitionIdsList()
  const imageDefValue = useImageDef({ image_id: value?.image_id || '' })
  console.log(imageDefValue)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='sm'>
          {imageDefValue.url ? (
            <div className='flex items-center justify-start gap-2'>
              <Check className={'mr-2 h-4 w-4 opacity-100'} />
              <a
                href={imageDefValue.url}
                target='_blank'
                rel='noreferrer'
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDefValue.url}
                  alt='image definition image'
                  width={32}
                  height={32}
                  className='border border-dashed border-white'
                />
              </a>
              {imageDefValue.name}
            </div>
          ) : (
            'Select Image...'
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full max-w-xs p-0'>
        <Command>
          {imageDefIds.length > 3 && <CommandInput placeholder='Search Images...' />}
          {imageDefIds.length < 1 && <CommandInput placeholder='No images' />}
          <CommandEmpty>No Images.</CommandEmpty>
          <CommandGroup>
            {imageDefIds.map((defId) => (
              <ImageDefCommandItem
                key={defId}
                image_id={defId}
                value={value?.image_id || ''}
                setValue={(v) => {
                  setValue({ image_id: v })
                  setOpen(false)
                }}
              />
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ImageDefCommandItem({
  image_id,
  setValue,
  value,
}: {
  image_id: string
  setValue: (value: string) => void
  value: string
}) {
  const imageDef = useImageDef({ image_id })
  return (
    <CommandItem
      key={image_id}
      value={image_id}
      onSelect={(currentValue) => {
        setValue(currentValue)
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDef.url}
          width={32}
          height={32}
          alt='image definition image'
          className='border-dashed border-white'
        />
        {imageDef.name}
        <Check className={cn('mr-2 h-4 w-4', value === image_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
