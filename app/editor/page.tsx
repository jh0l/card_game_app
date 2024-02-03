/* eslint-disable @next/next/no-img-element */
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  CardDefinitionType,
  CardInstanceIdType,
  ImageDefinitionIdType,
  TextureDefinitionIdType,
  TextureDefinitionType,
  TextureInstanceType,
  randomId,
  useCardDefinition,
  useCardDefinitionList,
  useCardDefinitionsListSet,
  useImageDefUrl,
  useImageDefinitionIds,
  useImageDefinitionIdsList,
  useImageDefinitionSet,
  useSetCardDefinition,
  useSetTextureDefinition,
  useTextureDefinition,
  useTextureDefinitionIds,
  useTextureDefinitionIdsList,
  useTextureDefinitionIdsListSet,
} from '@/src/state/assets'
import { PopoverAnchor } from '@radix-ui/react-popover'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Spinner } from '@/src/components/dom/Spinner'
import { Vec3 } from '@/src/lib/types'
import {
  ColumnSpacingIcon,
  ExternalLinkIcon,
  HeightIcon,
  RowSpacingIcon,
  SymbolIcon,
  WidthIcon,
} from '@radix-ui/react-icons'
import { useHandCardsList, useHandCardsListSet } from '@/src/state/room'

export default function Page() {
  // const Settings = true
  const { Configure } = useControls({ Configure: true })
  return (
    <main className='relative h-[100dvh]'>
      {Configure && <CardManager />}
      <GameClient />
    </main>
  )
}

/** cards definitions
 *    > array of TextureMesh references with position, rotation, scale
 *    > image reference
 *      > option to upload image with card definition
 *    > label, description, label style, description style
 *    > bump map reference
 *      > option to upload bump map with card definition
 *    > iridescent map reference
 *      > option to upload iridescent map with card definition
 *    material settings?
 */

