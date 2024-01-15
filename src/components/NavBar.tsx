'use client'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/src/components/ui/navigation-menu'
import React, { useMemo } from 'react'
import { cn } from '../lib/utils'
import { useSession } from 'next-auth/react'
import { PersonIcon } from '@radix-ui/react-icons/'
import { Spinner } from './Spinner'

export default function NavBar() {
  const session = useSession()
  const menuSymbol = useMemo(() => {
    if (session.status === 'authenticated') {
      return <div>{session.data.user!.name}</div>
    }
    if (session.status === 'unauthenticated') {
      return <PersonIcon />
    }
    return <Spinner />
  }, [session.status, session.data])

  const components = useMemo(() => {
    if (session.status === 'authenticated') {
      return [
        {
          title: 'Logout',
          href: '/api/auth/signout',
          description: 'Sign out of your account.',
        },
      ]
    }
    if (session.status === 'unauthenticated') {
      return [
        {
          title: 'Login',
          href: '/api/auth/signin',
          description: 'Sign in to your account.',
        },
      ]
    }
    return [
      {
        title: 'Please wait.',
        href: '#',
        description: <Spinner />,
      },
    ]
  }, [session.status])
  return (
    <NavigationMenu className='m-0.5'>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{menuSymbol}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-screen max-w-64 gap-3 p-4'>
              {components.map((component) => (
                <ListItem key={component.title} title={component.title} href={component.href}>
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuIndicator />
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className='text-sm font-medium leading-none'>{title}</div>
            {/* eslint-disable-next-line tailwindcss/classnames-order*/}
            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = 'ListItem'
