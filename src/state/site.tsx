'use client'
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { localStorageEffect } from './effects'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const pendingRedirect = atom<string | null>({
  key: 'pendingRedirect',
  default: null,
  effects: [localStorageEffect('pendingRedirect')],
})

export const usePendingRedirect = () => {
  return useSetRecoilState(pendingRedirect)
}

export function ApplyPendingRedirect() {
  const router = useRouter()
  const [redirect, setRedirect] = useRecoilState(pendingRedirect)
  useEffect(() => {
    if (redirect) {
      router.replace(redirect)
      setRedirect(null)
    }
  }, [router, redirect, setRedirect])
  return null
}
