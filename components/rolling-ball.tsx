"use client"

import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

export interface RollingBallProps {
  // [x, z]
  positions: Array<[number, number]>
  surfaceFn: (x: number, z: number) => number
}

export default function RollingBall({ positions, surfaceFn }: RollingBallProps) {
  const ballRef = useRef<THREE.Mesh>(null)
  const tubeRef = useRef<THREE.Mesh>(null)

  const trailPoints = useMemo(() => {
    return positions.map(([x, z]) => {
      let y = surfaceFn(x, z)
      if (!Number.isFinite(y)) y = 0
      return new THREE.Vector3(x, y + 0.15, z)
    })
  }, [positions, surfaceFn])

  useEffect(() => {
    const last = trailPoints[trailPoints.length - 1]
    if (ballRef.current && last) {
      ballRef.current.position.set(last.x, last.y, last.z)
    }

    if (tubeRef.current && trailPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(trailPoints)
      const tubularSegments = Math.max(20, trailPoints.length * 4)
      const tubeGeom = new THREE.TubeGeometry(curve, tubularSegments, 0.035, 12, false)
      const oldGeom = tubeRef.current.geometry
      tubeRef.current.geometry = tubeGeom
      oldGeom.dispose?.()
    }
  }, [trailPoints])

  return (
    <group>
      <mesh ref={tubeRef}>
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00" metalness={0.2} roughness={0.6} />
      </mesh>

      {trailPoints.slice(0, -1).map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#ff9800" emissive="#ff6a00" metalness={0.3} roughness={0.4} />
        </mesh>
      ))}

      <mesh ref={ballRef} position={[0, 3, 0]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial color="#ff1d1d" emissive="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
