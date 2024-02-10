/* eslint-disable @next/next/no-img-element */

'use client'
import { Spinner } from '@/src/components/dom/Spinner'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Input } from '@/src/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/src/components/ui/resizable'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Textarea } from '@/src/components/ui/textarea'
import { Vec3 } from '@/src/lib/types'
import { cn } from '@/src/lib/utils'
import {
  CARD_ATTRIBUTE_VALUE_TYPES,
  CARD_TYPE_PROPERTIES,
  CardType,
  GraphicInstanceType,
  HorizontalAnchorType,
  PropInstanceType,
  VerticalAnchorType,
  selectedCardDefIdState,
  useCardDefinition,
  useCardDefinitionList,
  useGraphicDefinition,
  useImageDefUrl,
  useSetCardDefinition,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import {
  ExternalLinkIcon,
  HeightIcon,
  TextAlignBottomIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignMiddleIcon,
  TextAlignRightIcon,
  TextAlignTopIcon,
  WidthIcon,
} from '@radix-ui/react-icons'
import { Label } from '@radix-ui/react-label'
import { Check, ChevronsUpDown, Focus, Menu } from 'lucide-react'
import dynamic from 'next/dynamic'
import { MouseEventHandler, Suspense, useState, useRef, useTransition } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE, useResetRecoilState } from 'recoil'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })

export default function Page() {
  return (
    <>
      <main className='relative h-[100dvh]'>
        <Editor />
        <GameClient />
      </main>
    </>
  )
}

