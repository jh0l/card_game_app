'use client'

import { Html } from '@react-three/drei'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
let portal
try {
  portal = document.getElementById('Html-portal')
} catch (e) {}

export default function HtmlPortal({ children }: { children: React.ReactNode }) {
  const portalRef = useRef(portal)
  return (
    <Html portal={portalRef} center>
      {children}
    </Html>
  )
}

// normal react portal access to 'Html-portal'

export function Portal({ children }: { children: React.ReactNode }) {
  return <>{createPortal(children, portal)}</>
}
