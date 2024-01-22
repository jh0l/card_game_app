'use client'

import { Button } from '@/src/components/ui/button'
import Crosshair2Icon from '@/src/lib/icons/Crosshair2Icon'
import HandIcon from '@/src/lib/icons/HandIcon'
import LockOpen1Icon from '@/src/lib/icons/LockOpen1Icon'
import { useCamControls } from '@/src/state/scene'

export function TopRightMenu() {
  const [value, setValue] = useCamControls()
  const onClick = () => setValue((v) => (v === 'enabled' ? 'disabled' : 'enabled'))
  return (
    <div className='pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex w-full max-w-screen-lg justify-end p-1'>
      <div className='pointer-events-auto flex flex-col gap-2'>
        <Button className='w-[50px]' onClick={onClick} variant={value === 'enabled' ? 'destructive' : 'outline'}>
          {value === 'enabled' ? <LockOpen1Icon /> : <HandIcon />}
        </Button>
        {value !== 'disabled' && (
          <Button className='w-[50px]' onClick={() => setValue('reset')} variant='destructive'>
            <Crosshair2Icon />
          </Button>
        )}
      </div>
    </div>
  )
}
