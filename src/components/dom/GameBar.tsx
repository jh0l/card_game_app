import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/src/components/ui/navigation-menu'

export default function GameBar() {
  return (
    <NavigationMenu className='absolute inset-x-0 top-1 mx-auto'>
      {/* <NavigationMenuList>
        <NavigationMenuItem className='invisible'>
          <NavigationMenuTrigger></NavigationMenuTrigger>
        </NavigationMenuItem>
        <NavigationMenuItem className='absolute'>
          <NavigationMenuTrigger>
            <div className='flex items-center justify-center'>+</div>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-screen max-w-64 p-1'>Bing bong 😎</ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList> */}
    </NavigationMenu>
  )
}
