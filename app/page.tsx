import SpinnerLight from '@/src/components/dom/SpinnerLight'
import dynamic from 'next/dynamic'
const GameClient = dynamic(() => import('@/src/components/GameClient'), { ssr: false, loading: SpinnerLight })

export default function Page() {
  return (
    <>
      <main className='relative h-[100dvh]'>
        <GameClient />
      </main>
      {/* <main className='relative h-[100dvh]'>
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
          <h1 className='scroll-m-20 text-xl tracking-tight'>We&apos;re in the arena trying stuff.</h1>
          <Button asChild>
            <Link href='/testroom'>Try it out</Link>
          </Button>
        </div>
      </main> */}
    </>
  )
}
