'use client'

import { Html } from '@react-three/drei'
import { useRef } from 'react'
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
