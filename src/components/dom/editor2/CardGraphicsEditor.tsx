/* eslint-disable @next/next/no-img-element */
import {
  GraphicDefinitionIdType,
  GraphicInstanceType,
  ImageDefinitionIdType,
  randomId,
  useCardDefinition,
  useGraphicDefinition,
  useGraphicDefinitionIdsList,
  useImageDefUrl,
  useSetCardDefinition,
} from '@/src/state/assets'
import { Button } from '@/src/components/ui/button'
import { IndexedDBEffect } from '@/src/state/effects'
import { atom, useRecoilState } from 'recoil'
import { useState, useTransition } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Check, ChevronsUpDown, ExternalLinkIcon, Menu } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { cn } from '@/src/lib/utils'
import {
  ColumnSpacingIcon,
  EyeNoneIcon,
  HeightIcon,
  PlusIcon,
  RowSpacingIcon,
  SymbolIcon,
  WidthIcon,
} from '@radix-ui/react-icons'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Vec3 } from '@/src/lib/types'
import { Checkbox } from '../../ui/checkbox'
import { ImagePreview } from './GraphicsEditor'
import { ScrollArea } from '@radix-ui/react-scroll-area'

const selectedGraphicInstIdState = atom<string>({
  key: 'selectedGraphicInstId',
  default: '',
  effects: [IndexedDBEffect('selected_graphic_inst_id', 'v2')],
})

export default function CardGraphicsEditor({ cardDefId }: { cardDefId: string }) {
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
  const [selectedInstId, setSelectedInstId] = useRecoilState(selectedGraphicInstIdState)
  const [open, setOpen] = useState(false)

  const handleNewGraphicInst = () => {
    const newId = randomId()
    setCardDef((x) => {
      const newInst: GraphicInstanceType = {
        label: '',
        inst_id: newId,
        graphic_id: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        width: 1,
        renderOrderOffset: 0,
        enabled: true,
      }
      return { ...x, graphics: [...x.graphics, newInst] }
    })
    setSelectedInstId(newId)
    setOpen(false)
  }
  const handleEnableAll = () => {
    setCardDef((x) => {
      const newX = { ...x }
      newX.graphics = x.graphics.map((g) => ({ ...g, enabled: true }))
      return newX
    })
    setOpen(false)
  }
  return (
    <div className='flex max-w-xs flex-col gap-2 p-2 pr-3'>
      <Label size='2xs'>Graphic Instance</Label>
      <div className='flex w-full items-center justify-center gap-2 pt-1'>
        <SelectCardGraphicInstComboBox graphics={cardDef.graphics} />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' role='dialog' size='icon'>
              <Menu />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='flex w-full min-w-[200px] max-w-xs flex-col'>
            <Button variant='outline' className='text-xs' onClick={handleNewGraphicInst}>
              New Graphic Instance
            </Button>
            <Button variant='outline' className='text-xs' onClick={handleEnableAll}>
              Enable All Graphics
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      <EditCardGraphic cardDefId={cardDefId} key={selectedInstId} />
    </div>
  )
}

