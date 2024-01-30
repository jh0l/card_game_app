'use client'
import { Button } from '@/src/components/ui/button'
import { usePendingRedirect } from '@/src/state/site'
import { signIn } from 'next-auth/react'

export default function SignInWithRedirectBack() {
  const setRedirect = usePendingRedirect()
  return (
    <Button
      variant='outline'
      onClick={() => {
        setRedirect(window.location.pathname)
        signIn()
      }}
    >
      Join
    </Button>
  )
}
