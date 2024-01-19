'use client'

import { Button } from '@/src/components/ui/button'
import HomeIcon from '@/src/lib/icons/HomeIcon'
import { useCameraReset } from '@/src/state/scene'

export function TopRightMenu() {
  const [value, setValue] = useCameraReset()
  return (
    <div className='pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex w-full max-w-screen-lg justify-end p-1'>
      <div className='pointer-events-auto flex flex-col gap-2'>
        <Button disabled={value < 1} onClick={() => setValue(-1)}>
          <HomeIcon />
        </Button>
      </div>
    </div>
  )
}
