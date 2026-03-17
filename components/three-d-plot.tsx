"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useEffect, useRef } from "react"
import ThreeDSurface from "@/components/three-d-surface"
import RollingBall from "@/components/rolling-ball"
import MSurface from "@/lib/MLO/MSurface"

interface ThreeDPlotProps {
  mSurface: MSurface
  positions: Array<[number, number]>
  showGrid?: boolean
}

function KeyboardPan() {
  const { camera } = useThree()
  const targetRef = useRef<[number, number, number]>([0, 0, 0])
  const keysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((_, dt) => {
    const speed = 10 * dt
    const k = keysRef.current
    
    const moveX = (k['a'] || k['arrowleft'] ? -1 : 0) + (k['d'] || k['arrowright'] ? 1 : 0)
    const moveZ = (k['w'] || k['arrowup'] ? -1 : 0) + (k['s'] || k['arrowdown'] ? 1 : 0)
    if (moveX === 0 && moveZ === 0) return
    
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize()
    const delta = new THREE.Vector3()
    delta.addScaledVector(right, moveX * speed)
    delta.addScaledVector(dir, moveZ * speed)
    camera.position.add(delta)
  })
  return null
}

export default function ThreeDPlot({ mSurface, positions, showGrid = true }: ThreeDPlotProps) {

  console.log("Rendering ThreeDPlot with MSurface")

  console.log("MSurface expression:", mSurface?.symbolicFn)
  console.log("f(1, 2) = ", mSurface.surfaceFn?.(1, 2))

  return (
    <Canvas camera={{ position: [18, 12, 18], fov: 55 }} style={{ width: "100%", height: "100%" }}>
      <hemisphereLight args={["#bde0fe", "#1e293b", 1.25]} />
      <directionalLight position={[15, 20, 15]} intensity={1.8} color="#ffffff" castShadow />
      <directionalLight position={[-15, 15, -15]} intensity={1.0} color="#e0f2fe" />
      <directionalLight position={[0, 25, 0]} intensity={0.8} color="#06b6d4" />
      <ambientLight intensity={0.6} color="#ffffff" />
      <pointLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-10, 10, -10]} intensity={0.9} color="#0ea5e9" />
      <pointLight position={[0, 5, 15]} intensity={1.0} color="#06b6d4" />
      <directionalLight position={[10, -20, 10]} intensity={0.9} color="#ffeedd" />
      <directionalLight position={[-10, -15, -10]} intensity={0.8} color="#dbeafe" />
      <directionalLight position={[0, -25, 0]} intensity={0.6} color="#c7f9ff" />
      <pointLight position={[8, -12, 8]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-8, -8, -8]} intensity={0.6} color="#9be7ff" />
      <pointLight position={[0, -6, 12]} intensity={0.7} color="#7dd3fc" />

      <PerspectiveCamera makeDefault position={[18, 12, 18]} fov={55} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enablePan
        panSpeed={0.8}
        enableZoom
        maxDistance={120}
        minDistance={2}
      />
      <KeyboardPan />

      <ThreeDSurface surfaceFn={(x:number, z:number) => mSurface.surfaceFn?.(x, z) ?? 0} />

      <RollingBall positions={positions} surfaceFn={(x:number, z:number) => mSurface.surfaceFn?.(x, z) ?? 0} />

      {showGrid && <gridHelper args={[40, 40]} position={[0, -0.5, 0]} />}
    </Canvas>
  )
}
