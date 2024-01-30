'use client'
import { PARTYKIT_HOST } from '@/src/env'

import { AppSession } from 'party/utils/auth'
import PartySocket from 'partysocket'
import usePartySocket from 'partysocket/react'

const identify = async (socket: PartySocket) => {
  // the ./auth route will authenticate the connection using the user's session cookie
  const url = `/party/${window.location.pathname}/auth?_pk=${socket._pk}`
  const req = await fetch(url, { method: 'POST' })
  if (!req.ok) {
    const res = await req.text()
    console.error('Failed to authenticate connection', res)
  }
}

export default function RoomPartySocket({ room_id }: { room_id: string }) {
  usePartySocket({
    host: PARTYKIT_HOST,
    room: room_id,
    onOpen(event) {
      if (event.target) {
        identify(event.target as PartySocket)
      }
    },
  })
  return null
}
