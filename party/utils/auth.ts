import { Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import type * as Party from 'partykit/server'

export type User = {
  username: string
  name?: string
  email?: string
  image?: string
  expires?: string
}

export type AppSession = Session & {
  user: Session['user'] & { username: JWT['username'] }
  token: JWT
}

/** Check that the user exists, and isn't expired */
export const isSessionValid = (session?: User | null): session is User => {
  return Boolean(session && (!session.expires || session.expires > new Date().toISOString()))
}
const AUTH_URL = process.env.LOCAL_NEXTAUTH_URL || process.env.NEXTAUTH_URL || ''
/**
 * Authenticate the user against the NextAuth API of the server that proxied the request
 */
export const getNextAuthSession = async (proxiedRequest: Party.Request) => {
  const { headers } = proxiedRequest
  const cookie = headers.get('cookie') ?? ''

  const url = `${AUTH_URL}/session`
  console.log(url, cookie)
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Cookie: cookie,
    },
  })

  if (res.ok) {
    const session = await res.json()
    if (isSessionValid(session.user)) {
      return session as Session
    }
  } else {
    console.error('Failed to authenticate user', await res.text())
  }

  return null
}
