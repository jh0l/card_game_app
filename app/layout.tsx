import '@/app/theme.css'
import '@/app/global.css'
// import { Rubik as FontSans } from 'next/font/google'
import localFont from 'next/font/local'
import { cn } from '@/src/lib/utils'

const fontSans = localFont({
  src: './Rubik-Regular.ttf',
  variable: '--font-sans',
})

import ClientLayout from '@/src/components/dom/ClientLayout'

// export const fontSans = FontSans({
//   subsets: ['latin'],
//   variable: '--font-sans',
// })

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
