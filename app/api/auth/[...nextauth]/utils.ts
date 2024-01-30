import { authOptions } from './authOptions'
import { getServerSession as _getServerSession } from 'next-auth'
import { AppSession } from 'party/utils/auth'

/**
 * wrapper around next-auth/getServerSession with JWT and AdapterUser added to session based on current authOptions config
 */
export function getServerSession() {
  return _getServerSession(authOptions) as Promise<AppSession | null>
}