function CardManager() {
  return (
    <div className='pointer-events-none absolute inset-0 z-20 flex flex-col items-end justify-end p-2'>
      <div className='pointer-events-auto flex h-[90%] w-full max-w-lg flex-col gap-2 overflow-y-scroll'>
        <div className='flex w-full flex-col gap-2 rounded border bg-zinc-900/10 p-2'>
          <h2 className='text-lg font-bold'>Hand</h2>
          <HandCards />
        </div>
        <div className='flex w-full flex-col gap-4 rounded border bg-zinc-500/10 p-3'>
          <h2 className='text-lg font-bold'>Card Definitions</h2>
          <CardDefinitionList />
          <CreateNewCardDefinition />
        </div>
        <div className='flex w-full flex-col gap-4 rounded border bg-zinc-500/10 p-3'>
          <h2 className='text-lg font-bold'>Texture Definitions</h2>
          <TextureDefinitionList />
          <AddTextureDefinition />
        </div>
        <div className='flex w-full flex-col gap-4 rounded border bg-zinc-500/10 p-3'>
          <h2 className='text-lg font-bold'>Images</h2>
          <ImageDefinitionList />
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

function CardDefinitionList() {
  const [cardDefIds, setCardIds] = useCardDefinitionList()
  const [newId, setNewId] = React.useState(() => randomId())
  const setCardDefinition = useSetCardDefinition(newId)
  const handleDelete = (id: string) => {
    setCardIds((x) => {
      return x.filter((x) => x !== id)
    })
  }
  const handleDuplicate = (card: CardDefinitionType) => {
    setCardIds((x) => {
      return [...x, newId]
    })
    setCardDefinition(() => ({ ...card, id: newId }))
    setNewId(randomId())
  }
  return (
    <>
      {cardDefIds.map((id) => (
        <React.Suspense key={id} fallback={<Spinner />}>
          <CardDefinition key={id} id={id} handleDelete={() => handleDelete(id)} handleDuplicate={handleDuplicate} />
        </React.Suspense>
      ))}
    </>
  )
}

function HandCards() {
  const [handCardIds, setHandCardIds] = useHandCardsList()
  return (
    <div className='grid w-full items-center gap-1.5'>
      <React.Suspense fallback={<Spinner />}>
        <CardDefComboBox
          value={''}
          setValue={(v) => setHandCardIds((x) => [...x, { def_id: v, inst_id: randomId() }])}
        />
      </React.Suspense>
      {handCardIds.map(({ def_id, inst_id }, i) => (
        <div key={inst_id}>
          <React.Suspense fallback={<Spinner />}>
            <CardHandInstance id={def_id} index={i} />
          </React.Suspense>
        </div>
      ))}
    </div>
  )
}

function CardHandInstance({ id, index }: { id: string; index: number }) {
  const setHandCardIds = useHandCardsListSet()
  const changeIndexCardDef = (newId: string) => {
    setHandCardIds((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], def_id: newId }
      return copy
    })
  }
  const deleteCard = () => {
    setHandCardIds((prev) => {
      const copy = [...prev]
      copy.splice(index, 1)
      return copy
    })
  }
  return (
    <div className='flex items-center gap-2'>
      <CardDefComboBox value={id} setValue={changeIndexCardDef} />
      <Button onClick={deleteCard} variant='destructive' size='sm'>
        &times;
      </Button>
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

function CardTexturePreview({ graphics }: { graphics: TextureInstanceType[] }) {
  return (
    <div className='flex max-w-24'>
      {graphics.map((texture, i) => (
        <div key={texture.inst_id}>
          <React.Suspense fallback={<Spinner />}>
            <TextureInstancePreview texture={texture} />
          </React.Suspense>
        </div>
      ))}
    </div>
  )
}

function TextureInstancePreview({ texture }: { texture: TextureInstanceType }) {
  const [textureDef] = useTextureDefinition(texture.texture_id)
  const imageDef = useImageDefUrl(textureDef.image)
  return <img src={imageDef.url} alt='.' className='h-8 object-contain pr-0.5' />
}

function TextureInstanceEditor({
  texture,
  setTexture,
  handleDelete,
  handleApplyNewIndex,
  index,
}: {
  texture: TextureInstanceType
  setTexture: (texture: TextureInstanceType) => void
  handleDelete: () => void
  handleApplyNewIndex: (index: number) => string
  index: number
}) {
  const setTextureId = (id: string) => {
    setTexture({ ...texture, texture_id: id })
  }
  const setTexturePosition = (i: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const copy = [...texture.position] as Vec3
    copy[i] = Number(event.target.value)
    setTexture({ ...texture, position: copy })
  }
  const setTextureRotation = (i: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const copy = [...texture.rotation] as Vec3
    copy[i] = Number(event.target.value)
    setTexture({ ...texture, rotation: copy })
  }
  const setTextureWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTexture({ ...texture, width: Number(event.target.value) })
  }
  const setTextureRenderOrderOffset = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTexture({ ...texture, renderOrderOffset: Number(event.target.value) })
  }
  const [newIndex, setNewIndex] = React.useState(index)
  const [error, setError] = React.useState('')
  const handleNewIndex = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewIndex(Number(event.target.value))
    setError('')
  }
  React.useEffect(() => {
    setNewIndex(index)
    setError('')
  }, [index])
  const applyNewIndex = () => {
    const _error = handleApplyNewIndex(newIndex)
    if (_error) {
      setError(_error)
    }
  }
  return (
    <div className='flex flex-col gap-2 rounded border bg-zinc-900/30 p-2'>
      <Label>Texture {index}</Label>
      <div className='flex gap-2'>
        <React.Suspense fallback={<Spinner />}>
          <TextureDefCombobox value={{ texture_id: texture.texture_id }} setValue={(x) => setTextureId(x.texture_id)} />
        </React.Suspense>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => {
            setTexture({ ...texture, texture_id: '' })
          }}
        >
          &times;
        </Button>
      </div>
      <div className='flex w-full gap-2'>
        <div className='w-1/2'>
          <Label htmlFor='position_x'>Position</Label>
          <div className='flex flex-col gap-1 pl-1'>
            <div className='flex items-center gap-2'>
              x <WidthIcon />
              <Input id='position_x' type='number' value={texture.position[0]} onChange={setTexturePosition(0)} />
            </div>
            <div className='flex items-center gap-2'>
              y <HeightIcon />
              <Input id='position_y' type='number' value={texture.position[1]} onChange={setTexturePosition(1)} />
            </div>
            <div className='flex items-center gap-2'>
              z <ExternalLinkIcon />
              <Input id='position_z' type='number' value={texture.position[2]} onChange={setTexturePosition(2)} />
            </div>
          </div>
        </div>
        <div className='w-1/2'>
          <Label htmlFor='rotation_x'>Rotation (radians)</Label>
          <div className='flex flex-col gap-1 pl-1'>
            <div className='flex items-center gap-2'>
              x <RowSpacingIcon />
              <Input id='rotation_x' type='number' value={texture.rotation[0]} onChange={setTextureRotation(0)} />
            </div>
            <div className='flex items-center gap-2'>
              y <ColumnSpacingIcon />
              <Input id='rotation_y' type='number' value={texture.rotation[1]} onChange={setTextureRotation(1)} />
            </div>
            <div className='flex items-center gap-2'>
              z <SymbolIcon />
              <Input id='rotation_z' type='number' value={texture.rotation[2]} onChange={setTextureRotation(2)} />
            </div>
          </div>
        </div>
      </div>
      <div className='flex gap-2'>
        <div className='flex w-1/2 flex-col gap-2'>
          <Label htmlFor='width'>Width</Label>
          <Input id='width' type='number' value={texture.width} onChange={setTextureWidth} />
        </div>
        <div className='flex w-1/2 flex-col gap-2'>
          <Label htmlFor='renderOrderOffset'>Render Order Offset</Label>
          <Input
            id='renderOrderOffset'
            type='number'
            value={texture.renderOrderOffset}
            onChange={setTextureRenderOrderOffset}
          />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='texture_index'>Texture Index</Label>
        <div className='flex gap-2'>
          <Input id='texture_index' type='number' value={newIndex} onChange={handleNewIndex} />
          {newIndex != index && (
            <Button variant='outline' onClick={() => applyNewIndex()}>
              apply
            </Button>
          )}
        </div>
        {error && <Label className='text-red-500'>That is not correct ({error}).</Label>}
      </div>
      <Button variant='destructive' size='sm' onClick={handleDelete}>
        Delete
      </Button>
    </div>
  )
}

