/* eslint-disable @next/next/no-img-element */
'use client'
import * as React from 'react'
import { useControls } from 'leva'
// import GameClient from '@/src/components/GameClient'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import dynamic from 'next/dynamic'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })
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
  ImageDefinitionIdType,
  GraphicDefinitionIdType,
  GraphicDefinitionType,
  GraphicInstanceType,
  randomId,
  useCardDefinition,
  useCardDefinitionList,
  useCardDefinitionsListSet,
  useImageDefUrl,
  useImageDefinitionIdsList,
  useImageDefinitionSet,
  useSetCardDefinition,
  useGraphicDefinitionSet,
  useGraphicDefinition,
  useGraphicDefinitionIds,
  useGraphicDefinitionIdsList,
  useGraphicDefinitionIdsListSet,
  ImageDefinitionUrl,
} from '@/src/state/assets'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Spinner } from '@/src/components/dom/Spinner'
import { Vec3 } from '@/src/lib/types'
import {
  ColumnSpacingIcon,
  EnterFullScreenIcon,
  ExternalLinkIcon,
  HeightIcon,
  RowSpacingIcon,
  SymbolIcon,
  WidthIcon,
} from '@radix-ui/react-icons'
import { useCardActiveSet, useHandCardsList, useHandCardsListSet } from '@/src/state/room'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { ImageHandler } from '../../src/components/dom/ImageHandler'

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
 *    > array of GraphicMesh references with position, rotation, scale
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
  const setCardActive = useCardActiveSet()
  React.useEffect(() => {
    setCardActive(false)
  }, [setCardActive])
  return (
    <div className='pointer-events-none absolute inset-0 z-20 flex flex-col items-end justify-end p-2'>
      <div className='pointer-events-auto flex h-[90%] w-full max-w-lg flex-col gap-2 overflow-y-scroll bg-zinc-900/80'>
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
          <h2 className='text-lg font-bold'>Graphic Definitions</h2>
          <GraphicDefinitionList />
          <AddGraphicDefinition />
        </div>
        <div className='flex w-full flex-col gap-4 rounded border bg-zinc-500/10 p-3'>
          <h2 className='text-lg font-bold'>Images</h2>
          <ImageDefinitionList />
        </div>
        <div className='flex w-full flex-col gap-2 rounded border bg-background p-3'>
          <h2 className='text-lg font-bold'>Table</h2>
          <TableManager />
        </div>
        <div className='flex justify-center py-96'>
          <div></div>
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

function CardGraphicPreview({ graphics }: { graphics: GraphicInstanceType[] }) {
  return (
    <div className='flex max-w-24'>
      {graphics.map((graphic, i) => (
        <div key={graphic.inst_id}>
          <React.Suspense fallback={<Spinner />}>
            <GraphicInstancePreview graphic={graphic} />
          </React.Suspense>
        </div>
      ))}
    </div>
  )
}

function GraphicInstancePreview({ graphic }: { graphic: GraphicInstanceType }) {
  const [graphicDef] = useGraphicDefinition(graphic.graphic_id)
  const imageDef = useImageDefUrl(graphicDef.image)
  return <img src={imageDef.url} alt='.' className='h-8 object-contain pr-0.5' />
}

function GraphicInstanceEditor({
  graphic,
  setGraphic,
  handleDelete,
  handleApplyNewIndex,
  index,
}: {
  graphic: GraphicInstanceType
  setGraphic: (graphic: GraphicInstanceType) => void
  handleDelete: () => void
  handleApplyNewIndex: (index: number) => string
  index: number
}) {
  const setGraphicId = (id: string) => {
    setGraphic({ ...graphic, graphic_id: id })
  }
  const setGraphicPosition = (i: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const copy = [...graphic.position] as Vec3
    copy[i] = Number(event.target.value)
    setGraphic({ ...graphic, position: copy })
  }
  const setGraphicRotation = (i: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const copy = [...graphic.rotation] as Vec3
    copy[i] = Number(event.target.value)
    setGraphic({ ...graphic, rotation: copy })
  }
  const setGraphicWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGraphic({ ...graphic, width: Number(event.target.value) })
  }
  const setGraphicRenderOrderOffset = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGraphic({ ...graphic, renderOrderOffset: Number(event.target.value) })
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
      <Label>Graphic {index}</Label>
      <div className='flex gap-2'>
        <React.Suspense fallback={<Spinner />}>
          <GraphicDefCombobox value={{ graphic_id: graphic.graphic_id }} setValue={(x) => setGraphicId(x.graphic_id)} />
        </React.Suspense>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => {
            setGraphic({ ...graphic, graphic_id: '' })
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
              <Input
                id='position_x'
                type='number'
                defaultValue={graphic.position[0]}
                onChange={setGraphicPosition(0)}
              />
            </div>
            <div className='flex items-center gap-2'>
              y <HeightIcon />
              <Input
                id='position_y'
                type='number'
                defaultValue={graphic.position[1]}
                onChange={setGraphicPosition(1)}
              />
            </div>
            <div className='flex items-center gap-2'>
              z <ExternalLinkIcon />
              <Input
                id='position_z'
                type='number'
                defaultValue={graphic.position[2]}
                onChange={setGraphicPosition(2)}
              />
            </div>
          </div>
        </div>
        <div className='w-1/2'>
          <Label htmlFor='rotation_x'>Rotation (radians)</Label>
          <div className='flex flex-col gap-1 pl-1'>
            <div className='flex items-center gap-2'>
              x <RowSpacingIcon />
              <Input
                id='rotation_x'
                type='number'
                defaultValue={graphic.rotation[0]}
                onChange={setGraphicRotation(0)}
              />
            </div>
            <div className='flex items-center gap-2'>
              y <ColumnSpacingIcon />
              <Input
                id='rotation_y'
                type='number'
                defaultValue={graphic.rotation[1]}
                onChange={setGraphicRotation(1)}
              />
            </div>
            <div className='flex items-center gap-2'>
              z <SymbolIcon />
              <Input
                id='rotation_z'
                type='number'
                defaultValue={graphic.rotation[2]}
                onChange={setGraphicRotation(2)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className='flex gap-2'>
        <div className='flex w-1/2 flex-col gap-2'>
          <Label htmlFor='width'>Width</Label>
          <Input id='width' type='number' defaultValue={graphic.width} onChange={setGraphicWidth} />
        </div>
        <div className='flex w-1/2 flex-col gap-2'>
          <Label htmlFor='renderOrderOffset'>Render Order Offset</Label>
          <Input
            id='renderOrderOffset'
            type='number'
            defaultValue={graphic.renderOrderOffset}
            onChange={setGraphicRenderOrderOffset}
          />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='graphic_index'>Graphic Index</Label>
        <div className='flex gap-2'>
          <Input id='graphic_index' type='number' defaultValue={newIndex} onChange={handleNewIndex} />
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
  value: GraphicInstanceType[]
  setValue: (index: number, value: GraphicInstanceType) => void
  setAll: (value: GraphicInstanceType[]) => void
  handleDelete: (index: number) => void
}) {
  const handleAddGraphic = () => {
    setValue(value.length, {
      inst_id: randomId(),
      graphic_id: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      width: 1,
      renderOrderOffset: 0,
      enabled: true,
      label: '',
    })
  }
  const handleReorderGraphicIndexes = (index: number) => (newIndex: number) => {
    // reorder graphics so that the graphic at `index` is moved to `newIndex`
    // and all other graphics are shifted to make room
    if (newIndex < 0 || newIndex >= value.length) return 'index out of bounds'
    const copy = [...value]
    const moved = copy.splice(index, 1)
    copy.splice(newIndex, 0, moved[0])
    setAll(copy)
    return ''
  }
  return (
    <div className='mt-1 flex flex-col gap-2'>
      {value.map((graphic, i) => (
        <div key={graphic.inst_id}>
          <React.Suspense fallback={<Spinner />}>
            <GraphicInstanceEditor
              graphic={graphic}
              setGraphic={(v) => setValue(i, v)}
              handleDelete={() => handleDelete(i)}
              handleApplyNewIndex={handleReorderGraphicIndexes(i)}
              index={i}
            />
          </React.Suspense>
        </div>
      ))}
      <Button className='mt-2 w-full' variant='outline' size='sm' onClick={handleAddGraphic}>
        Add Graphic
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
  const [inTransition, startTransition] = React.useTransition()
  const setDefValue = (key: keyof CardDefinitionType) => (event: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setCardDefinition((prev) => ({ ...prev, [key]: event.target.value }))
    })
  }
  const setGraphicsValue = (index: number, value: GraphicInstanceType) => {
    startTransition(() => {
      setCardDefinition((prev) => {
        const copy = { ...prev }
        const graphics = [...copy.graphics]
        graphics[index] = value
        copy.graphics = graphics
        return copy
      })
    })
  }
  const setAllGraphics = (newGraphics: GraphicInstanceType[]) => {
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
  const [open, setOpen] = React.useState(false)
  return (
    <div className='relative w-full rounded border bg-gray-700/20 p-2 pb-4'>
      <span className='absolute bottom-0 right-1 flex font-mono text-xs text-white/10'>id: {id}</span>
      <div className='flex items-center gap-2'>
        <Popover open={open} onOpenChange={(v) => setOpen(v)}>
          <PopoverTrigger asChild>
            <div className='flex w-full cursor-pointer items-center gap-2'>
              <div className='w-full'>
                <div className='flex w-full items-center justify-start gap-3'>
                  <CardGraphicPreview graphics={cardDefinitionState.graphics} />
                  <Label htmlFor='name'>
                    {cardDefinitionState.name || <span className='italic text-red-500/70'>card has no name</span>}
                  </Label>
                </div>
              </div>
              <Button size='sm' variant='outline'>
                Edit
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-lg p-0'>
            <ScrollArea className='relative h-[600px] w-[450px]'>
              <div className='absolute bottom-14 flex w-full justify-center'>👁👄👁</div>

              <div className='relative grid items-center gap-3 bg-zinc-900 p-2 pr-3'>
                <div>
                  <Label htmlFor='name'>Name</Label>
                  <Input id='name' type='text' defaultValue={cardDefinitionState.name} onChange={setDefValue('name')} />
                </div>
                <div>
                  <Label htmlFor='description'>Description</Label>
                  <Input
                    id='description'
                    type='text'
                    defaultValue={cardDefinitionState.description}
                    onChange={setDefValue('description')}
                  />
                </div>
                <div>
                  <Label htmlFor='health'>Health</Label>
                  <Input
                    id='health'
                    type='number'
                    defaultValue={cardDefinitionState.health}
                    onChange={setDefValue('health')}
                  />
                </div>
                <div>
                  <Label htmlFor='attack'>Attack</Label>
                  <Input
                    id='attack'
                    type='number'
                    defaultValue={cardDefinitionState.attack}
                    onChange={setDefValue('attack')}
                  />
                </div>
                <div>
                  <Label htmlFor='defence'>Defence</Label>
                  <Input
                    id='defence'
                    type='number'
                    defaultValue={cardDefinitionState.defence}
                    onChange={setDefValue('defence')}
                  />
                </div>
                {/* <div>
            <Label htmlFor='label'>Denomination</Label>
            <Input id='label' type='text' value={cardDefinitionState.label} onChange={setDefValue('label')} />
          </div> */}
                <div className='flex flex-col'>
                  <Label>Graphics</Label>
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

function GraphicDefinitionList() {
  const [graphicDefIds, setGraphicIds] = useGraphicDefinitionIds()
  const [newId, setNewId] = React.useState(() => randomId())
  const setTexDefinition = useGraphicDefinitionSet(newId)
  const handleDelete = (id: string) => {
    setGraphicIds((x) => {
      return x.filter((x) => x !== id)
    })
  }
  const handleDuplicate = (graphic: GraphicDefinitionType) => {
    setGraphicIds((x) => {
      return [...x, newId]
    })
    setTexDefinition(() => ({ ...graphic, id: newId }))
    setNewId(randomId())
  }
  return (
    <>
      {graphicDefIds.map((id) => (
        <GraphicDefinition key={id} id={id} handleDelete={() => handleDelete(id)} handleDuplicate={handleDuplicate} />
      ))}
    </>
  )
}

function aspectRatiosDifference(images: ImageDefinitionUrl[]) {
  const aspectRatios = images.map((image) => {
    return image.width / image.height
  })
  return Math.max(...aspectRatios) - Math.min(...aspectRatios)
}

function GraphicImagesValidator({ graphicDef }: { graphicDef: GraphicDefinitionType }) {
  const imageDef = useImageDefUrl(graphicDef.image)
  const bumpMapDef = useImageDefUrl(graphicDef.bumpMap)
  const iridescentMapDef = useImageDefUrl(graphicDef.iridescentMap)
  const matchRes = React.useMemo(() => {
    const aspectDiff = aspectRatiosDifference([imageDef, bumpMapDef, iridescentMapDef])
    if (Number.isNaN(aspectDiff)) {
      return null
    }
    if (aspectDiff < 0.1) {
      return <span className='text-green-500'>match</span>
    }
    return <span className='text-red-500'>misaligned ❌</span>
  }, [imageDef, bumpMapDef, iridescentMapDef])
  return (
    <div className='flex flex-col'>
      <div className='items-center justify-center p-2 font-mono text-xs'>
        {[imageDef, bumpMapDef, iridescentMapDef].map((x, i) => (
          <div key={x.id + i} className='flex justify-end gap-4'>
            <div>{x.name}</div>{' '}
            <div>
              {x.width}w &times; {x.height}h
            </div>
          </div>
        ))}
      </div>
      <div className='flex items-center justify-end p-2'>
        <div>{matchRes}</div>
      </div>
    </div>
  )
}

function GraphicDefinition({
  id,
  handleDelete,
  handleDuplicate,
}: {
  id: string
  handleDelete: () => void
  handleDuplicate: (graphic: GraphicDefinitionType) => void
}) {
  const [graphicDefBuffer, setGraphicDefBuffer] = React.useState<GraphicDefinitionType>()
  const [graphicDef, setGraphicDef] = useGraphicDefinition(id)
  const setDefValue = (key: keyof GraphicDefinitionType) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setGraphicDef((prev) => ({ ...prev, [key]: event.target.value }))

  const setDefMapValue = (key: keyof GraphicDefinitionType) => (image: ImageDefinitionIdType) =>
    setGraphicDef((prev) => ({ ...prev, [key]: image }))
  const _handleDuplicate = () => {
    handleDuplicate(graphicDef)
  }
  const [openDialog, setOpenDialog] = React.useState(false)
  const handleDialog = () => {
    setOpenDialog((prev) => !prev)
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
                      <ImagePreview image={graphicDef.image} />
                      <ImagePreview image={graphicDef.bumpMap} />
                      <ImagePreview image={graphicDef.iridescentMap} />
                    </React.Suspense>
                  </div>
                  <Label htmlFor='name'>
                    {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
                  </Label>
                </div>
              </div>
              <Button size='sm' variant='outline'>
                Edit
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-[90svw]'>
            <div className='relative grid items-center gap-3 bg-zinc-900 p-4 py-10'>
              <Dialog open={openDialog} onOpenChange={(v) => setOpenDialog(v)}>
                <DialogTrigger>
                  <Button
                    className='absolute right-1 top-1 flex gap-3 font-normal text-foreground/60'
                    variant='ghost'
                    size='sm'
                    onClick={handleDialog}
                  >
                    view fullscreen <EnterFullScreenIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-zinc-900'>
                  <ScrollArea className='relative max-h-[90dvh]'>
                    <DialogHeader>
                      <DialogTitle>
                        <h2 className='text-lg font-bold'>New Graphic Definition</h2>
                      </DialogTitle>
                      <DialogDescription>
                        <p>Define a new graphic for use in card definitions.</p>
                      </DialogDescription>
                    </DialogHeader>
                    <div className='relative grid items-center gap-3 px-1'>
                      <div>
                        <Label htmlFor='name'>Name</Label>
                        <Input id='name' type='text' defaultValue={graphicDef.name} onChange={setDefValue('name')} />
                      </div>
                      <div>
                        <Label htmlFor='image'>Image</Label>
                        <ImageHandler image={graphicDef.image} setImage={setDefMapValue('image')} />
                      </div>
                      <div>
                        1<Label htmlFor='bumpMap'>Bump Map</Label>
                        <ImageHandler image={graphicDef.bumpMap} setImage={setDefMapValue('bumpMap')} />
                      </div>
                      <div>
                        <Label htmlFor='iridescentMap'>Iridescent Map</Label>
                        <ImageHandler image={graphicDef.iridescentMap} setImage={setDefMapValue('iridescentMap')} />
                      </div>
                      <div>
                        <GraphicImagesValidator graphicDef={graphicDef} />
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          confirm('Are you sure you want to delete this graphic?\nThere is no undo (yet)') &&
                            handleDelete()
                        }}
                      >
                        Delete Graphic
                      </Button>
                      <Button onClick={_handleDuplicate} size='sm' variant='outline'>
                        Duplicate Definition
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <div>
                <Label htmlFor='name'>Name</Label>
                <Input id='name' type='text' defaultValue={graphicDef.name} onChange={setDefValue('name')} />
              </div>
              <div>
                <Label htmlFor='image'>Image</Label>
                <ImageHandler image={graphicDef.image} setImage={setDefMapValue('image')} />
              </div>
              <div>
                <Label htmlFor='bumpMap'>Bump Map</Label>
                <ImageHandler image={graphicDef.bumpMap} setImage={setDefMapValue('bumpMap')} />
              </div>
              <div>
                <Label htmlFor='iridescentMap'>Iridescent Map</Label>
                <ImageHandler image={graphicDef.iridescentMap} setImage={setDefMapValue('iridescentMap')} />
              </div>
              <div>
                <GraphicImagesValidator graphicDef={graphicDef} />
              </div>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => {
                  confirm('Are you sure you want to delete this graphic?\nThere is no undo (yet)') && handleDelete()
                }}
              >
                Delete Graphic
              </Button>
              <Button onClick={_handleDuplicate} size='sm' variant='outline'>
                Duplicate Definition
              </Button>
              <Button
                className='absolute bottom-1 right-1 flex gap-3 font-normal text-foreground/60'
                variant='ghost'
                size='sm'
                onClick={handleDialog}
              >
                view fullscreen <EnterFullScreenIcon />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
function AddGraphicDefinition() {
  const setGraphicIds = useGraphicDefinitionIdsListSet()
  const handleNewGraphic = () => {
    setGraphicIds((x) => [...x, randomId()])
  }
  return (
    <Button size='sm' onClick={handleNewGraphic}>
      New Graphic
    </Button>
  )
}

function ImageDefinitionList() {
  const imageDefIds = useImageDefinitionIdsList()
  return (
    <>
      {imageDefIds.length === 0 && (
        <div className='text-center text-gray-500'>
          <p>No images yet</p>
          <p>Click the button above to add images</p>
        </div>
      )}
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
    setNewImageObj(null)
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
      <Popover>
        <PopoverTrigger asChild>
          <div className='flex cursor-pointer items-center gap-1'>
            <div className='w-full'>
              <div className='flex w-full items-center justify-start gap-3'>
                <img src={imageDef.url} className='size-12 object-contain' alt='image definition image' />
                <Label htmlFor='name'>
                  {imageDef.name || <span className='italic text-red-500/70'>image has no name</span>}
                </Label>
              </div>
            </div>
            <Button size='sm' variant='outline'>
              Replace
            </Button>
          </div>
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
                  <img src={newImage?.src || imageDef.url} alt='new image' className='size-16 object-contain' />
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
              <CardGraphicPreview graphics={cardDefValue.graphics} />
              {cardDefValue.name || <span className='italic text-red-500/70'>card has no name</span>}
            </div>
          ) : (
            'Add Card...'
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
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
        <CardGraphicPreview graphics={cardDef.graphics} />
        {cardDef.name || <span className='italic text-red-500/70'>card has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}

function GraphicDefCombobox({
  value,
  setValue,
}: {
  value?: GraphicDefinitionIdType
  setValue: (value: GraphicDefinitionIdType) => void
}) {
  const [open, setOpen] = React.useState(false)
  const graphicDefIds = useGraphicDefinitionIdsList()
  const [graphicDef] = useGraphicDefinition(value?.graphic_id || '')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='sm'>
          {graphicDef.image.image_id ? (
            <div className='flex items-center justify-start gap-2'>
              <Check className={'mr-2 size-4 opacity-100'} />
              <div className='flex'>
                <ImagePreview image={graphicDef.image} />
                <ImagePreview image={graphicDef.bumpMap} />
                <ImagePreview image={graphicDef.iridescentMap} />
              </div>

              {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
            </div>
          ) : (
            'Select Graphic...'
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full max-w-xs p-0'>
        <Command>
          {graphicDefIds.length > 3 && <CommandInput placeholder='Search Graphics...' />}
          {graphicDefIds.length < 1 && <CommandInput placeholder='No graphics' />}
          <CommandEmpty>No Graphics.</CommandEmpty>
          <CommandGroup>
            {graphicDefIds.map((defId) => (
              <GraphicDefCommandItem
                key={defId}
                graphic_id={defId}
                value={value?.graphic_id || ''}
                setValue={() => {
                  setValue({ graphic_id: defId })
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

function GraphicDefCommandItem({
  graphic_id,
  setValue,
  value,
}: {
  graphic_id: string
  setValue: () => void
  value: string
}) {
  const [graphicDef] = useGraphicDefinition(graphic_id)
  return (
    <CommandItem
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full justify-start gap-2'>
        <div className='flex'>
          <ImagePreview image={graphicDef.image} />
          <ImagePreview image={graphicDef.bumpMap} />
          <ImagePreview image={graphicDef.iridescentMap} />
        </div>
        {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
        <Check className={cn('mr-2 h-4 w-4', value === graphic_id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
