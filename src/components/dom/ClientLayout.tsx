'use client'

import { useRef } from 'react'
import { RecoilRoot } from 'recoil'
import { SessionProvider } from 'next-auth/react'
import NavBar from '@/src/components/dom/NavBar'
import { ThemeProvider } from '@/src/components/theme-provider'
import Scene from '@/src/components/canvas/Scene'
import { ApplyPendingRedirect } from '@/src/state/site'
// import dynamic from 'next/dynamic'

// const Scene = dynamic(() => import('@/src/components/canvas/Scene'), { ssr: false })

export default function ClientLayout({ children }) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
      <SessionProvider>
        <RecoilRoot>
          <ApplyPendingRedirect />
          <div
            ref={ref}
            style={{
              position: 'relative',
              width: ' 100%',
              height: '100%',
              overflow: 'auto',
              touchAction: 'auto',
            }}
          >
            {children}
            <Scene
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100dvw',
                height: '100dvh',
                pointerEvents: 'none',
              }}
              eventSource={ref}
              eventPrefix='client'
            />
          </div>
          <div
            className='pointer-events-none absolute inset-x-0 top-0 mx-auto h-full w-full max-w-screen-lg'
            id='Html-portal'
          ></div>
          <div className='fixed left-0 top-0 z-20'>
            <NavBar />
          </div>
        </RecoilRoot>
      </SessionProvider>
    </ThemeProvider>
  )
}