function CardDefinitionGraphicsArray({
  value,
  setValue,
  handleDelete,
  setAll,
}: {
  value: TextureInstanceType[]
  setValue: (index: number, value: TextureInstanceType) => void
  setAll: (value: TextureInstanceType[]) => void
  handleDelete: (index: number) => void
}) {
  const handleAddTexture = () => {
    setValue(value.length, {
      inst_id: randomId(),
      texture_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
    })
  }
  const handleReorderTextureIndexes = (index: number) => (newIndex: number) => {
    // reorder textures so that the texture at `index` is moved to `newIndex`
    // and all other textures are shifted to make room
    if (newIndex < 0 || newIndex >= value.length) return 'index out of bounds'
    const copy = [...value]
    const moved = copy.splice(index, 1)
    copy.splice(newIndex, 0, moved[0])
    setAll(copy)
    return ''
  }
  return (
    <div className='mt-1 flex flex-col gap-2'>
      {value.map((texture, i) => (
        <div key={texture.inst_id}>
          <React.Suspense fallback={<Spinner />}>
            <TextureInstanceEditor
              texture={texture}
              setTexture={(v) => setValue(i, v)}
              handleDelete={() => handleDelete(i)}
              handleApplyNewIndex={handleReorderTextureIndexes(i)}
              index={i}
            />
          </React.Suspense>
        </div>
      ))}
      <Button className='mt-2 w-full' variant='outline' size='sm' onClick={handleAddTexture}>
        Add Texture
      </Button>
    </div>
  )
}

