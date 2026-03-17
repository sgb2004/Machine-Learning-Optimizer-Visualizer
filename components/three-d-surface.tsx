"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"

export interface ThreeDSurfaceProps {
  surfaceFn: (x: number, z: number) => number
}

export default function ThreeDSurface({ surfaceFn }: ThreeDSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const vertices: number[] = []
    const colors: number[] = []
    const indices: number[] = []

    const gridSize = 60
    const scale = 0.6
    const resolutionFactor = 3

    const sampleCount = gridSize * resolutionFactor
    const ys: number[] = new Array(sampleCount * sampleCount)
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (let i = 0; i < sampleCount; i++) {
      for (let j = 0; j < sampleCount; j++) {
        const x = (i / resolutionFactor - gridSize / 2) * scale
        const z = (j / resolutionFactor - gridSize / 2) * scale
        let y: number
        try {
          y = surfaceFn(x, z)
        } catch {
          y = 0
        }
        if (!Number.isFinite(y)) y = 0
        const idx = i * sampleCount + j
        ys[idx] = y
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    for (let i = 0; i < sampleCount; i++) {
      for (let j = 0; j < sampleCount; j++) {
        const x = (i / resolutionFactor - gridSize / 2) * scale
        const z = (j / resolutionFactor - gridSize / 2) * scale
        const idx = i * sampleCount + j
        const y = ys[idx]
        vertices.push(x, y, z)

        let t = maxY === minY ? 0 : (y - minY) / (maxY - minY)
        if (!Number.isFinite(t)) t = 0
        if (t < 0) t = 0
        if (t > 1) t = 1
        const stops = [
          { t: 0.0, color: new THREE.Color('#0b1f6a') },
          { t: 0.25, color: new THREE.Color('#1fa3ff') },
          { t: 0.5, color: new THREE.Color('#22c55e') },
          { t: 0.7, color: new THREE.Color('#f59e0b') },
          { t: 0.85, color: new THREE.Color('#f97316') },
          { t: 1.0, color: new THREE.Color('#ef4444') },
        ]
        let c: THREE.Color
        if (t <= stops[0].t) {
          c = stops[0].color
        } else if (t >= stops[stops.length - 1].t) {
          c = stops[stops.length - 1].color
        } else {
          let k = 0
          for (; k < stops.length - 1; k++) {
            if (t >= stops[k].t && t <= stops[k + 1].t) break
          }
          if (k >= stops.length - 1) k = stops.length - 2
          const span = Math.max(1e-8, stops[k + 1].t - stops[k].t)
          const lt = (t - stops[k].t) / span
          c = stops[k].color.clone().lerp(stops[k + 1].color, lt)
        }
        colors.push(c.r, c.g, c.b)
      }
    }

    for (let i = 0; i < sampleCount - 1; i++) {
      for (let j = 0; j < sampleCount - 1; j++) {
        const a = i * sampleCount + j
        const b = a + 1
        const c = a + sampleCount
        const d = c + 1
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
    geo.computeVertexNormals()
    return geo
  }, [surfaceFn])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
      <meshStandardMaterial
        vertexColors
        metalness={0.25}
        roughness={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
