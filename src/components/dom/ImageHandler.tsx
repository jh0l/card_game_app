/* eslint-disable @next/next/no-img-element */
'use client'
import * as React from 'react'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'

import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/src/lib/utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  ImageDefinitionIdType,
  randomId,
  useImageDefUrl,
  useImageDefinitionIds,
  useImageDefinitionIdsList,
  useImageDefinitionSet,
} from '@/src/state/assets'
import { Spinner } from '@/src/components/dom/Spinner'
import SpinnerLight from './SpinnerLight'

export function ImageHandler({
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
  React.useEffect(() => {
    if (imageDefIds.length < 1) {
      setNewId(randomId())
    }
  }, [imageDefIds])
  const [urlInput, setUrlInput] = React.useState('')
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-1'>
        <React.Suspense fallback={<Spinner />}>
          <ImageDefCombobox value={image} setValue={setImage} />
        </React.Suspense>
        <Button
          size='sm'
          variant={newId ? 'destructive' : 'outline'}
          onClick={() => setNewId((x) => (!x ? randomId() : false))}
        >
          {newId ? 'cancel' : 'new'}
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
          <Input id='image_url' type='text' placeholder='Image URL' onChange={(e) => setUrlInput(e.target.value)} />
          <Button
            size='sm'
            onClick={() => {
              try {
                const url = new URL(urlInput).toString()
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
          <ImageResizer image={newImage} setNewImageObj={setNewImageObj} />
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
interface ResizeImageProps {
  image:
    | {
        src: string
        file?: File | undefined
      }
    | {
        src: string
        file: {
          src: string
          file?: File | undefined
        }
      }
    | null
  setNewImageObj: (f: { src: string; file?: File }) => void
}

function ImageResizer({ image, setNewImageObj }: ResizeImageProps) {
  const [img, setDomImage] = React.useState<{ o: HTMLImageElement; size: number }>({ o: new Image(), size: 0 })
  React.useEffect(() => {
    const getImageProps = async () => {
      if (!image) return { width: 0, height: 0 }
      const img = new Image()
      img.src = image.src
      await new Promise((resolve) => (img.onload = resolve))
      const xhr = new XMLHttpRequest()
      xhr.open('GET', image.src, true)
      xhr.responseType = 'blob'
      xhr.onload = function () {
        const blob = xhr.response
        setDomImage({ o: img, size: blob.size })
      }
      xhr.send()
    }
    getImageProps()
  }, [image])
  const [loading, setLoading] = React.useState(false)
  const handleResizeImageRequest = async () => {
    setLoading(true)
    try {
      if (!image) return
      // use sharp api to resize image
      const formData = new FormData()
      // if file does not exist, create file
      const blob = await fetch(image.src).then((r) => r.blob())
      formData.append('file', blob, image.src.split('/').pop() || 'untitled')

      // get minimum of image dimensions then get ratio of w/h, then so minimum is 512, then get new dimensions
      const min = Math.min(img.o.width, img.o.height)
      const ratio = img.o.width / img.o.height
      const newWidth = min > 512 ? 512 : min
      const newHeight = min > 512 ? 512 / ratio : min
      formData.append('width', newWidth.toString())
      formData.append('height', newHeight.toString())
      const res = await fetch('/api/resize', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        alert('Error resizing image')
        return
      }
      const resBlob = await res.blob()
      const newFileName = image.src.split('/').pop() || 'untitled'
      setNewImageObj({ src: URL.createObjectURL(resBlob), file: new File([resBlob], newFileName) })
    } catch (e) {
      alert('Error resizing image')
      console.error(e)
    }
    setLoading(false)
  }
  if (!image) {
    return <span className='text-white/50'>👁👄👁 no image</span>
  }

  return (
    <div className='relative flex h-52 w-full items-center justify-between gap-4 p-3'>
      <div className='flex items-center gap-2'>
        <div className='text-xs'>
          <div>Details:</div>
          <div>
            {img.o.width}w &times; {img.o.height}h
          </div>
          <div>{img.size / 1000} kB</div>
        </div>
        <a href={image.src} target='_blank' rel='noreferrer'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt='new image' className='max-h-40 max-w-40 object-contain shadow' />
        </a>
      </div>
      {loading ? (
        <div>
          <SpinnerLight />
        </div>
      ) : img.o.width > 512 && img.o.height > 512 ? (
        <div className='flex flex-col items-center justify-center gap-2 pr-5'>
          <div className='animate-pulse text-sm text-red-500'>CHONKY IMAGE ALERT</div>
          <Button size='sm' onClick={handleResizeImageRequest}>
            RESIZE IMAGE
          </Button>
        </div>
      ) : (
        <div className='relative flex flex-col items-center justify-center gap-2 pr-5'>
          <img
            src='https://2.bp.blogspot.com/-_PLLVhFgJF4/VdMrrpv0ZXI/AAAAAAAATRM/cKxfSA7qbjg/s1600/impressive-very-nice.gif'
            alt='impressive, very nice'
            className='absolute w-36 rounded object-cover opacity-20'
          />
          <div className='z-20 text-sm text-green-500'>
            Image is a good size
            <br />
            save image
          </div>
        </div>
      )}
    </div>
  )
}

function ImageDefCombobox({
  value,
  setValue,
}: {
  value?: ImageDefinitionIdType
  setValue: (value: ImageDefinitionIdType) => void
}) {
  const [open, setOpen] = React.useState(false)
  const imageDefIds = useImageDefinitionIdsList()
  const imageDefValue = useImageDefUrl({ image_id: value?.image_id || '' })
  if (imageDefIds.length < 1) return null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='sm'>
          {imageDefValue.url ? (
            <div className='flex items-center justify-start gap-2'>
              <Check className={'mr-2 size-4 opacity-100'} />
              <a
                href={imageDefValue.url}
                target='_blank'
                rel='noreferrer'
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDefValue.url} alt='image definition image' className='size-12 object-contain' />
              </a>
              {imageDefValue.name || <span className='italic text-red-500/70'>image has no name</span>}
            </div>
          ) : (
            'Select Image...'
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs'>
        <Command>
          {imageDefIds.length > 3 && <CommandInput placeholder='Search Images...' />}
          {imageDefIds.length === 0 && <CommandGroup heading='No Images to choose from  ' />}
          {imageDefIds.length > 1 && <CommandEmpty>No Images Found</CommandEmpty>}
          <CommandGroup>
            {imageDefIds.map((defId) => (
              <ImageDefCommandItem
                key={defId}
                image_id={defId}
                value={value?.image_id || ''}
                setValue={() => {
                  setValue({ image_id: defId })
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

function ImageDefCommandItem({ image_id, setValue, value }: { image_id: string; setValue: () => void; value: string }) {
  const imageDef = useImageDefUrl({ image_id })
  return (
    <CommandItem
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageDef.url} className='size-12 object-contain' alt='image definition image' />
        {imageDef.name || <span className='italic text-red-500/70'>image has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === image_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
