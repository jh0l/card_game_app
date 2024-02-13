'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from 'src/lib/utils'

const TabsContext = React.createContext({
  index: 0,
  count: 0,
  selected: 0,
})

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ children, ...props }, ref) => {
  const [selected, setSelected] = React.useState(props.value || props.defaultValue)
  const onValueChange = (value: string) => {
    setSelected(value)
    props.onValueChange?.(value)
  }
  let elements = React.Children.toArray(children)
  if (elements.length > 1) {
    // @ts-ignore
    elements[0] = React.cloneElement(elements[0], { selected: props.value || selected })
  }
  return (
    <TabsPrimitive.Root {...props} ref={ref} onValueChange={onValueChange}>
      {elements}
    </TabsPrimitive.Root>
  )
})
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { selected?: string | boolean }
>(({ className, children, selected, ...props }, ref) => {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'relative inline-flex h-9 items-center justify-center rounded-md bg-muted/50 px-1 text-muted-foreground',
        className,
      )}
      {...props}
    >
      <Wrapper selected={String(selected)}>{children}</Wrapper>
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

function Wrapper({ children, selected }: { children: React.ReactNode[] | React.ReactNode; selected?: string }) {
  const [{ index, count }, setIndex] = React.useState({ index: 0, count: 0 })
  React.useEffect(() => {
    React.Children.forEach(children, (child, i) => {
      if (React.isValidElement(child)) {
        if (child.props.value === selected) {
          setIndex({ index: i, count: React.Children.count(children) })
        }
      }
    })
  }, [selected, children])
  return (
    <>
      {/* indicator of which tab is active */}
      <div className='pointer-events-none absolute flex size-full items-center px-1'>
        <div className='relative size-full h-7'>
          <div
            className='absolute h-7 rounded backdrop-invert transition-[left]'
            style={{ width: `${(1 / count) * 100}%`, left: `${(index / count) * 100}%` }}
          ></div>
        </div>
      </div>
      {children}
    </>
  )
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'data- inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
