'use client'
import * as THREE from 'three'
import React, { useContext, createContext, useRef, useEffect, useCallback, useMemo } from 'react'
import { Text, useTexture } from '@react-three/drei'
import { GraphicInstanceType, useCardDefinition, useImageDefUrl, useGraphicDefinition } from '@/src/state/assets'
import HtmlPortal from '@/src/helpers/components/HtmlPortal'
import { CardActive } from '@/src/state/room'
import { Vec3 } from '@/src/lib/types'

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

function GraphicMesh({
  graphicDefId: GraphicDefId,
  renderOrder,
  name,
  graphicInst,
}: {
  graphicDefId: string
  renderOrder: number
  name: string
  graphicInst: GraphicInstanceType
}) {
  const [graphicDef] = useGraphicDefinition(GraphicDefId)
  const imageGraphic = useImageDefUrl(graphicDef.image)
  const bumpGraphic = useImageDefUrl(graphicDef.bumpMap)
  const iridGraphic = useImageDefUrl(graphicDef.iridescentMap)
  const imageUrl = imageGraphic.url ? [imageGraphic.url] : []
  const bumpUrl = bumpGraphic.url ? [bumpGraphic.url] : []
  const iridUrl = iridGraphic.url ? [iridGraphic.url] : []
  const [map] = useTexture(imageUrl)
  const [bump] = useTexture(bumpUrl)
  const [irid] = useTexture(iridUrl)
  const material = useMemo(() => {
    if (map && bump && irid) {
      return new THREE.MeshPhysicalMaterial({
        map,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        color: '#ccc',
        bumpMap: bump,
        iridescenceMap: irid,
        bumpScale: 0.5,
        reflectivity: 0.9,
        roughness: 0.1,
        clearcoat: 0.7,
        clearcoatRoughness: 0.1,
        iridescence: 1,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [280, 750],
        // color: '#ffffff',
      })
    }
  }, [map, bump, irid])
  const geometry = useMemo(() => {
    if (imageGraphic) {
      const height = imageGraphic.height / imageGraphic.width
      return new THREE.PlaneGeometry(1, height)
    }
  }, [imageGraphic])
  const scale = [graphicInst.width, graphicInst.width, graphicInst.width] as Vec3
  return (
    <mesh
      name={name}
      material={material}
      geometry={geometry}
      scale={scale}
      renderOrder={renderOrder}
      position={graphicInst.position}
      rotation={graphicInst.rotation}
    ></mesh>
  )
}

const CARD_THICK = 0.05
const TEXT = 0.08
const DEPTH = {
  TABLE_CARDS: 10,
  HAND_CARDS: 1000,
}
export interface CardMeshProps {
  cardDefId: string
  meshDepth: number
  name: string
}

export const CardMesh = React.memo(_CardMesh)

function _CardMesh({ cardDefId, meshDepth, name }: CardMeshProps) {
  const [cardDef] = useCardDefinition(cardDefId)
  const label = cardDef.name
  const textDepth = meshDepth + cardDef.graphics.length + 32
  return (
    <>
      {cardDef.graphics.map((graphicInst, i) => (
        <ErrorBoundary key={graphicInst.inst_id}>
          <GraphicMesh
            name={name}
            key={graphicInst.inst_id}
            graphicInst={graphicInst}
            graphicDefId={graphicInst.graphic_id}
            renderOrder={meshDepth + i + graphicInst.renderOrderOffset}
          />
        </ErrorBoundary>
      ))}
      {/* <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='bushwick.otf'
        scale={[TEXT, TEXT, TEXT]}
        color='white'
        anchorX='left'
        anchorY='top'
        position={[-1 / 2.2, 1.5 / 2.2, CARD_THICK / 1.9]}
      >
        {label}
      </Text> */}
      <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='bushwick.otf'
        scale={[TEXT, TEXT, TEXT]}
        color='white'
        anchorX='center'
        anchorY='middle'
        position={[0, -0.5, CARD_THICK / 1.9]}
      >
        {label}
      </Text>
      <Text
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={textDepth}
        font='bushwick.otf'
        scale={[TEXT / 1.4, TEXT / 1.4, TEXT / 1.4]}
        color='white'
        outlineWidth={0.005}
        outlineColor='black'
        anchorX='center'
        anchorY='top-baseline'
        position={[0, -0.28, CARD_THICK / 1.9]}
      >
        {cardDef.description}
      </Text>
    </>
  )
}

// ErrorBoundary for CardMesh
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false }
  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <Text
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={99999999999999}
          scale={[TEXT, TEXT, TEXT]}
          color='red'
          anchorX='center'
          anchorY='middle'
          position={[0, 0, 0]}
        >
          COULD NOT RENDER GRAPHIC
        </Text>
      )
    }
    return this.props.children
  }
}
