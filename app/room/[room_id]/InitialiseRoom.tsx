'use client'
import { User } from 'party/utils/auth'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { initialiseRoom } from './actions'
import { useFormState, useFormStatus } from 'react-dom'

const initialState = {
  message: '',
}

export default function InitialiseRoom({ user, room_id }: { user: User; room_id: string }) {
  const [state, action] = useFormState(initialiseRoom, initialState)
  const { pending } = useFormStatus()
  return (
    <form action={action}>
      <input name='room_id' type='hidden' value={room_id} />
      <div className='absolute inset-0 flex h-full w-full flex-col items-center justify-center'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <h1 className='scroll-m-20 text-4xl font-extrabold tracking-tight'>This room doesn&apos;t exist</h1>
          <h1 className='scroll-m-20 text-xl tracking-tight'>Give {room_id} a name to create it</h1>
          <div className='grid h-full w-full max-w-xs items-center justify-center gap-3'>
            <Label htmlFor='name'>Room Name</Label>
            <Input
              required
              type='text'
              name='name'
              id='name'
              placeholder={(user.name || user.username) + `'${user.name?.endsWith('s') ? '' : 's'} room`}
            />
            <Button className='mt-3' aria-disabled={pending}>
              Create
            </Button>
            {state?.message && (
              <p aria-live='polite' className='w-full rounded bg-foreground/90 p-2 italic text-red-900' role='status'>
                {state?.message}
                <br />
                Oops 🥺👉👈
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
