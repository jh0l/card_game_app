import SpinnerLight from '@/src/components/dom/SpinnerLight'
import dynamic from 'next/dynamic'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false })
export default function Layout({ children }) {
  return (
    <main className='relative h-[100dvh] select-none'>
      {children}
      <div className='absolute inset-0'>
        <GameClient />
      </div>
    </main>
  )
}
