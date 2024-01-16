'use client'
import { useCardsListValue, useSetCardRange } from '@/src/state/cards'
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

export function HandScrubber() {
  const cards = useCardsListValue()
  const [images] = useState(() => {
    return Array(cards.length)
      .fill(0)
      .map((_) => ({ src: `/img/cards/melty-boy0-q25.png`, key: Math.random() }))
  })
  const setCardRange = useSetCardRange()
  const [bounds, setBounds] = useState<BoundsExt>({ mid: 0, width: 0, cardWidth: 0, offset: 0 })
  const parentRef = useRef<HTMLDivElement>()
  const cardsRef = useRef<HTMLDivElement>()
  const [resizeObserver] = useState(() => {
    try {
      return new ResizeObserver(() => {
        if (parentRef.current && cardsRef.current) {
          const first = cardsRef.current.firstChild
          const last = cardsRef.current.lastChild
          if (!(first instanceof Element) || !(last instanceof Element)) {
            throw new Error('Tried to get bounding rectangle of cards scrubber when it was empty')
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
      })
    } catch (e) {}
  })
  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    width: 0,
    opacity: 0,
    config: { mass: 1.3, friction: 77, tension: 2000, clamp: true },
  }))
  const bind = useDrag(({ xy: [xE] }) => {
    //params.event.stopPropagation()
    const width = spring.width.get()
    let x = xE - bounds.offset - width / 2 // limit x to bounds of left and right
    x = Math.max(x, bounds.left)
    x = Math.min(x, bounds.right - width)
    // snap so that the edges of the scrubber align with the edges of the cards
    const cardWidth = bounds.cardWidth
    const left = bounds.left
    x = Math.round((x - left) / cardWidth) * cardWidth + left
    const update = (x: number) => {
      const start = Math.round((x - left) / cardWidth)
      const end = Math.round((x + width - left) / cardWidth)
      setCardRange([start, end])
    }
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
  })
  useEffect(() => {
    const width = Math.min(Math.min(7, images.length) * bounds.cardWidth, bounds.width)
    setSpring.start({ x: bounds.left, width, opacity: 1 })
    const cardWidth = bounds.cardWidth
    const x = bounds.left
    const left = bounds.left
    const start = Math.round((x - left) / cardWidth)
    const end = Math.round((x + width - left) / cardWidth)
    setCardRange([start, end])
  }, [bounds, setSpring, images.length, setCardRange])
  useEffect(() => {
    parentRef.current && resizeObserver.observe(parentRef.current)
  }, [resizeObserver])
  // @ts-ignore
  const bindType = bind()
  const onClick: MouseEventHandler<HTMLImageElement> = (e) => {
    let x = e.currentTarget.getBoundingClientRect().left - bounds.offset - spring.width.get() / 2
    const width = Math.min(Math.min(7, images.length) * bounds.cardWidth, bounds.width)
    x = Math.max(x, bounds.left)
    x = Math.min(x, bounds.right - width)
    // snap so that the edges of the scrubber align with the edges of the cards
    const cardWidth = bounds.cardWidth
    const left = bounds.left
    x = Math.round((x - left) / cardWidth) * cardWidth + left
    const update = (x: number) => {
      const start = Math.round((x - left) / cardWidth)
      const end = Math.round((x + width - left) / cardWidth)
      setCardRange([start, end])
    }
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
  return (
    <div className='absolute inset-x-5 bottom-[1%] z-10 mx-auto flex h-14 w-4/5 max-w-screen-md items-center justify-center rounded bg-white/0'>
      <div className='absolute inset-0 flex w-full justify-center rounded bg-white/30' ref={cardsRef}>
        {images.map(({ src, key }) => (
          <div key={key} className='relative h-14 max-h-14 w-full max-w-[37.333px]'>
            <Image
              src={src}
              alt='a playing card'
              fill
              sizes='(max-width: 56px) 56px, 37.333px'
              className='h-full max-h-14 w-full max-w-[37.333px] object-contain'
              onClick={onClick}
            />
          </div>
        ))}
      </div>
      <div className='absolute inset-0 h-0 w-full' ref={parentRef}>
        <animated.div
          className='flex h-14 items-center justify-center overflow-hidden rounded text-xs shadow-inner outline outline-primary/75'
          style={{ touchAction: 'none', ...spring }}
          {...bindType}
        ></animated.div>
      </div>
    </div>
  )
}
