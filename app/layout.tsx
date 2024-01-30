import '@/app/theme.css'
import '@/app/global.css'
import { Rubik as FontSans } from 'next/font/google'
import { cn } from '@/src/lib/utils'
import { Suspense } from 'react'

import ClientLayout from '@/src/components/dom/ClientLayout'

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'Card Game Gestures',
  description: 'Demonstrate card motions',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='antialiased' suppressHydrationWarning>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body className={cn('select-none font-sans', fontSans.variable)}>
        {/* To avoid FOUT with styled-components wrap Layout with StyledComponentsRegistry https://beta.nextjs.org/docs/styling/css-in-js#styled-components */}
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}

const Layout = ({ children }) => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'relative',
            width: ' 100%',
            height: '100%',
            overflow: 'auto',
            touchAction: 'auto',
          }}
        >
          {children}
        </div>
      }
    >
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  )
}
