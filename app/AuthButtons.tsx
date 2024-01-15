import { Button } from '@/src/components/ui/button'
import { signIn, signOut } from 'next-auth/react'

function AuthButtons(session) {
  return (
    <>
      {session.status === 'unauthenticated' ? (
        <Button onClick={() => signIn()}>SIGN IN</Button>
      ) : (
        <div className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5'>
          <Button onClick={() => signOut()}>SIGN OUT</Button>
        </div>
      )}
    </>
  )
}
