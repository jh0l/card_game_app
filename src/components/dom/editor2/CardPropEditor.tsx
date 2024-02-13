/* eslint-disable @next/next/no-img-element */
'use client'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Input } from '@/src/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Textarea } from '@/src/components/ui/textarea'
import { Vec3 } from '@/src/lib/types'
import { cn } from '@/src/lib/utils'
import {
  CARD_ATTRIBUTE_VALUE_TYPES,
  CARD_TYPE_PROPERTIES,
  CardType,
  HorizontalAnchorType,
  PropInstanceType,
  VerticalAnchorType,
  useCardDefinition,
  useSetCardDefinition,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import {
  ExternalLinkIcon,
  EyeNoneIcon,
  HeightIcon,
  TextAlignBottomIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignMiddleIcon,
  TextAlignRightIcon,
  TextAlignTopIcon,
  WidthIcon,
} from '@radix-ui/react-icons'
import { Label } from '@/src/components/ui/label'
import { Check, ChevronsUpDown, Menu } from 'lucide-react'
import { MouseEventHandler, useState, useTransition } from 'react'
import { atom, useRecoilState, useResetRecoilState } from 'recoil'

export function CardPropEditor({ cardDefId }: { cardDefId: string }) {
  const [cardDef] = useCardDefinition(cardDefId)
  return (
    <div className='flex flex-col gap-2'>
      {cardDef.cardType === undefined && <CardTypeComboBox cardDefId={cardDefId} />}
      {cardDef.cardType && <EditCardType cardDefId={cardDefId} />}
      {cardDef.cardType && (
        <>
          <AddMissingProps cardDefId={cardDefId} />
          {cardDef.props && (
            <>
              <Label size='2xs'>Property</Label>
              <SelectCardPropComboBox cardDefId={cardDefId} />
              <EditCardProp cardDefId={cardDefId} />
            </>
          )}
        </>
      )}
    </div>
  )
}
function EditCardTypePopover({ cardDefId }: { cardDefId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='dialog' className='scale-75' size='icon'>
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='max-w-xs'>
        <div className='text-xs'>Change Card Type</div>
        <CardTypeComboBox cardDefId={cardDefId} />
      </PopoverContent>
    </Popover>
  )
}
function EditCardType({ cardDefId }: { cardDefId: string }) {
  const [cardDef] = useCardDefinition(cardDefId)
  if (!cardDef.cardType) return null
  return (
    <div className='flex items-center justify-between gap-2'>
      <div>Type: {cardDef.cardType}</div>
      <EditCardTypePopover cardDefId={cardDefId} />
    </div>
  )
}
function AddMissingProps({ cardDefId }: { cardDefId: string }) {
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
  if (cardDef.props === undefined) {
    return (
      <Button size='xs' onClick={() => setCardDef((x) => ({ ...x, props: {} }))}>
        Fix Missing Properties
      </Button>
    )
  }
  if (cardDef.cardType) {
    const missing = CARD_TYPE_PROPERTIES[cardDef.cardType].filter((x) => cardDef.props && !cardDef.props[x])
    if (missing.length === 0) return null
    const handleAddText: MouseEventHandler<HTMLButtonElement> = (e) => {
      const propId = e.currentTarget.value
      setCardDef((x) => ({
        ...x,
        props: {
          ...x.props,
          [propId]: {
            prop_id: propId,
            value: '',
            position: [0, 0, 0] as Vec3,
            vertical_anchor: 'top',
            horizontal_anchor: 'left',
            size: 1,
            x_scale: 1,
            width: 1,
            render_order_offset: 0,
            enabled: true,
          },
        },
      }))
    }
    return (
      <div className='flex flex-col gap-2'>
        {missing.map((textId) => (
          <Button key={textId} size='xs' value={textId} onClick={handleAddText}>
            Add {textId}
          </Button>
        ))}
      </div>
    )
  }
  return null
}
const cardTypes: CardType[] = ['monster', 'item', 'trap', 'counter']
function CardTypeComboBox({ cardDefId }: { cardDefId: string }) {
  const [open, setOpen] = useState(false)
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
  const resetSelected = useResetRecoilState(selectedPropIdState)
  const handleChangeCardType = (currentValue: CardType) => {
    setCardDef((x) => {
      const newX = { ...x }
      // disable all properties
      if (newX.props === undefined) newX.props = {}
      const newXProps = { ...newX.props }
      for (const propId in newXProps) {
        newXProps[propId] = { ...newXProps[propId] }
        newXProps[propId].enabled = false
      }
      // enable properties for this card type
      for (const propId of CARD_TYPE_PROPERTIES[currentValue]) {
        if (typeof newXProps[propId] !== 'undefined') {
          newXProps[propId].enabled = true
        } else {
          newXProps[propId] = {
            prop_id: propId,
            value: '',
            position: [0, 0, 0] as Vec3,
            vertical_anchor: 'top',
            horizontal_anchor: 'left',
            size: 1,
            width: 1,
            x_scale: 1,
            render_order_offset: 0,
            enabled: true,
          }
        }
      }
      newX.props = newXProps
      newX.cardType = currentValue
      return newX
    })
    setOpen(false)
    resetSelected()
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between' size='xs'>
          {cardDef.cardType ? (
            <div className='flex w-1/2 items-center justify-start gap-6'>{cardDef.cardType}</div>
          ) : (
            <div className='w-full rounded bg-primary/60'>Set Card Type...</div>
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='max-w-xs'>
        <Command>
          {cardTypes.length > 6 && <CommandInput placeholder='Search Types...' />}
          {cardTypes.length < 1 && <CommandInput placeholder='No types' />}
          <CommandEmpty>No Types.</CommandEmpty>
          <CommandGroup>
            {cardTypes.map((defId) => (
              <CommandItem key={defId} value={defId} onSelect={handleChangeCardType}>
                <div className='flex w-full justify-start gap-2'>
                  {defId}
                  <Check className={cn('mr-2 h-4 w-4', cardDef.cardType === defId ? 'opacity-100' : 'opacity-0')} />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
const selectedPropIdState = atom<string>({
  key: 'selected_prop_id',
  default: undefined,
  effects: [IndexedDBEffect('selected_prop_id', '')],
})

function SelectCardPropComboBox({ cardDefId }: { cardDefId: string }) {
  const [open, setOpen] = useState(false)
  const [cardDef] = useCardDefinition(cardDefId)
  const [selected, setSelected] = useRecoilState(selectedPropIdState)
  if (cardDef.props === undefined) {
    return <div>No Properties</div>
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          role='combobox'
          aria-expanded={open}
          aria-haspopup='listbox'
          className='w-full justify-between'
        >
          {selected ? (
            <div className='flex w-1/2 items-center justify-start gap-6'>
              {cardDef.props[selected].prop_id}
              {!cardDef.props[selected].enabled && (
                <div>
                  <EyeNoneIcon />
                </div>
              )}
            </div>
          ) : (
            'Select Prop...'
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='max-w-xs'>
        <Command>
          <CommandEmpty>No Props</CommandEmpty>
          <CommandGroup>
            {Object.values(cardDef.props).map(({ prop_id, enabled }) => (
              <CommandItem
                key={prop_id}
                value={prop_id}
                onSelect={(currentValue: string) => {
                  setSelected(currentValue)
                  setOpen(false)
                }}
              >
                <div
                  className={cn('flex w-full justify-start gap-2', {
                    'opacity-50': !enabled,
                  })}
                >
                  {!enabled && (
                    <div>
                      <EyeNoneIcon />
                    </div>
                  )}
                  {prop_id}
                  <Check className={cn('mr-2 h-4 w-4', selected === prop_id ? 'opacity-100' : 'opacity-0')} />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
function EditCardProp({ cardDefId }: { cardDefId: string }) {
  const [, startTransition] = useTransition()
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
  const [selected] = useRecoilState(selectedPropIdState)
  if (selected === undefined || cardDef.props === undefined) return null
  const prop = cardDef.props[selected]
  const inputType = CARD_ATTRIBUTE_VALUE_TYPES[prop.prop_id]
  const handleEnableProp: MouseEventHandler<HTMLButtonElement> = () => {
    startTransition(() => {
      setCardDef((x) => {
        if (x.props === undefined) return x
        const newX = { ...x }
        newX.props = { ...x.props }
        newX.props[selected] = { ...x.props[selected] }
        newX.props[selected].enabled = !x.props[selected].enabled
        return newX
      })
    })
  }
  const handleUpdateProp: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const value = e.currentTarget.value
    startTransition(() => {
      setCardDef((x) => {
        if (x.props === undefined) return x
        const newX = { ...x }
        newX.props = { ...x.props }
        newX.props[selected] = { ...x.props[selected], value }
        return newX
      })
    })
  }
  return (
    <div className='grid w-full space-y-2' key={selected}>
      <div className='flex w-full items-center justify-start gap-2'>
        <Checkbox checked={prop.enabled} onClick={handleEnableProp} />
        <div>
          <span onClick={handleEnableProp} className='w-full cursor-pointer text-xs opacity-50'>
            Property {prop.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      {inputType === 'string' && (
        <Input placeholder={prop.prop_id + '...'} defaultValue={prop.value} onChange={handleUpdateProp} />
      )}
      {inputType === 'number' && (
        <Input type='number' placeholder={prop.prop_id + '...'} defaultValue={prop.value} onChange={handleUpdateProp} />
      )}
      {inputType === 'textarea' && (
        <Textarea placeholder={prop.prop_id + '...'} defaultValue={prop.value} onChange={handleUpdateProp} />
      )}
      <EditPropPosition prop={prop} cardDefId={cardDefId} />
      <EditPropAnchor prop={prop} cardDefId={cardDefId} />
    </div>
  )
}
function EditPropPosition({ prop, cardDefId }: { prop: PropInstanceType; cardDefId: string }) {
  const [, startTransition] = useTransition()
  const setCardDef = useSetCardDefinition(cardDefId)
  const handleUpdatePosition: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.currentTarget.value
    const id = e.currentTarget.id
    startTransition(() => {
      setCardDef((x) => {
        if (x.props === undefined) return x
        const newX = { ...x }
        newX.props = { ...x.props }
        const position = [...x.props[prop.prop_id].position] as Vec3
        position[Number(id)] = Number(value)
        newX.props[prop.prop_id] = { ...x.props[prop.prop_id], position }
        return newX
      })
    })
  }
  return (
    <>
      <Label size='2xs' htmlFor='0'>
        position
      </Label>
      <div className='flex w-full gap-2'>
        <div className='flex items-center gap-1'>
          <WidthIcon />
          <Input id='0' type='number' step={0.05} defaultValue={prop.position[0]} onChange={handleUpdatePosition} />
        </div>
        <div className='flex items-center gap-1'>
          <HeightIcon />
          <Input id='1' type='number' step={0.05} defaultValue={prop.position[1]} onChange={handleUpdatePosition} />
        </div>
        <div className='flex items-center gap-1'>
          <ExternalLinkIcon />
          <Input id='2' type='number' step={0.05} defaultValue={prop.position[2]} onChange={handleUpdatePosition} />
        </div>
      </div>
    </>
  )
}
function EditPropAnchor({ prop, cardDefId }: { prop: PropInstanceType; cardDefId: string }) {
  const setCardDef = useSetCardDefinition(cardDefId)
  const handleAnchorChange = ({ v, h }: { v?: VerticalAnchorType; h?: HorizontalAnchorType }) => {
    setCardDef((x) => {
      const newX = { ...x }
      if (!newX.props || (!v && !h)) return x
      const newProps = { ...newX.props }
      const newProp = { ...newX.props[prop.prop_id] }
      if (v) {
        newProp.vertical_anchor = v
      }
      if (h) {
        newProp.horizontal_anchor = h
      }
      newProps[newProp.prop_id] = newProp
      newX.props = newProps
      return newX
    })
  }
  const handleNumChange: (k: keyof PropInstanceType) => React.ChangeEventHandler<HTMLInputElement> = (k) => (e) => {
    const value = e.currentTarget.value
    setCardDef((x) => {
      const newX = { ...x }
      if (!newX.props) return x
      const newProps = { ...newX.props }
      const newProp = { ...newX.props[prop.prop_id] } as PropInstanceType
      if (typeof newProp[k] !== 'number') {
        newProp[k] = 0 as never
      }
      newProp[k] = Number(value) as never
      newProps[newProp.prop_id] = newProp
      newX.props = newProps
      return newX
    })
  }
  return (
    <>
      <Label size='2xs' className='flex items-center justify-between'>
        <span className='w-1/3 text-center'>Vertical</span>
        <span className='w-1/3 text-center'>Horizontal</span>
        <span className='w-1/3 text-center'>Size</span>
      </Label>
      <div className='flex w-full items-center justify-between gap-2'>
        <AnchorButtons prop={prop} onChange={handleAnchorChange} />
        <Input
          type='number'
          step={0.05}
          defaultValue={prop.size}
          onChange={handleNumChange('size')}
          className='w-1/3'
        />
      </div>
      <Label size='2xs' className='flex items-center justify-between'>
        <span className='w-1/3 text-center'>Width</span>
        <span className='w-1/3 text-center'>Scale</span>
        <span className='w-1/3 text-center'>R.Order -/+</span>
      </Label>
      <div className='flex w-full items-center justify-between gap-2'>
        <Input type='number' step={0.05} defaultValue={prop.width} onChange={handleNumChange('width')} />
        <Input type='number' step={0.05} defaultValue={prop.x_scale} onChange={handleNumChange('x_scale')} />
        <Input
          type='number'
          defaultValue={prop.render_order_offset}
          onChange={handleNumChange('render_order_offset')}
        />
      </div>
    </>
  )
}
function AnchorButtons({
  prop,
  onChange,
}: {
  prop: PropInstanceType
  onChange: (a: { v?: VerticalAnchorType; h?: HorizontalAnchorType }) => void
}) {
  const vert = prop.vertical_anchor
  const hori = prop.horizontal_anchor
  return (
    <>
      <div className='flex w-1/3'>
        <Button size='icon' variant='outline' disabled={vert === 'top'} onClick={() => onChange({ v: 'top' })}>
          <TextAlignTopIcon />
        </Button>
        <Button size='icon' variant='outline' disabled={vert === 'middle'} onClick={() => onChange({ v: 'middle' })}>
          <TextAlignMiddleIcon />
        </Button>
        <Button size='icon' variant='outline' disabled={vert === 'bottom'} onClick={() => onChange({ v: 'bottom' })}>
          <TextAlignBottomIcon />
        </Button>
      </div>
      <div className='flex w-1/3'>
        <Button size='icon' variant='outline' disabled={hori === 'left'} onClick={() => onChange({ h: 'left' })}>
          <TextAlignLeftIcon />
        </Button>
        <Button size='icon' variant='outline' disabled={hori === 'center'} onClick={() => onChange({ h: 'center' })}>
          <TextAlignCenterIcon />
        </Button>
        <Button size='icon' variant='outline' disabled={hori === 'right'} onClick={() => onChange({ h: 'right' })}>
          <TextAlignRightIcon />
        </Button>
      </div>
    </>
  )
}
