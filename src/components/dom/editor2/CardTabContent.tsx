/* eslint-disable @next/next/no-img-element */
'use client'
import { Spinner } from '@/src/components/dom/Spinner'
import { Button } from '@/src/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/src/components/ui/resizable'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import {
  CardDefinitionType,
  GraphicInstanceType,
  highlightSelectedCardDefIdState,
  randomId,
  selectedCardDefIdState,
  useCardDefinition,
  useCardDefinitionList,
  useCardDefinitionsListSet,
  useGraphicDefinition,
  useImageDefUrl,
  useResetCardDefinition,
  useSetCardDefinition,
} from '@/src/state/assets'
import { IndexedDBEffect } from '@/src/state/effects'
import { Check, ChevronsUpDown, Focus, Menu } from 'lucide-react'
import { MouseEventHandler, Suspense, useState, useRef, useTransition, useLayoutEffect } from 'react'
import { atom, useRecoilState, useRecoilState_TRANSITION_SUPPORT_UNSTABLE, useSetRecoilState } from 'recoil'
import { CardPropEditor } from './CardPropEditor'
import CardGraphicsEditor from '@/src/components/dom/editor2/CardGraphicsEditor'
import { TargetIcon } from '@radix-ui/react-icons'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { useHandCardsList, useHandCardsListSet, useTableCardListSet } from '@/src/state/room'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/src/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'

