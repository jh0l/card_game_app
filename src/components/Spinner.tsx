'use client'
import React from 'react'

const chars = ['⡿', '⣟', '⣯', '⣷', '⣾', '⣽', '⣻', '⢿'].reverse()
export function Spinner() {
  const [char, setChar] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setChar((char) => (char + 1) % chars.length)
    }, 200)
    return () => clearInterval(interval)
  }, [])
  return (
    <div>
      {chars[char]}
      {/* {chars[(char + 5) % chars.length]} */}
    </div>
  )
}