function SelectCardGraphicInstComboBox({ graphics }: { graphics: GraphicInstanceType[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useRecoilState(selectedGraphicInstIdState)
  const selectedIndex = graphics.findIndex((x) => x.inst_id === selected)
  const selectedGfx = graphics[selectedIndex]
  const [graphicDef] = useGraphicDefinition(selectedGfx?.graphic_id || '')
  if (graphics.length === undefined) {
    return <div>No Graphics</div>
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-haspopup='listbox'
          className='relative h-fit w-5/6 justify-between'
        >
          {selectedGfx && selectedGfx.inst_id ? (
            <div className='flex w-full flex-wrap items-center justify-start gap-1 overflow-hidden'>
              <div className='flex w-fit items-center justify-start gap-2 text-xs'>
                <span className='absolute left-1 top-1 font-mono text-[10px]'>{selectedIndex}</span>
                {selectedGfx.graphic_id ? (
                  <>
                    <GraphicPreview graphic_id={selectedGfx.graphic_id} />
                    <span>
                      {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
                    </span>
                  </>
                ) : (
                  <>
                    <span className='italic text-gray-500'>No Definition Selected</span>
                  </>
                )}
                {!selectedGfx.enabled && (
                  <div>
                    <EyeNoneIcon />
                  </div>
                )}
              </div>
              <span className='text-[0.5rem] text-primary'>{selectedGfx.label}</span>
            </div>
          ) : (
            <span className='text-xs italic text-gray-500/70'>Select Graphic Instance</span>
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs'>
        <Command>
          {graphics.length === 0 && <CommandGroup heading='no graphic instances on this card' />}
          <CommandEmpty>No Graphics Found</CommandEmpty>
          <CommandGroup>
            {graphics.map((graphic, index) => (
              <GraphicInstCommandItem
                key={graphic.inst_id}
                index={index}
                graphic={graphic}
                setValue={() => {
                  setSelected(graphic.inst_id)
                  setOpen(false)
                }}
                value={selected}
              />
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function GraphicInstCommandItem({
  graphic,
  setValue,
  value,
  index,
}: {
  graphic: GraphicInstanceType
  setValue: () => void
  value: string
  index: number
}) {
  const [graphicDef] = useGraphicDefinition(graphic.graphic_id)
  return (
    <CommandItem
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full items-center justify-between gap-2 text-xs'>
        <span className='font-mono text-[10px]'>{index}</span>
        <div className='flex w-full items-center justify-between'>
          <div className='w-full'>
            {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
          </div>
        </div>
        <div className='size-8'>
          <GraphicPreview graphic_id={graphic.graphic_id} />
        </div>
        {!graphic.enabled && (
          <div>
            <EyeNoneIcon />
          </div>
        )}
        <Check className={cn('mr-2 h-4 w-4', value === graphic.inst_id ? 'opacity-100' : 'opacity-0')} />
      </div>
      <div className='text-[0.5rem] text-primary'>{graphic.label}</div>
    </CommandItem>
  )
}

function EditCardGraphic({ cardDefId }: { cardDefId: string }) {
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
  const [selectedInstId, setSelectedInstId] = useRecoilState(selectedGraphicInstIdState)
  const [, startTransition] = useTransition()
  const [error, setError] = useState('')
  const selectedIndex = cardDef.graphics.findIndex((x) => x.inst_id === selectedInstId)
  if (selectedIndex === -1) {
    requestAnimationFrame(() => setSelectedInstId(cardDef.graphics[0]?.inst_id || ''))
  }
  const selectedGfx = cardDef.graphics[selectedIndex]
  if (!selectedGfx) {
    return null
  }
  function handleChange<K extends keyof GraphicInstanceType, V extends GraphicInstanceType[K]>(k: K, v: V) {
    startTransition(() => {
      setCardDef((x) => {
        const gfx = x.graphics.find((g) => g.inst_id === selectedInstId)
        if (!gfx) return x
        const newGfx = { ...gfx }
        newGfx[k] = v
        const newX = { ...x }
        newX.graphics = x.graphics.map((g) => (g.inst_id === selectedInstId ? newGfx : g))
        return newX
      })
    })
  }
  const handleNewIndex = (index: number) => {
    if (index < 0 || index >= cardDef.graphics.length)
      return setError(`index must be within 0 and ${cardDef.graphics.length - 1}`)
    else setError('')
    startTransition(() => {
      setCardDef((x) => {
        const gfx = x.graphics.find((g) => g.inst_id === selectedInstId)
        if (!gfx) return x
        const newGfx = { ...gfx }
        const newX = { ...x }
        newX.graphics = x.graphics.filter((g) => g.inst_id !== selectedInstId)
        newX.graphics.splice(index, 0, newGfx)
        return newX
      })
    })
  }
  const handleEnabled = () => {
    handleChange('enabled', !selectedGfx.enabled)
  }
  const handleLabel: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleChange('label', e.currentTarget.value)
  }
  const handleWidth: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleChange('width', parseFloat(e.currentTarget.value))
  }
  const handleRenderOrder: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleChange('renderOrderOffset', parseFloat(e.currentTarget.value))
  }
  const handleIndex: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleNewIndex(parseInt(e.currentTarget.value))
  }
  const handleDuplicate = () => {
    const newId = randomId()
    startTransition(() => {
      setCardDef((x) => {
        const gfx = x.graphics.find((g) => g.inst_id === selectedInstId)
        if (!gfx) return x
        const newGfx = { ...gfx }
        newGfx.inst_id = newId
        const newX = { ...x }
        newX.graphics = [...x.graphics]
        newX.graphics.push(newGfx)
        return newX
      })
      setSelectedInstId(newId)
    })
  }
  const handleDelete = () => {
    const res = confirm('Are you sure you want to delete this graphic?')
    if (!res) return
    startTransition(() => {
      setCardDef((x) => {
        const newX = { ...x }
        newX.graphics = x.graphics.filter((g) => g.inst_id !== selectedInstId)
        return newX
      })
      setSelectedInstId(
        cardDef.graphics[selectedIndex + 1]?.inst_id || cardDef.graphics[selectedIndex - 1]?.inst_id || '',
      )
    })
  }
  return (
    <>
      <div className='w-full select-text text-center font-mono text-[0.6rem] opacity-50'>{selectedGfx.inst_id}</div>
      <div className='flex w-full items-center justify-start gap-2'>
        <Checkbox checked={selectedGfx.enabled} onClick={handleEnabled} />
        <div onClick={handleEnabled}>
          <span className='w-full cursor-pointer text-xs opacity-50'>
            Graphic Instance {selectedGfx.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      <Label size='2xs'>Instance Label</Label>
      <Input defaultValue={selectedGfx.label} onChange={handleLabel} />
      <Label size='2xs' htmlFor='graphic_definition'>
        Instance Graphic Definition
      </Label>
      <GraphicDefCombobox value={selectedGfx.graphic_id} setValue={(r) => handleChange('graphic_id', r)} />
      <div className='w-full select-text text-center font-mono text-[0.6rem] opacity-50'>{selectedGfx.graphic_id}</div>
      <Label size='2xs' htmlFor='position'>
        Position
      </Label>
      <EditGfxPosition position={selectedGfx.position} setPosition={(r) => handleChange('position', r)} />
      <Label size='2xs' htmlFor='position'>
        Rotation (Degrees)
      </Label>
      <EditGfxRotation rotation={selectedGfx.rotation} setRotation={(r) => handleChange('rotation', r)} />
      <Label size='2xs' className='flex items-center justify-around'>
        <span>Scale</span>
        <span>R.Order -/+</span>
        <span>Index</span>
      </Label>
      <div className='flex w-full items-center justify-between gap-2'>
        <Input type='number' step={0.05} defaultValue={selectedGfx.width} onChange={handleWidth} />
        <Input type='number' defaultValue={selectedGfx.renderOrderOffset} onChange={handleRenderOrder} />
        <Input type='number' defaultValue={selectedIndex} onChange={handleIndex} />
      </div>
      {error && <div className='w-full text-right text-xs text-red-500'>{error}</div>}
      <div className='flex w-full items-center justify-between gap-2 pt-2'>
        <Label size='2xs' className='w-full'>
          Graphic Instance
        </Label>
        <Button variant='secondary' size='xs' onClick={handleDuplicate}>
          clone
        </Button>
        <Button variant='destructive' size='xs' onClick={handleDelete}>
          delete
        </Button>
      </div>
    </>
  )
}

function GraphicDefCombobox({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const graphicDefIds = useGraphicDefinitionIdsList()
  const [graphicDef] = useGraphicDefinition(value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id='graphic_definition'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='relative flex h-fit w-full justify-between'
        >
          {graphicDef.image.image_id || graphicDef.name ? (
            <div className='flex w-full flex-wrap items-center justify-between gap-1'>
              <div className='max-w-48 overflow-x-auto overflow-y-hidden text-left text-xs'>
                {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
              </div>
              <div className='flex'>
                <ImagePreview image={graphicDef.image} />
                <ImagePreview image={graphicDef.bumpMap} />
                <ImagePreview image={graphicDef.iridescentMap} />
              </div>
            </div>
          ) : (
            <span className='text-xs italic text-gray-500/70'>Select Definition</span>
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs'>
        <Command>
          {graphicDefIds.length > 3 && <CommandInput placeholder='Search Graphics...' />}
          {graphicDefIds.length === 0 && <CommandGroup heading='no graphics to choose from' />}
          {graphicDefIds.length > 0 && <CommandEmpty>No Graphics Match Search</CommandEmpty>}
          <ScrollArea className='max-h-96 overflow-y-scroll'>
            <CommandGroup>
              {graphicDefIds.map((defId) => (
                <GraphicDefCommandItem
                  key={defId}
                  graphic_id={defId}
                  value={value}
                  setValue={() => {
                    setValue(defId)
                    setOpen(false)
                  }}
                />
              ))}
            </CommandGroup>
          </ScrollArea>
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
      className='relative'
      onSelect={() => {
        setValue()
      }}
    >
      <div className='flex w-full items-center justify-between gap-2'>
        <div className='w-full overflow-x-auto overflow-y-hidden text-left text-xs'>
          {graphicDef.name || <span className='italic text-red-500/70'>graphic has no name</span>}
        </div>
        <div className='flex'>
          <ImagePreview image={graphicDef.image} />
          <ImagePreview image={graphicDef.bumpMap} />
          <ImagePreview image={graphicDef.iridescentMap} />
        </div>
        <Check className={cn('mr-2 h-4 w-4', value === graphic_id ? 'opacity-100' : 'opacity-0')} />
      </div>
      <div className='absolute bottom-0 right-0 w-full select-text text-center font-mono text-[0.6rem] opacity-50'>
        {graphic_id}
      </div>
    </CommandItem>
  )
}

function GraphicPreview({ graphic_id, showAll }: { graphic_id: string; showAll?: boolean }) {
  const [graphicDef] = useGraphicDefinition(graphic_id)
  return (
    <div className='flex min-w-5'>
      <ImagePreview image={graphicDef.image} />
      {showAll && (
        <>
          <ImagePreview image={graphicDef.bumpMap} />
          <ImagePreview image={graphicDef.iridescentMap} />
        </>
      )}
    </div>
  )
}

function EditGfxPosition({ position, setPosition }: { position: Vec3; setPosition: (p: Vec3) => void }) {
  const [, setLocalState] = useState(position)
  const handleUpdatePosition = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = parseInt(e.currentTarget.id)
    const value = parseFloat(e.currentTarget.value) || 0
    setLocalState((p) => {
      if (isNaN(id)) return p
      const newP = [...p] as Vec3
      newP[id] = value
      requestAnimationFrame(() => setPosition(newP))
      return newP
    })
  }
  return (
    <div className='flex w-full gap-2'>
      <div className='flex items-center gap-1'>
        <WidthIcon />
        <Input id='0' type='number' step={0.05} defaultValue={position[0]} onChange={handleUpdatePosition} />
      </div>
      <div className='flex items-center gap-1'>
        <HeightIcon />
        <Input id='1' type='number' step={0.05} defaultValue={position[1]} onChange={handleUpdatePosition} />
      </div>
      <div className='flex items-center gap-1'>
        <ExternalLinkIcon />
        <Input id='2' type='number' step={0.01} defaultValue={position[2]} onChange={handleUpdatePosition} />
      </div>
    </div>
  )
}
function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}
function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}
function EditGfxRotation({ rotation, setRotation }: { rotation: Vec3; setRotation: (p: Vec3) => void }) {
  const [local, setLocalState] = useState(rotation)
  const handleUpdateRotation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = parseInt(e.currentTarget.id)
    const value = parseInt(e.currentTarget.value) || 0
    setLocalState((p) => {
      if (isNaN(value) || isNaN(id)) return p
      const newP = [...p] as Vec3
      newP[id] = degreesToRadians(value)
      requestAnimationFrame(() => setRotation(newP))
      return newP
    })
  }
  return (
    <div className='flex w-full gap-2'>
      <div className='flex items-center gap-1'>
        <RowSpacingIcon />
        <Input
          id='0'
          type='number'
          step={5}
          defaultValue={radiansToDegrees(local[0])}
          onChange={handleUpdateRotation}
        />
      </div>
      <div className='flex items-center gap-1'>
        <ColumnSpacingIcon />
        <Input
          id='1'
          type='number'
          step={5}
          defaultValue={radiansToDegrees(local[1])}
          onChange={handleUpdateRotation}
        />
      </div>
      <div className='flex items-center gap-1'>
        <SymbolIcon />
        <Input
          id='2'
          type='number'
          step={5}
          defaultValue={radiansToDegrees(local[2])}
          onChange={handleUpdateRotation}
        />
      </div>
    </div>
  )
}