function Editor() {
  const [show, setShow] = useState(true)
  return (
    <div className='pointer-events-none absolute inset-0 z-50 flex items-end justify-end'>
      <div className='flex h-screen w-full max-w-xs flex-col gap-2'>
        <div className='pointer-events-auto overflow-hidden rounded'>
          <div className='flex items-center justify-between bg-muted/50 p-1 px-2 text-sm'>
            <span>Editor</span>
            <div>
              <Button size='xs' variant={show ? 'outline' : 'default'} onClick={() => setShow((x) => !x)}>
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>
          {!show && <div key='toolbar' className='h-0 bg-muted'></div>}
          {show && (
            <div key='toolbar' className='h-[100svh] bg-muted/90'>
              <EditorContent />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// contains tabs for Cards, Graphics, Images, Table
function EditorContent() {
  return (
    <Tabs defaultValue='cards' className='size-full max-w-xs'>
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='cards'>cards</TabsTrigger>
        <TabsTrigger value='graphics'>graphics</TabsTrigger>
        <TabsTrigger value='images'>images</TabsTrigger>
        <TabsTrigger value='table'>table</TabsTrigger>
      </TabsList>
      <TabsContent value='cards' className='h-full'>
        <CardsContent />
      </TabsContent>
    </Tabs>
  )
}

const ResizablePanelSizes = atom<number[]>({
  key: 'resizablePanelSizes',
  default: [50, 50],
  effects: [IndexedDBEffect('resizablePanelSizes', '')],
})
function CardsContent() {
  const [, startTransition] = useTransition()
  const [sizes, setSizes] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(ResizablePanelSizes)
  const [cardDefinitionIds] = useCardDefinitionList()
  const listRef = useRef<HTMLDivElement>(null)
  const handleFocus = (cardDefId: string) => {
    // get CardDefinitionListItem index
    const index = cardDefinitionIds.findIndex((id) => id === cardDefId)
    if (index === -1) return
    // use scrollIntoView
    if (!listRef.current) return
    listRef.current.children[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const handleResize: MouseEventHandler<keyof HTMLElementTagNameMap> = (e) => {
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
              setSizes([(panel1.clientHeight / max) * 100, (panel2.clientHeight / max) * 100])
            })
          }
        }
      }
    }
  }
  return (
    <ResizablePanelGroup
      onClick={handleResize}
      direction='vertical'
      className='min-h-[200px] max-w-xs rounded border'
      id='editor_panel_group'
    >
      <ResizablePanel
        key={sizes[0] + 'panel1'}
        defaultSize={sizes[0]}
        className='shadow-inner shadow-black/10'
        id='editor_panel_1'
      >
        <ScrollArea className='size-full'>
          <div className='flex flex-wrap items-center justify-around' ref={listRef}>
            {cardDefinitionIds.map((id, i) => (
              <CardDefinitionListItem index={i} key={id} definitionId={id} />
            ))}
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle id='editor_panel_handle' />
      <ResizablePanel key={sizes[0] + 'panel2'} defaultSize={sizes[1]} id='editor_panel_2'>
        <CardEditor handleFocus={handleFocus} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function CardGraphicPreview({ graphics }: { graphics: GraphicInstanceType[] }) {
  return (
    <div className='flex max-w-24'>
      {graphics.map((graphic, i) => (
        <div key={graphic.inst_id}>
          <Suspense fallback={<Spinner />}>
            <GraphicInstancePreview graphic={graphic} />
          </Suspense>
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

function CardDefinitionListItem({ definitionId, index }: { definitionId: string; index: number }) {
  const [cardDefinition] = useCardDefinition(definitionId)
  const [selectedId, setSelectedCardDefId] = useRecoilState(selectedCardDefIdState)
  return (
    <>
      <Button
        variant='secondary'
        onClick={() => setSelectedCardDefId(definitionId)}
        className={cn(
          'relative flex h-11 w-full items-center justify-between gap-2 rounded bg-background/50 p-1 px-2',
          {
            'bg-primary/50 hover:bg-primary': selectedId === definitionId,
          },
        )}
      >
        <div className='flex items-center gap-2 font-mono text-xs'>
          <div>{index}</div>
          <CardGraphicPreview graphics={cardDefinition.graphics} />
        </div>
        <div className='text-sm'>{cardDefinition.name}</div>
        <div className='absolute -top-0.5 right-1 font-mono text-[9px] opacity-40'>{cardDefinition.id}</div>
      </Button>
    </>
  )
}

function CardEditor({ handleFocus }: { handleFocus: (cardDefId: string) => void }) {
  const [selectedCardDefId] = useRecoilState(selectedCardDefIdState)
  const [cardDef] = useCardDefinition(selectedCardDefId)
  return (
    <div className='h-full bg-background/50'>
      <div className='flex w-full items-center justify-between px-2 pt-2 text-xs'>
        <div>{cardDef.name}</div>
        <div>
          <Button size='icon' variant='outline' className='scale-75' onClick={() => handleFocus(selectedCardDefId)}>
            <Focus />
          </Button>
        </div>
      </div>
      <div className='select-text px-2 font-mono text-[10px] opacity-40'>{selectedCardDefId}</div>
      <Tabs defaultValue='props' className='w-full max-w-xs' key={selectedCardDefId}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='props'>Props</TabsTrigger>
          <TabsTrigger value='graphics'>Graphics</TabsTrigger>
          <TabsTrigger value='actions'>Actions</TabsTrigger>
        </TabsList>
        <TabsContent value='props'>
          <CardPropEditor cardDefId={selectedCardDefId} />
        </TabsContent>
        <TabsContent value='graphics'>
          <CardGraphicsEditor cardDefId={selectedCardDefId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CardPropEditor({ cardDefId }: { cardDefId: string }) {
  const [cardDef] = useCardDefinition(cardDefId)
  return (
    <div className='flex flex-col gap-2 px-2'>
      {cardDef.cardType === undefined && <CardTypeComboBox cardDefId={cardDefId} />}
      {cardDef.cardType && <EditCardType cardDefId={cardDefId} />}
      {cardDef.cardType && (
        <>
          <AddMissingProps cardDefId={cardDefId} />
          {cardDef.props && (
            <>
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
      <div>{cardDef.cardType}</div>
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
              {!cardDef.props[selected].enabled && <div className='text-xs'>Disabled</div>}
              {cardDef.props[selected].prop_id}
            </div>
          ) : (
            'Select Attribute...'
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
                  {!enabled && <div className='text-xs'>Disabled</div>}
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
          <span className='w-full text-xs opacity-50'>Property {prop.enabled ? 'Enabled' : 'Disabled'}</span>
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
  const [cardDef, setCardDef] = useCardDefinition(cardDefId)
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
      <Label className='text-xs' htmlFor='0'>
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
      <Label className='flex items-center justify-between text-xs'>
        <span className='w-2/3 text-center'>Text Origin</span>
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
      <Label className='flex items-center justify-between text-xs'>
        <span>Width</span>
        <span>X Scale</span>
        <span>R.Order -/+</span>
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

function CardGraphicsEditor({ cardDefId }: { cardDefId: string }) {
  const [cardDef] = useCardDefinition(cardDefId)
  return <div className='flex flex-col gap-2 px-2'>{/* <SelectCardGraphicsComboBox cardDefId={cardDefId} /> */}</div>
}
