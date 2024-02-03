import { PARTYKIT_URL } from '@/src/env'
import { PartyServer } from '@/src/lib/types'

import { getServerSession } from '@/app/api/auth/[...nextauth]/utils'
import dynamic from 'next/dynamic'
import SpinnerLight from '@/src/components/dom/SpinnerLight'
import InitialiseRoom from './InitialiseRoom'
import { User } from 'party/utils/auth'
import RoomPartySocket from '@/src/components/dom/RoomPartySocket'
const SignInWithRedirectBack = dynamic(() => import('@/src/components/dom/SignInWithRedirectBack'), {
  ssr: false,
  loading: SpinnerLight,
})
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false })

export default async function Page({
  params,
  searchParams,
}: {
  params: { room_id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  console.log('Page', params, searchParams)
  const sus = await getServerSession()
  // console.log(sus)
  const user = sus && (sus.user as User | undefined)

  const { room_id } = params

  // 🎈 send a GET request to the PartyKit room!
  const req = (await fetch(`${PARTYKIT_URL}/party/${room_id}/knock`, {
    method: 'GET',
    next: {
      revalidate: 0,
    },
  })) as PartyServer['party']['onRequest']['GET']['knock']['response']

  if (!req.ok) {
    throw new Error(`Unexpected response: ${req.status}`)
  }

  const { data } = await req.json()

  return (
    <>
      {!user && (
        <div className='absolute inset-0 z-20 bg-background/80'>
          <SignIn />
        </div>
      )}
      {user && data.status === 'uninitialised' && (
        <div className='absolute inset-0 z-20 bg-background/80'>
          <InitialiseRoom user={user} room_id={room_id} />
        </div>
      )}
      {user && data.status === 'open' && (
        <>
          <RoomPartySocket room_id={room_id} />
          <div className='absolute inset-0'>
            <GameClient />
          </div>
        </>
      )}
    </>
  )
}

function SignIn() {
  return (
    <div className='absolute inset-0 flex h-full w-full flex-col items-center justify-center'>
      <div className='flex flex-col items-center justify-center gap-4'>
        <h2 className='scroll-m-20 text-xl font-extrabold tracking-tight'>Sign in to access this room</h2>
        <SignInWithRedirectBack />
      </div>
    </div>
  )
}