export function HandContent() {
  const [handIds, setHandCardIds] = useHandCardsList()
  const handleAddCard = (id: string) => {
    setHandCardIds((prev) => [...prev, { def_id: id, inst_id: randomId() }])
  }
  return (
    <div className='flex w-full flex-col gap-1 p-2'>
      <CardDefComboBox value={''} setValue={handleAddCard} />

      {handIds.map((id, i) => (
        <CardHandInstance id={id.def_id} index={i} key={id.inst_id} />
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
    <div className='flex max-w-xs items-center gap-1 overflow-hidden'>
      <CardDefComboBox value={id} setValue={changeIndexCardDef} />
      <Button variant='outline' size='icon' className='scale-90'>
        <Menu />
      </Button>
      {/* <Button onClick={deleteCard} variant='outline' size='sm'>
        &times;
      </Button> */}
    </div>
  )
}
function CardDefComboBox({ value, setValue }: { value?: string; setValue: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [cardDefIds] = useCardDefinitionList()
  const [cardDefValue] = useCardDefinition(value || '')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='relative flex h-fit w-full justify-between'
        >
          {value ? (
            <div className='flex w-full flex-wrap items-center justify-between gap-1'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className='max-w-52 overflow-x-auto overflow-y-hidden text-left text-xs'>
                {cardDefValue.name || <span className='italic text-red-500/70'>card has no name</span>}
              </div>
              <CardGraphicPreview graphics={cardDefValue.graphics} />
            </div>
          ) : (
            'Add Card...'
          )}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full min-w-[200px] max-w-xs'>
        <Command>
          {cardDefIds.length > 3 && <CommandInput placeholder='Search Cards...' />}
          {cardDefIds.length === 0 && <CommandGroup heading='No Card Definitions' />}
          {cardDefIds.length > 0 && <CommandEmpty> No Cards Match Search</CommandEmpty>}
          <ScrollArea className='max-h-96 overflow-y-scroll'>
            <CommandGroup>
              {cardDefIds.map((defId) => (
                <Suspense key={defId} fallback={<Spinner />}>
                  <CardDefCommandItem
                    key={defId}
                    id={defId}
                    value={value || ''}
                    setValue={(v) => {
                      setValue(v)
                      setOpen(false)
                    }}
                  />
                </Suspense>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
function CardDefCommandItem({ id, setValue, value }: { id: string; setValue: (value: string) => void; value: string }) {
  const [cardDef] = useCardDefinition(id)
  return (
    <CommandItem
      value={id + ' ' + cardDef.name}
      onSelect={() => {
        setValue(id)
      }}
    >
      <div className='flex w-full items-center justify-between gap-1 text-xs'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className='w-full overflow-x-auto overflow-y-hidden text-left text-xs'>
          {cardDef.name || <span className='italic text-red-500/70'>card has no name</span>}
        </div>
        <CardGraphicPreview graphics={cardDef.graphics} />
        <Check className={cn('mr-2 h-4 w-4', value === id ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}
const ResizablePanelSizes = atom<number[]>({
  key: 'cardEditorresizablePanelSizes',
  default: [50, 50],
  effects: [IndexedDBEffect('cardEditorresizablePanelSizes', '')],
})
export function CardsContent() {
  const [, startTransition] = useTransition()
  const [sizes, setSizes] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(ResizablePanelSizes)
  const [cardDefinitionIds, setCardDefIds] = useCardDefinitionList()
  const listRef = useRef<HTMLDivElement>(null)
  const handleFocus = (cardDefId: string, behavior: ScrollBehavior = 'smooth') => {
    // get CardDefinitionListItem index
    const index = cardDefinitionIds.findIndex((id) => id === cardDefId)
    if (index === -1) return
    // use scrollIntoView
    if (!listRef.current) return
    listRef.current.children[index].scrollIntoView({ behavior, block: 'center' })
  }
  const handleResize: MouseEventHandler<keyof HTMLElementTagNameMap> = (e) => {
    // event trigger
    // determine if the the mouse event was triggered by one of the resizable panels or th handle
    if ('nativeEvent' in e) {
      if ('target' in e.nativeEvent && e.nativeEvent.target instanceof HTMLElement) {
        const groupId = e.nativeEvent.target.getAttribute('data-panel-group-id')
        if (!groupId) return
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
  const setSelectedCardDefId = useSetRecoilState(selectedCardDefIdState)
  const [newCardId, setNewCardId] = useState(() => randomId())
  const setNewCardDefinition = useSetCardDefinition(newCardId)
  const handleNewCardDefinition = () => {
    // create a new card definition and set it as selected
    setNewCardDefinition({
      id: newCardId,
      name: '',
      label: '',
      description: '',
      graphics: [],
      props: {},
    })
    setSelectedCardDefId(newCardId)
    setCardDefIds((prev) => [...prev, newCardId])
    setNewCardId(randomId())
  }
  return (
    <>
      <div className='w-[98%] px-1 pt-1'>
        <Button size='sm' className='w-full' onClick={handleNewCardDefinition}>
          New Card Definition
        </Button>
      </div>
      <ResizablePanelGroup
        onDrag={handleResize}
        onMouseUp={handleResize}
        onMouseLeave={handleResize}
        direction='vertical'
        className='max-w-xs rounded border bg-background/50'
        id='card_editor_panel_group'
      >
        <ResizablePanel defaultSize={sizes[0]} key={sizes[0] + 'p1'} id='card_editor_panel_1'>
          <ScrollArea className='size-full'>
            <div className='flex h-full w-[98%] flex-wrap items-center justify-start gap-1 px-1 pt-1' ref={listRef}>
              {cardDefinitionIds.map((id, i) => (
                <CardDefinitionListItem index={i} key={id} definitionId={id} />
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
          id='card_editor_panel_2'
        >
          <ScrollArea className='h-full'>
            <CardEditor handleFocus={handleFocus} />
            <div className='my-20 flex w-full items-center justify-center opacity-10'>_____</div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}
function CardGraphicPreview({ graphics }: { graphics: GraphicInstanceType[] }) {
  return (
    <div className='flex max-w-24 items-center justify-center'>
      {graphics.map((graphic) => (
        <Suspense fallback={<Spinner />} key={graphic.inst_id}>
          <GraphicInstancePreview graphic={graphic} />
        </Suspense>
      ))}
    </div>
  )
}
function GraphicInstancePreview({ graphic }: { graphic: GraphicInstanceType }) {
  const [graphicDef] = useGraphicDefinition(graphic.graphic_id)
  const imageDef = useImageDefUrl(graphicDef.image)
  return (
    <img
      src={imageDef.url}
      alt='.'
      className='flex h-min max-h-8 max-w-8 items-center justify-center object-contain pr-0.5'
    />
  )
}

function CardDefinitionListItem({ definitionId, index }: { definitionId: string; index: number }) {
  const [cardDefinition] = useCardDefinition(definitionId)
  const [selectedId, setSelectedCardDefId] = useRecoilState(selectedCardDefIdState)
  return (
    <Button
      variant='secondary'
      onClick={() => setSelectedCardDefId(definitionId)}
      className={cn(
        'relative flex h-11 w-full max-w-xs items-center justify-between gap-2 overflow-hidden rounded bg-background/50 p-1 px-1',
        {
          'bg-primary/50 hover:bg-primary/70': selectedId === definitionId,
        },
      )}
    >
      <div className='h-full font-mono text-xs opacity-60'>{index}</div>
      <div className='w-full overflow-x-auto overflow-y-hidden text-left text-xs'>{cardDefinition.name}</div>
      <div className='flex w-full max-w-fit items-center justify-center'>
        <CardGraphicPreview graphics={cardDefinition.graphics} />
      </div>
    </Button>
  )
}
const selectedCardEditorTabState = atom<string>({
  key: 'selectedCardEditorTab',
  default: 'props',
  effects: [IndexedDBEffect('selectedCardEditorTab', '')],
})
function CardEditor({ handleFocus }: { handleFocus: (defId: string, behavior?: ScrollBehavior) => void }) {
  const [cloneId, setCloneId] = useState(() => randomId())
  const setClone = useSetCardDefinition(cloneId)
  const setIds = useCardDefinitionsListSet()
  const setHandIds = useHandCardsListSet()
  const setTableIds = useTableCardListSet()
  const [selectedCardDefId, setSelected] = useRecoilState(selectedCardDefIdState)
  const [cardDef, setCardDef] = useCardDefinition(selectedCardDefId)
  const reset = useResetCardDefinition(selectedCardDefId)
  const [highlight, setHighlight] = useRecoilState(highlightSelectedCardDefIdState)
  const [tabValue, setTabValue] = useRecoilState(selectedCardEditorTabState)
  const handleSetHighlight = () => setHighlight((x) => !x)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // update cardDef name
    setCardDef((prev) => ({ ...prev, name: e.target.value }))
  }
  const handleClone = () => {
    const deepClone = JSON.parse(JSON.stringify(cardDef)) as CardDefinitionType
    setClone({ ...deepClone, id: cloneId })
    setIds((prev) => [...prev, cloneId])
    setSelected(cloneId)
    setCloneId(randomId())
  }
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card definition?')) {
      setIds((prev) => {
        return prev.filter((id) => id !== selectedCardDefId)
      })
      setHandIds((prev) => {
        return prev.filter((id) => id.def_id !== selectedCardDefId)
      })
      setTableIds((prev) => {
        return prev.filter((id) => id.def_id !== selectedCardDefId)
      })
      reset()
      setSelected('')
    }
  }
  const [mountFocus, setMountFocus] = useState<string>('')
  useLayoutEffect(() => {
    if (selectedCardDefId !== mountFocus) {
      setMountFocus(selectedCardDefId)
      handleFocus(selectedCardDefId, 'instant')
    }
  }, [selectedCardDefId, handleFocus, mountFocus])
  if (!selectedCardDefId) return null
  return (
    <div className='relative h-full max-w-xs' key={selectedCardDefId}>
      <div className='flex w-full items-center justify-between gap-2 p-2'>
        <Label size='xs'>Card Definition</Label>
        <div className='flex gap-2'>
          <Button size='xs' variant='secondary' onClick={handleClone}>
            Clone
          </Button>
          <Button size='xs' variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Label size='2xs' className='flex px-2'>
        <div className='w-full'>Definition Name </div>
        <div className='w-full select-text text-center font-mono text-[10px] opacity-40'>{selectedCardDefId}</div>
      </Label>
      <div className='flex w-full items-center justify-between px-1 pb-0.5 text-xs'>
        <Input id='card_name' defaultValue={cardDef.name} onChange={handleNameChange} className='h-9' />
        <div className='flex items-center justify-center pl-2'>
          <Button
            size='icon'
            variant={highlight ? 'default' : 'outline'}
            className='scale-75'
            onClick={handleSetHighlight}
          >
            <TargetIcon />
          </Button>
          <Button size='icon' variant='outline' className='scale-75' onClick={() => handleFocus(selectedCardDefId)}>
            <Focus />
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue='props'
        className='w-full max-w-xs'
        key={selectedCardDefId}
        value={tabValue}
        onValueChange={setTabValue}
      >
        <TabsList className='grid w-full grid-cols-3' selected>
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
        <TabsContent value='actions'>
          <CardActions cardDefId={selectedCardDefId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
function CardActions({ cardDefId }: { cardDefId: string }) {
  const setHandIds = useHandCardsListSet()
  const handleAddToHand = () => {
    setHandIds((prev) => [...prev, { def_id: cardDefId, inst_id: randomId() }])
  }
  return (
    <div className='flex w-full flex-col items-center justify-center p-2'>
      <Button className='w-full' onClick={handleAddToHand}>
        Add To Hand
      </Button>
    </div>
  )
}
