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
import React, { ReactNode, useMemo } from 'react'
import { cn } from '@/src/lib/utils'
import { useSession } from 'next-auth/react'
import { DiscordLogoIcon, PersonIcon } from '@radix-ui/react-icons/'
import { Spinner } from './Spinner'
import Image from 'next/image'
import { Button } from './ui/button'

const NEXTAUTH_URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL || ''

type NavComponent = {
  heading: React.ReactNode
  href: string
  description?: React.ReactNode
  key: string
}

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

  const components: NavComponent[] = useMemo(() => {
    if (session.status === 'authenticated') {
      const {
        user: { image, email },
      } = session.data!
      return [
        {
          key: 'user_profile',
          heading: (
            <span className='flex items-start gap-4'>
              <Image className='rounded-full' src={image} width={64} height={64} alt='your profile picture' />
              <span className='flex flex-col justify-center gap-2'>
                <span>{email}</span>
                <span>status: cool 😎</span>
                <span>level: 1</span>
              </span>
            </span>
          ),
          href: '#',
        },
        {
          key: 'sign_out',
          heading: <Button className='w-full'>Sign out</Button>,
          href: '/api/auth/signout',
          description: '',
        },
      ]
    }
    if (session.status === 'unauthenticated') {
      return [
        {
          key: 'sign_in',
          heading: 'Sign in',
          href: '/api/auth/signin?redirect_uri=' + NEXTAUTH_URL,
          description: (
            <span className='flex gap-3'>
              Sign in with discord <DiscordLogoIcon className='scale-150' />
            </span>
          ),
        },
      ]
    }
    return [
      {
        key: 'loading',
        heading: 'Please wait.',
        href: '#',
        description: <Spinner />,
      },
    ]
  }, [session.status, session.data])
  return (
    <NavigationMenu className='m-0.5'>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{menuSymbol}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-screen max-w-64 p-1'>
              {components.map((component) => (
                <ListItem key={component.key} heading={component.heading} href={component.href}>
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

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'> & { heading: ReactNode }>(
  ({ className, heading, children, ...props }, ref) => {
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
            <div className='text-sm font-medium leading-none'>{heading}</div>
            {/* eslint-disable-next-line tailwindcss/classnames-order*/}
            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = 'ListItem'
