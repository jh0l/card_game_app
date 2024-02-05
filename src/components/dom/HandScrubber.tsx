'use client'
import { Button } from '@/src/components/ui/button'
import { throttler } from '@/src/lib/utils'
import {
  MAX_VISIBLE_CARDS,
  useCardRange,
  useCardRangeValue,
  useHandCardsListValue,
  useCardRangeSet,
} from '@/src/state/room'
import { useSpring, animated } from '@react-spring/web'
import { Bounds, useDrag } from '@use-gesture/react'
import Image from 'next/image'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'

type BoundsExt = Bounds & {
  mid: number
  width: number
  cardWidth: number
  offset: number
}
const lastSelfEvent: { time: number } = { time: 0 }
export function HandScrubber() {
  const cards = useHandCardsListValue()
  const [cardRange, setCardRange] = useCardRange()
  const [calculateBounds, setCalculateBounds] = useState(0)
  const [bounds, setBounds] = useState<BoundsExt>({ mid: 0, width: 0, cardWidth: 0, offset: 0 })
  const parentRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const [resizeObserver] = useState(() => {
    if (!window.ResizeObserver) {
      // return dummy observer
      return {
        observe: () => {},
        unobserve: () => {},
        disconnect: () => {},
      }
    }
    try {
      return new ResizeObserver(() => {
        setCalculateBounds((x) => x + 1)
      })
    } catch (e) {
      throw new Error("ResizeObserver doesn't exist")
    }
  })
  useEffect(() => {
    parentRef.current && resizeObserver.observe(parentRef.current)
  }, [resizeObserver])
  useEffect(() => {
    // recalculate bounds when calculateBounds changes (triggered by resize)
    if (parentRef.current && cardsRef.current) {
      const first = cardsRef.current.firstChild
      const last = cardsRef.current.lastChild
      if (!(first instanceof Element) || !(last instanceof Element)) {
        // hand is empty
        return
      }
      // get boundingRect of first card in child nodes of parentRef
      const firstRect = first.getBoundingClientRect()
      const lastRect = last.getBoundingClientRect()
      const width = lastRect.right - firstRect.left
      // get offset from left of parentRef
      // @ts-ignore
      const offset = parentRef.current.getBoundingClientRect().left
      const cardWidth = firstRect.width
      const bounds: BoundsExt = {
        left: firstRect.left - offset,
        right: lastRect.right - offset,
        mid: firstRect.left + width / 2,
        width,
        cardWidth,
        offset,
      }
      setBounds(bounds)
    }
  }, [calculateBounds])
  useEffect(() => {
    setCalculateBounds((x) => x + 1)
  }, [cards.length])
  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    width: 0,
    opacity: 0,
    config: { mass: 1.3, friction: 88, tension: 2000, clamp: true },
  }))
  useEffect(() => {
    // if the scrubber is being used, don't update it
    if (Date.now() - lastSelfEvent.time < 500) return
    // set the scrubber to the correct position when the card range changes
    const width = Math.min(Math.min(MAX_VISIBLE_CARDS, cards.length) * bounds.cardWidth, bounds.width)
    const cardWidth = bounds.cardWidth
    const x = (bounds.left || 0) + cardRange[0] * cardWidth
    setSpring.start({ x, width })
  }, [cardRange, bounds, setSpring, cards.length, spring.x])
  useEffect(() => {
    // update the scrubber when the bounds or card length changes
    const width = Math.min(Math.min(MAX_VISIBLE_CARDS, cards.length) * bounds.cardWidth, bounds.width)
    lastSelfEvent.time = Date.now()
    let _x = spring.x.get()
    // if current _x is before the left bound, move it to the left bound
    if (_x < (bounds.left || 0)) {
      _x = bounds.left || 0
    } else if (_x > (bounds.right || 0) - width) {
      _x = (bounds.right || 0) - width
    } else {
      // snap _x to the nearest card
      const cardWidth = bounds.cardWidth
      const left = bounds.left || 0
      _x = Math.round((_x - left) / cardWidth) * cardWidth + left
    }
    setSpring.start({
      x: _x,
      width,
      opacity: 1,
      config: { mass: 1.3, friction: 100, tension: 4000, clamp: true },
    })
    const left = bounds.left || 0
    const cardWidth = bounds.cardWidth
    // set the card range to the cards that are visible in the scrubber
    const start = Math.round((_x - left) / cardWidth)
    const end = Math.round((_x + width - left) / cardWidth)
    setCardRange([start, end])
  }, [bounds, setSpring, spring.x, cards.length, setCardRange])
  const bind = useDrag(({ xy: [xE], event }) => {
    const left = bounds.left || 0
    const right = bounds.right || 0
    event.stopPropagation()
    const width = spring.width.get()
    let x = xE - bounds.offset - width / 2 // limit x to bounds of left and right
    x = Math.max(x, left)
    x = Math.min(x, right - width)
    // snap so that the edges of the scrubber align with the edges of the cards
    const cardWidth = bounds.cardWidth
    x = Math.round((x - left) / cardWidth) * cardWidth + left
    const update = (x: number) => {
      const start = Math.round((x - left) / cardWidth)
      const end = Math.round((x + width - left) / cardWidth)
      setCardRange([start, end])
    }
    lastSelfEvent.time = Date.now()
    setSpring.start({
      x,
      config: { mass: 1.3, friction: 88, tension: 1500, clamp: true },

      onChange({ value: { x } }) {
        update(x)
      },
      onRest({ value: { x } }) {
        update(x)
      },
      onStart({ value: { x } }) {
        update(x)
      },
    })
  })
  const onClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    // prevent other cards from being clicked
    e.stopPropagation()
    let x = e.currentTarget.getBoundingClientRect().left - bounds.offset - spring.width.get() / 2
    const width = Math.min(Math.min(MAX_VISIBLE_CARDS, cards.length) * bounds.cardWidth, bounds.width)
    const left = bounds.left || 0
    const right = bounds.right || 0
    x = Math.max(x, left)
    x = Math.min(x, right - width)
    // snap so that the edges of the scrubber align with the edges of the cards
    const cardWidth = bounds.cardWidth
    x = Math.round((x - left) / cardWidth) * cardWidth + left
    const update = (x: number) => {
      const start = Math.round((x - left) / cardWidth)
      const end = Math.round((x + width - left) / cardWidth)
      setCardRange([start, end])
    }
    lastSelfEvent.time = Date.now()
    setSpring.start({
      x,
      onChange({ value: { x } }) {
        update(x)
      },
      onRest({ value: { x } }) {
        update(x)
      },
      onStart({ value: { x } }) {
        update(x)
      },
    })
  }
  // @ts-ignore
  const bindType = bind()
  return (
    <div className='absolute inset-x-5 bottom-[1%] z-10 mx-auto flex h-14 w-[90%] max-w-screen-md items-center justify-center rounded bg-white/0'>
      <div className='absolute inset-0 flex w-full justify-center rounded' ref={cardsRef}>
        {cards.map((key) =>
          key === undefined ? (
            <div key={key}></div>
          ) : (
            <CardButton key={key.inst_id} identity={key.def_id} onClick={onClick} />
          ),
        )}
      </div>
      <div className='absolute inset-0 h-0 w-full' ref={parentRef}>
        {cards.length > 0 && (
          <animated.div
            className='flex h-14 items-center justify-center overflow-hidden rounded text-xs shadow-inner outline outline-primary/75'
            style={{ touchAction: 'none', ...spring }}
            {...bindType}
          >
            👁👄👁
          </animated.div>
        )}
      </div>
      {/* <TestThrottle /> */}
    </div>
  )
}