function CardDefinition({
  id,
  handleDelete,
  handleDuplicate,
}: {
  id: string
  handleDelete: () => void
  handleDuplicate: (card: CardDefinitionType) => void
}) {
  const [cardDefinitionState, setCardDefinition] = useCardDefinition(id)
  const setDefValue = (key: keyof CardDefinitionType) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setCardDefinition((prev) => ({ ...prev, [key]: event.target.value }))
  const setGraphicsValue = (index: number, value: TextureInstanceType) =>
    setCardDefinition((prev) => {
      const copy = { ...prev }
      const graphics = [...copy.graphics]
      graphics[index] = value
      copy.graphics = graphics
      return copy
    })
  const setAllGraphics = (newGraphics: TextureInstanceType[]) => {
    setCardDefinition((prev) => {
      const copy = { ...prev }
      copy.graphics = newGraphics
      return copy
    })
  }
  const handleDeleteGfx = (index: number) => {
    setCardDefinition((prev) => {
      const copy = { ...prev }
      const graphics = [...copy.graphics]
      graphics.splice(index, 1)
      copy.graphics = graphics
      return copy
    })
  }
  const setHandCardIds = useHandCardsListSet()
  const handleAddToHand = () => {
    setHandCardIds((prev) => [...prev, { def_id: id, inst_id: randomId() }])
  }
  const _handleDuplicate = () => {
    handleDuplicate(cardDefinitionState)
  }
  return (
    <div className='relative w-full rounded border bg-gray-700/20 p-2 pb-4'>
      <span className='absolute bottom-0 right-1 flex font-mono text-xs text-white/10'>id: {id}</span>
      <div className='flex items-center gap-2'>
        <Popover>
          <PopoverTrigger asChild>
            <div className='flex w-full cursor-pointer items-center gap-2'>
              <div className='w-full'>
                <div className='flex w-full items-center justify-start gap-3'>
                  <CardTexturePreview graphics={cardDefinitionState.graphics} />
                  <Label htmlFor='name'>
                    {cardDefinitionState.name || <span className='italic text-red-500/70'>card has no name</span>}
                  </Label>
                </div>
              </div>
              <Button size='sm' variant='outline'>
                edit
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-lg p-0'>
            <ScrollArea className='relative h-[600px] w-[450px]'>
              <div className='absolute bottom-14 flex w-full justify-center'>👁👄👁</div>

              <div className='relative grid items-center gap-3 bg-zinc-900 p-2 pr-3'>
                <div>
                  <Label htmlFor='name'>Name</Label>
                  <Input id='name' type='text' value={cardDefinitionState.name} onChange={setDefValue('name')} />
                </div>
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
                  <Input
                    id='health'
                    type='number'
                    value={cardDefinitionState.health}
                    onChange={setDefValue('health')}
                  />
                </div>
                <div>
                  <Label htmlFor='attack'>Attack</Label>
                  <Input
                    id='attack'
                    type='number'
                    value={cardDefinitionState.attack}
                    onChange={setDefValue('attack')}
                  />
                </div>
                <div>
                  <Label htmlFor='defence'>Defence</Label>
                  <Input
                    id='defence'
                    type='number'
                    value={cardDefinitionState.defence}
                    onChange={setDefValue('defence')}
                  />
                </div>
                {/* <div>
            <Label htmlFor='label'>Denomination</Label>
            <Input id='label' type='text' value={cardDefinitionState.label} onChange={setDefValue('label')} />
          </div> */}
                <div className='flex flex-col'>
                  <Label>Textures</Label>
                  <CardDefinitionGraphicsArray
                    value={cardDefinitionState.graphics}
                    setValue={setGraphicsValue}
                    handleDelete={handleDeleteGfx}
                    setAll={setAllGraphics}
                  />
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
                <Button onClick={_handleDuplicate} size='sm' variant='outline'>
                  Duplicate Definition
                </Button>
                <Button onClick={handleAddToHand} variant='outline'>
                  Add to hand
                </Button>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function ImagePreview({ image }: { image?: ImageDefinitionIdType }) {
  const imageDef = useImageDefUrl(image || { image_id: '' })
  return <img src={imageDef.url} alt='.' className='h-8 object-contain pr-0.5' />
}

function TextureDefinitionList() {
  const [textureDefIds, setTextureIds] = useTextureDefinitionIds()
  const [newId, setNewId] = React.useState(() => randomId())
  const setTexDefinition = useSetTextureDefinition(newId)
  const handleDelete = (id: string) => {
    setTextureIds((x) => {
      return x.filter((x) => x !== id)
    })
  }
  const handleDuplicate = (texture: TextureDefinitionType) => {
    setTextureIds((x) => {
      return [...x, newId]
    })
    setTexDefinition(() => ({ ...texture, id: newId }))
    setNewId(randomId())
  }
  return (
    <>
      {textureDefIds.map((id) => (
        <TextureDefinition key={id} id={id} handleDelete={() => handleDelete(id)} handleDuplicate={handleDuplicate} />
      ))}
    </>
  )
}

function TextureImagesValidator({ textureDef }: { textureDef: TextureDefinitionType }) {
  const imageDef = useImageDefUrl(textureDef.image)
  const bumpMapDef = useImageDefUrl(textureDef.bumpMap)
  const iridescentMapDef = useImageDefUrl(textureDef.iridescentMap)
  const matchRes = React.useMemo(() => {
    if (
      imageDef.width === bumpMapDef.width &&
      imageDef.height === bumpMapDef.height &&
      imageDef.width === iridescentMapDef.width &&
      imageDef.height === iridescentMapDef.height
    ) {
      return <span className='text-green-500'>match ✅</span>
    }
    return <span className='text-red-500'>wonky ❌</span>
  }, [imageDef, bumpMapDef, iridescentMapDef])
  return (
    <div className='flex'>
      <div className='w-1/2 items-center justify-center  p-2 font-mono'>
        <div>
          imag: {imageDef.width}x{imageDef.height}
        </div>
        <div>
          bump: {bumpMapDef.width}x{bumpMapDef.height}
        </div>
        <div>
          irid: {iridescentMapDef.width}x{iridescentMapDef.height}
        </div>
      </div>
      <div className='flex w-1/2 items-center justify-center p-2'>
        <div>
          resolutions: <span className='font-bold'>{matchRes}</span>
        </div>
      </div>
    </div>
  )
}

function TextureDefinition({
  id,
  handleDelete,
  handleDuplicate,
}: {
  id: string
  handleDelete: () => void
  handleDuplicate: (texture: TextureDefinitionType) => void
}) {
  const [textureDef, setTextureDef] = useTextureDefinition(id)
  const setDefValue = (key: keyof TextureDefinitionType) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setTextureDef((prev) => ({ ...prev, [key]: event.target.value }))
  const setDefMapValue = (key: keyof TextureDefinitionType) => (image: ImageDefinitionIdType) =>
    setTextureDef((prev) => ({ ...prev, [key]: image }))
  const _handleDuplicate = () => {
    handleDuplicate(textureDef)
  }
  return (
    <div className='relative w-full rounded border bg-gray-700/20 p-2 pb-4'>
      <span className='absolute bottom-0 right-1 flex font-mono text-xs text-white/10'>id: {id}</span>
      <div className='flex items-center gap-2'>
        <Popover>
          <PopoverTrigger asChild>
            <div className='flex w-full cursor-pointer items-center gap-2'>
              <div className='w-full'>
                <div className='flex w-full items-center justify-start gap-3'>
                  <div className='flex max-w-24'>
                    <React.Suspense fallback={<Spinner />}>
                      <ImagePreview image={textureDef.image} />
                      <ImagePreview image={textureDef.bumpMap} />
                      <ImagePreview image={textureDef.iridescentMap} />
                    </React.Suspense>
                  </div>
                  <Label htmlFor='name'>
                    {textureDef.name || <span className='italic text-red-500/70'>texture has no name</span>}
                  </Label>
                </div>
              </div>
              <Button size='sm' variant='outline'>
                edit
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-lg p-0'>
            <div className='relative grid items-center gap-3 bg-zinc-900 p-4'>
              <div>
                <Label htmlFor='name'>Name</Label>
                <Input id='name' type='text' value={textureDef.name} onChange={setDefValue('name')} />
              </div>
              <div>
                <Label htmlFor='image'>Image</Label>
                <ImageHandler image={textureDef.image} setImage={setDefMapValue('image')} />
              </div>
              <div>
                <Label htmlFor='bumpMap'>Bump Map</Label>
                <ImageHandler image={textureDef.bumpMap} setImage={setDefMapValue('bumpMap')} />
              </div>
              <div>
                <Label htmlFor='iridescentMap'>Iridescent Map</Label>
                <ImageHandler image={textureDef.iridescentMap} setImage={setDefMapValue('iridescentMap')} />
              </div>
              <div>
                <TextureImagesValidator textureDef={textureDef} />
              </div>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => {
                  confirm('Are you sure you want to delete this texture?\nThere is no undo (yet)') && handleDelete()
                }}
              >
                Delete Texture
              </Button>
              <Button onClick={_handleDuplicate} size='sm' variant='outline'>
                Duplicate Definition
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
function AddTextureDefinition() {
  const setTextureIds = useTextureDefinitionIdsListSet()
  const handleNewTexture = () => {
    setTextureIds((x) => [...x, randomId()])
  }
  return (
    <Button size='sm' onClick={handleNewTexture}>
      New Texture
    </Button>
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
  const [, setimageDefIds] = useImageDefinitionIds()
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
                className='h-16 w-16 border object-contain'
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

function ImageDefinitionList() {
  const imageDefIds = useImageDefinitionIdsList()
  return (
    <>
      {imageDefIds.map((id) => (
        <React.Suspense key={id} fallback={<Spinner />}>
          <ImageDefinition key={id} id={id} />
        </React.Suspense>
      ))}
    </>
  )
}

function ImageDefinition({ id }: { id: string }) {
  // option to choose existing image or upload a new image or use a URL
  // setImage is a function that sets the image
  const imageDef = useImageDefUrl({ image_id: id })
  const setImageDef = useImageDefinitionSet(id)
  const [newName, setNewName] = React.useState(imageDef.name)
  const [newType, setNewType] = React.useState<'url' | 'db'>('db')
  const [newImageObj, setNewImageObj] = React.useState<{ src: string; file?: File } | null>(null)
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
    if (newImageObj === null) throw new Error('tried to save image while newImageObj is null')
    const file = newImageObj
    setImageDef((x) => ({
      ...x,
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
    }))
    // save image id to image definition list
    // selectorFamily for getting blob from image id?
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImageObj((e.target.files && e.target.files[0] && { src: '', file: e.target.files[0] }) || null)
  }
  const applyNameChange = () => {
    setImageDef((x) => ({ ...x, name: newName }))
  }
  const handleCancelNewDef = () => {
    setNewImageObj(null)
  }
  return (
    <div className='relative flex flex-col gap-1 rounded border bg-gray-700/20 p-2 pb-3'>
      <span className='absolute bottom-0 right-1 flex font-mono text-xs text-white/10'>id: {id}</span>
      <div className='flex items-center gap-1'>
        <Popover>
          <PopoverAnchor className='w-full'>
            <div className='flex w-full items-center justify-start gap-3'>
              <img src={imageDef.url} className='h-12 w-12 object-contain' alt='image definition image' />
              <Label htmlFor='name'>
                {imageDef.name || <span className='italic text-red-500/70'>image has no name</span>}
              </Label>
            </div>
          </PopoverAnchor>
          <PopoverTrigger asChild>
            <Button size='sm' variant='outline'>
              edit
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-lg'>
            <div className='relative grid w-full items-center gap-3'>
              <Label>Replace Image</Label>
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
                {newImage || imageDef.url ? (
                  <a href={newImage?.src || imageDef.url} target='_blank' rel='noreferrer'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newImage?.src || imageDef.url} alt='new image' className='h-16 w-16 object-contain' />
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
              <div className='flex gap-2'>
                <Input
                  id='image_name'
                  type='text'
                  placeholder='Image Name'
                  onChange={(e) => setNewName(e.target.value)}
                  value={newName}
                />
                {newName !== imageDef.name && (
                  <Button onClick={applyNameChange} size='sm' variant='outline'>
                    apply
                  </Button>
                )}
              </div>
              {newImage && (
                <div className='flex w-full gap-2'>
                  <Button onClick={handleCancelNewDef} size='sm'>
                    Cancel
                  </Button>
                  <Button onClick={handleNewImageDefinition} size='sm'>
                    Save Image
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
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

function CardDefComboBox({ value, setValue }: { value?: string; setValue: (value: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [cardDefIds] = useCardDefinitionList()
  const [cardDefValue] = useCardDefinition(value || '')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='sm'>
          {value ? (
            <div className='flex w-1/2 items-center justify-start gap-6'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <CardTexturePreview graphics={cardDefValue.graphics} />
              {cardDefValue.name || <span className='italic text-red-500/70'>card has no name</span>}
            </div>
          ) : (
            'Add Card...'
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full max-w-xs p-0'>
        <Command>
          {cardDefIds.length > 3 && <CommandInput placeholder='Search Cards...' />}
          {cardDefIds.length < 1 && <CommandInput placeholder='No cards' />}
          <CommandEmpty>No Cards.</CommandEmpty>
          <CommandGroup>
            {cardDefIds.map((defId) => (
              <React.Suspense key={defId} fallback={<Spinner />}>
                <CardDefCommandItem
                  key={defId}
                  id={defId}
                  value={value || ''}
                  setValue={(v) => {
                    setValue(v)
                    setOpen(false)
                  }}
                />
              </React.Suspense>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function CardDefCommandItem({ id, setValue, value }: { id: string; setValue: (value: string) => void; value: string }) {
  const [cardDef] = useCardDefinition(id)
  return (
    <CommandItem
      key={id}
      value={id}
      onSelect={(currentValue) => {
        setValue(currentValue)
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <CardTexturePreview graphics={cardDef.graphics} />
        {cardDef.name || <span className='italic text-red-500/70'>card has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}

function TextureDefCombobox({
  value,
  setValue,
}: {
  value?: TextureDefinitionIdType
  setValue: (value: TextureDefinitionIdType) => void
}) {
  const [open, setOpen] = React.useState(false)
  const textureDefIds = useTextureDefinitionIdsList()
  const [textureDef] = useTextureDefinition(value?.texture_id || '')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='sm'>
          {textureDef.image.image_id ? (
            <div className='flex items-center justify-start gap-2'>
              <Check className={'mr-2 h-4 w-4 opacity-100'} />
              <div className='flex'>
                <ImagePreview image={textureDef.image} />
                <ImagePreview image={textureDef.bumpMap} />
                <ImagePreview image={textureDef.iridescentMap} />
              </div>

              {textureDef.name || <span className='italic text-red-500/70'>texture has no name</span>}
            </div>
          ) : (
            'Select Texture...'
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full max-w-xs p-0'>
        <Command>
          {textureDefIds.length > 3 && <CommandInput placeholder='Search Textures...' />}
          {textureDefIds.length < 1 && <CommandInput placeholder='No textures' />}
          <CommandEmpty>No Textures.</CommandEmpty>
          <CommandGroup>
            {textureDefIds.map((defId) => (
              <TextureDefCommandItem
                key={defId}
                texture_id={defId}
                value={value?.texture_id || ''}
                setValue={() => {
                  setValue({ texture_id: defId })
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

function TextureDefCommandItem({
  texture_id,
  setValue,
  value,
}: {
  texture_id: string
  setValue: () => void
  value: string
}) {
  const [textureDef] = useTextureDefinition(texture_id)
  return (
    <CommandItem
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        <div className='flex'>
          <ImagePreview image={textureDef.image} />
          <ImagePreview image={textureDef.bumpMap} />
          <ImagePreview image={textureDef.iridescentMap} />
        </div>
        {textureDef.name || <span className='italic text-red-500/70'>texture has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === texture_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
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
                <img src={imageDefValue.url} alt='image definition image' className='h-12 w-12 object-contain' />
              </a>
              {imageDefValue.name || <span className='italic text-red-500/70'>image has no name</span>}
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
        <img src={imageDef.url} className='h-12 w-12 object-contain' alt='image definition image' />
        {imageDef.name || <span className='italic text-red-500/70'>image has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === image_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
