'use server'

import { headers } from 'next/headers'

import { revalidatePath } from 'next/cache'
import { PartyServer } from '@/src/lib/types'
import { PARTYKIT_URL } from '@/src/env'

export async function initialiseRoom(
  prevState: {
    message: string
  },
  formData: FormData,
) {
  const name = formData.get('name')?.toString()
  const room_id = formData.get('room_id')?.toString()
  if (!name || !room_id) return { message: 'Missing ' + (!name ? 'name' : 'room id') }
  try {
    const cookie = headers().get('cookie') ?? ''
    const CREATE_URL = `${PARTYKIT_URL}/party/${room_id}/create?_pk=null`
    const res = (await (
      await fetch(CREATE_URL, {
        method: 'POST',
        body: JSON.stringify({ name } as PartyServer['party']['onRequest']['POST']['request']),
        headers: {
          cookie,
        },
        next: {
          revalidate: 0,
        },
      })
    ).json()) as PartyServer['party']['onRequest']['POST']['response']
    if (!res.ok) return { message: 'Error creating room' }
  } catch (e) {
    console.error(e)
    return { message: 'Error creating room' }
  }
  revalidatePath('/' + room_id)
  return { message: 'Room created' }
}
