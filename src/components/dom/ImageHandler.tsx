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
  useImageDefUrl2,
  useImageDefinition,
  useImageDefinitionIds,
  useImageDefinitionIdsList,
  useImageDefinitionSet,
} from '@/src/state/assets'
import { Spinner } from '@/src/components/dom/Spinner'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import { UploadIcon } from '@radix-ui/react-icons'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Checkbox } from '../ui/checkbox'

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
    const fileName = newImageObj?.file?.name || newImageObj.src.split('/').pop()
    if (fileName) {
      setNewName(fileName)
    }
    if (newImageObj.file) {
      return {
        src: URL.createObjectURL(newImageObj.file),
        file: newImageObj,
      }
    }
    return newImageObj
  }, [newImageObj])
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
  // React.useLayoutEffect(() => {
  //   if (imageDefIds.length < 1) {
  //     setNewId(randomId())
  //   }
  // }, [imageDefIds])
  const [urlInput, setUrlInput] = React.useState('')
  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between gap-1 overflow-hidden pb-2'>
        <ImageDefCombobox value={image} setValue={setImage} />
        <Button
          size='sm'
          className='h-10'
          variant={newId ? 'destructive' : 'outline'}
          onClick={() => setNewId((x) => (!x ? randomId() : false))}
        >
          {newId ? 'back' : 'new'}
        </Button>
      </div>
      <div
        className={cn('grid items-center gap-2 rounded border bg-gray-500/10 shadow', {
          'invisible h-0': !newId,
          'p-2': newId,
        })}
      >
        <Label>Create New Image Definition</Label>
        <div
          className={cn('relative flex h-[52px] items-center justify-center rounded-xl', {
            'invisible -my-5 h-0': newType !== 'db',
          })}
        >
          <Input
            className='absolute inset-0 cursor-pointer text-clip rounded-lg border-2 border-dashed border-white/50 text-xs text-white/90 transition-colors duration-200 ease-in-out'
            id='image'
            type='file'
            onChange={handleFileChange}
          />
        </div>

        {newImageObj?.file?.name && (
          <>
            <Label size='2xs' htmlFor='image_url'>
              File Name
            </Label>
            <div className=' z-20 flex w-full overflow-x-auto whitespace-nowrap text-nowrap'>
              <div className='flex p-2 font-mono text-xs'>
                {newImageObj?.file?.name || newImageObj?.src.split('/').pop() || 'No File Selected'}
              </div>
            </div>
          </>
        )}
        <div className={cn('flex items-center gap-1', { 'invisible -my-5 h-0': newType !== 'url' })}>
          <Input
            className='overflow-scroll'
            id='image_url'
            type='text'
            placeholder='Image URL'
            onChange={(e) => setUrlInput(e.target.value)}
          />
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
        <div className='relative flex items-center justify-center rounded border bg-gray-500/10'>
          <ImageResizer image={newImage} setNewImageObj={setNewImageObj} />
        </div>
        <Label htmlFor='image_name'>Image Name</Label>
        <Input
          id='image_name'
          type='text'
          placeholder='Image Name'
          onChange={(e) => setNewName(e.target.value)}
          value={newName}
        />
        {newImage && (
          <Button onClick={handleNewImageDefinition} size='sm' className='animate-pulse'>
            Save Image
          </Button>
        )}
      </div>
      <ViewImage image_id={image?.image_id || ''} />
    </div>
  )
}

