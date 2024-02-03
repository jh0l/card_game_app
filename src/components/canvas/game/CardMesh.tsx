'use client'
import * as THREE from 'three'
import React, { useContext, createContext, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { TextureInstanceType, useCardDefinition, useImageDefUrl, useTextureDefinition } from '@/src/state/assets'

// interface CardMeshContext {}
// interface cardMeshLoaderContextType {
//   load: (textureDefId: string) => void
//   loaded: string[]
// }
// const cardMeshLoaderContext = createContext<cardMeshLoaderContextType>({
//   load: () => {},
//   loaded: [],
// })
// const context = createContext<CardMeshContext>({})
// export function Instances({ children, ...props }: { children: React.ReactNode }) {
//   const [textureDefIds, setTextureDefIds] = React.useState<string[]>([])
//   const instances = useRef<THREE.Mesh[]>([])
//   const setMesh = useCallback((index: number, mesh: THREE.Mesh) => {
//     instances.current[index] = mesh
//   }, [])
//   const load = useCallback((textureDefId: string) => {
//     setTextureDefIds((prev) => {
//       if (prev.includes(textureDefId)) return prev
//       return [...prev, textureDefId]
//     })
//   }, [])
//   return (
//     <cardMeshLoaderContext.Provider
//       value={{
//         load,
//         loaded: textureDefIds,
//       }}
//     >
//       {textureDefIds.map((textureDefId, index) => (
//         <TextureDefSubscriber key={textureDefId} textureDefId={textureDefId} setMesh={setMesh} index={index} />
//       ))}
//       <Merged meshes={instances} {...props}>
//         {(_instances: typeof instances) => <context.Provider value={_instances}>{children}</context.Provider>}
//       </Merged>
//     </cardMeshLoaderContext.Provider>
//   )
// }

// function TextureDefSubscriber({
//   textureDefId,
//   setMesh,
//   index,
// }: {
//   textureDefId: string
//   setMesh: (index: number, mesh: THREE.Mesh) => void
//   index: number
// }) {
//   const [textureDef, setTextureDef] = useTextureDefinition(textureDefId)
//   const imageTexture = useImageDefUrl(textureDef.image)
//   const bumpTexture = useImageDefUrl(textureDef.bumpMap)
//   const iridTexture = useImageDefUrl(textureDef.iridescentMap)
//   const [map, bump, irid] = useTexture([imageTexture.url, bumpTexture.url, iridTexture.url])
//   useEffect(() => {
//     if (map && bump && irid) {
//       const material = new THREE.MeshPhysicalMaterial({
//         map,
//         bumpMap: bump,
//         bumpScale: 0.05,
//         iridescenceMap: irid,
//         iridescence: 0.5,
//       })
//       const height = textureDef.width / textureDef.height
//       const geometry = new THREE.BoxGeometry(1, 1 * height, 0.05)
//       const mesh = new THREE.Mesh(geometry, material)
//       setMesh(index, mesh)
//       setTextureDef((x) => ({ ...x, available: Date.now() }))
//     }
//   }, [textureDef, bump, irid, map, setMesh, setTextureDef, textureDefId, index])
//   return null
// }

// function TexDefUser({
//   lookup,
//   instances,
//   graphic,
// }: {
//   graphic: TextureInstanceType
//   lookup: { textureDefId: string; index: number }
//   instances: CardMeshContext
// }) {
//   useTextureDefinition(lookup.textureDefId)
//   if (instances[lookup.index] === undefined) return null
//   return <primitive object={instances[lookup.index]} />
// }

// export function _CardMesh({ cardDefId, children }: { cardDefId: string; children: any }) {
//   const localLoaded = useRef<{ [key: string]: number }>({})
//   const [cardDef] = useCardDefinition(cardDefId)
//   const { load, loaded } = useContext(cardMeshLoaderContext)
//   useEffect(() => {
//     if (!localLoaded.current) return
//     for (const textureDef of cardDef.graphics) {
//       const isLoaded = localLoaded[textureDef.texture_id] !== undefined
//       if (!isLoaded) {
//         // check if in global loaded
//         const globalLoadedIndex = loaded.indexOf(textureDef.texture_id)
//         if (globalLoadedIndex === -1) {
//           load(textureDef.texture_id)
//         } else {
//           localLoaded[textureDef.texture_id] = globalLoadedIndex
//         }
//       }
//     }
//   }, [cardDef.graphics, load, loaded, localLoaded])
//   const instances = useContext(context)
//   //
//   return (
//     <group dispose={null}>
//       {cardDef.graphics.map((textureInst) => (
//         <TexDefUser
//           key={textureInst.texture_id}
//           lookup={{
//             textureDefId: textureInst.texture_id,
//             index: localLoaded[textureInst.texture_id],
//           }}
//           instances={instances}
//           graphic={textureInst}
//         />
//       ))}
//       {children}
//     </group>
//   )
// }

function TextureMesh({ textureDefId }: { textureDefId: string }) {
  const [textureDef] = useTextureDefinition(textureDefId)
  const imageTexture = useImageDefUrl(textureDef.image)
  const bumpTexture = useImageDefUrl(textureDef.bumpMap)
  const iridTexture = useImageDefUrl(textureDef.iridescentMap)
  const [map, bump, irid] = useTexture([imageTexture.url, bumpTexture.url, iridTexture.url])
  const material = useMemo(() => {
    if (map && bump && irid) {
      return new THREE.MeshPhysicalMaterial({
        map,
        bumpMap: bump,
        bumpScale: 0.05,
        iridescenceMap: irid,
        iridescence: 0.5,
      })
    }
  }, [map, bump, irid])
  const geometry = useMemo(() => {
    if (textureDef) {
      const height = textureDef.width / textureDef.height
      return new THREE.BoxGeometry(1, 1 * height, CARD_THICK)
    }
  }, [textureDef])
  return <mesh material={material} geometry={geometry}></mesh>
}

const CARD_THICK = 0.05

export function CardMesh({ cardDefId }: { cardDefId: string }) {
  const [cardDef] = useCardDefinition(cardDefId)
  return (
    <>
      <boxGeometry args={[1, 1.5, CARD_THICK]} />
      {cardDef.graphics.map((textureInst) => (
        <TextureMesh key={textureInst.inst_id} textureDefId={textureInst.texture_id} />
      ))}
    </>
  )
}