function CardButton({ identity, onClick }: { identity: string; onClick: MouseEventHandler<HTMLButtonElement> }) {
  // const { color } = useCardColor(identity)
  return (
    <button className='relative max-h-14 w-full max-w-[37.333px]' onClick={onClick}>
      <Image
        src='/img/cards/melty-boy0-q25.png'
        alt='a playing card'
        fill
        sizes='(max-width: 56px) 56px'
        className='pointer-events-none h-fit w-full max-w-[37.333px] rounded object-cover mix-blend-overlay'
      />
      <div className='absolute inset-0 top-3/4 flex items-center justify-center text-xs'></div>
    </button>
  )
}

// function TestThrottle() {
//   const range = useCardRangeValue()
//   const cards = useHandCardsListValue()
//   const setCardRange = useCardRangeSet()
//   const [throt] = useState(() => throttler(100, 1000))

//   return (
//     <div className='absolute -top-12 flex items-center gap-2 rounded bg-white'>
//       <Button
//         onClick={() => {
//           if (throt()) {
//             setCardRange((x) => {
//               const newRange = [...x]
//               if (newRange[0] > 0) {
//                 newRange[0]--
//                 newRange[1]--
//               }
//               return newRange
//             })
//           }
//         }}
//       >
//         Dw
//       </Button>
//       <div className='text-black'>
//         {range[0] + 1} - {range[1]}
//       </div>
//       <Button
//         onClick={() => {
//           if (throt()) {
//             setCardRange((x) => {
//               const newRange = [...x]
//               if (newRange[1] < cards.length) {
//                 newRange[0]++
//                 newRange[1]++
//               }
//               return newRange
//             })
//           }
//         }}
//       >
//         Up
//       </Button>
//     </div>
//   )
// }