export function ViewImage({ image_id }: { image_id: string }) {
  const img = useImageDefUrl2(image_id)
  const src = img.url
  return (
    <div className='relative flex flex-col items-center justify-between gap-4 p-3'>
      <Label size='2xs'>Current Image</Label>
      <div className='grid w-full grid-cols-3 flex-wrap justify-between gap-4 px-2 font-mono text-xs'>
        <div>w: {img.width}px</div>
        <div>h: {img.height}px</div>
        <div>{img.size_KB} kB</div>
      </div>
      <div className='relative flex w-full items-center justify-center gap-2'>
        <div className='absolute inset-0 z-0 bg-checkered bg-size-md opacity-10'></div>
        <a
          href={src}
          target='_blank'
          rel='noreferrer'
          className='z-10 flex h-32 items-center justify-center overflow-hidden p-2'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt='current image' className='max-h-32 object-contain' />
        </a>
        {/* green crosshair to indicate center */}
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2'>
          <div className='absolute h-3 w-0.5 rounded bg-green-500'></div>
          <div className='absolute h-0.5 w-3 rounded bg-green-500'></div>
        </div>
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
      let newFileName = 'untitled'
      if (image.file && 'file' in image.file && image.file.file) {
        newFileName = image.file.file.name
      } else if (image.src) {
        newFileName = image.src.split('/').pop() || 'untitled'
      }
      setNewImageObj({ src: URL.createObjectURL(resBlob), file: new File([resBlob], newFileName) })
    } catch (e) {
      alert('Error resizing image')
      console.error(e)
    }
    setLoading(false)
  }
  if (!image) {
    return <span className='p-3 text-white/50'>👁👄👁</span>
  }

  return (
    <div className='relative flex flex-col items-center justify-between gap-4 p-3'>
      <div className='relative flex items-center gap-2'>
        <div className='absolute inset-0 z-0 bg-checkered bg-size-md opacity-10'></div>
        <a href={image.src} target='_blank' rel='noreferrer' className='z-10'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt='new image' className='object-contain shadow' />
        </a>
        {/* green crosshair to indicate center */}
        <div className='absolute inset-0 z-20 flex items-center justify-center gap-2'>
          <div className='absolute h-3 w-0.5 rounded bg-green-500'></div>
          <div className='absolute h-0.5 w-3 rounded bg-green-500'></div>
        </div>
      </div>
      <div className='flex w-full justify-between'>
        {loading ? (
          <div>
            <SpinnerLight />
          </div>
        ) : img.o.width > 512 && img.o.height > 512 ? (
          <div className='flex flex-col items-start justify-start gap-2'>
            <div className='animate-pulse text-sm text-red-500'>CHONKY IMAGE</div>
            <Button size='sm' onClick={handleResizeImageRequest}>
              RESIZE IMAGE
            </Button>
          </div>
        ) : (
          <div className='relative flex flex-col items-center justify-center gap-2 pr-5'>
            <img
              src='https://2.bp.blogspot.com/-_PLLVhFgJF4/VdMrrpv0ZXI/AAAAAAAATRM/cKxfSA7qbjg/s1600/impressive-very-nice.gif'
              alt='impressive, very nice'
              className='absolute h-20 rounded object-cover opacity-20'
            />
            <div className='z-20 flex flex-col items-center justify-center gap-2 text-center text-sm text-green-500'>
              GOOD SIZE
              <Check />
            </div>
          </div>
        )}
        <div className='w-1/2 px-2 font-mono text-xs'>
          SIZE
          <div>w: {img.o.width}px</div>
          <div>h: {img.o.height}px</div>
          <div>{img.size / 1000} kB</div>
        </div>
      </div>
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
  const [imgDef] = useImageDefinition(value?.image_id || '')
  const imageDefIds = useImageDefinitionIdsList()
  console.log(imgDef.name + imgDef.id)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='relative flex h-fit w-[79%] justify-between'
        >
          <React.Suspense fallback={<Spinner />}>
            <ImageDefSelectedItem image_id={value?.image_id || ''} />
          </React.Suspense>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs'>
        <Command>
          {imageDefIds.length > 3 && <CommandInput placeholder='Search Images...' />}
          {imageDefIds.length === 0 && <CommandGroup heading='No Images to choose from  ' />}
          {imageDefIds.length > 0 && <CommandEmpty>No Images Found</CommandEmpty>}
          <ScrollArea className='max-h-72 overflow-y-scroll'>
            <CommandGroup>
              {imageDefIds.map((defId) => (
                <React.Suspense fallback={<Spinner />} key={defId}>
                  <ImageDefCommandItem
                    key={defId}
                    image_id={defId}
                    value={value?.image_id || ''}
                    setValue={() => {
                      setValue({ image_id: defId })
                      setOpen(false)
                    }}
                  />
                </React.Suspense>
              ))}
            </CommandGroup>
          </ScrollArea>
          <CommandItem>
            <div className='flex w-full flex-wrap items-center justify-start gap-2 rounded bg-foreground/10 p-1 text-xs'>
              <div>Apply change to</div>
              <Button variant='outline' size='xs' className='flex items-center justify-start gap-2'>
                <Checkbox />
                <span>Image Map</span>
              </Button>
              <Button variant='outline' size='xs' className='flex items-center justify-start gap-2'>
                <Checkbox />
                <span>Bump Map</span>
              </Button>
              <Button variant='outline' size='xs' className='flex items-center justify-start gap-2'>
                <Checkbox />
                <span>Irid. Map</span>
              </Button>
            </div>
          </CommandItem>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ImageDefSelectedItem({ image_id }: { image_id: string }) {
  const imageDefValue = useImageDefUrl2(image_id)
  return (
    <>
      {imageDefValue.url ? (
        <div className='flex w-[90%] items-center justify-between gap-1'>
          <div className=' w-[90%] overflow-hidden text-left text-xs'>
            {imageDefValue.name || <span className='italic text-red-500/70'>image has no name</span>}
          </div>
          <a
            href={imageDefValue.url}
            target='_blank'
            rel='noreferrer'
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDefValue.url} alt='image definition image' className='size-6 object-contain' />
          </a>
        </div>
      ) : (
        'Select Image...'
      )}
    </>
  )
}

function ImageDefCommandItem({ image_id, setValue, value }: { image_id: string; setValue: () => void; value: string }) {
  const imageDef = useImageDefUrl({ image_id })
  return (
    <CommandItem
      value={imageDef.name}
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageDef.url} className='size-12 object-contain' alt='image definition image' />
        <div style={{ direction: 'rtl' }}>
          {imageDef.name || <span className='italic text-red-500/70'>image has no name</span>}
        </div>
        <Check className={cn('mr-2 h-4 w-4', value === image_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
