'use client'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/src/components/ui/navigation-menu'
import { useEffect, useState } from 'react'

export default function GameBar() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setOpen(true)
    }, 3333)
  }, [])
  return (
    <NavigationMenu className='absolute inset-x-0 top-0 mx-auto'>
      <NavigationMenuList>
        <NavigationMenuItem className='invisible'>
          <NavigationMenuTrigger></NavigationMenuTrigger>
        </NavigationMenuItem>
        <NavigationMenuItem className='absolute'>
          <NavigationMenuTrigger>
            <div className='flex items-center justify-center'>Life Points: 8000</div>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-screen max-w-64 p-1'>Bing bong 😎</ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
