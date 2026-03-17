"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import ThreeDPlot from "@/components/three-d-plot"
import MSurface from "@/lib/MLO/MSurface"
import ControlPanel from "@/components/control-panel"
import Latex from "@/components/ui/latex"
import GradientDescent from "@/lib/MLO/optimizers/GradientDescent"
import Momentum from "@/lib/MLO/optimizers/Momentum"
import Adam from "@/lib/MLO/optimizers/Adam"
import RMSProp from "@/lib/MLO/optimizers/RMSProp"
import Newton from "@/lib/MLO/optimizers/Newton"
import Optimizer from "@/lib/MLO/Optimizer"

export default function Home() {
  const [showGrid, setShowGrid] = useState(true)
  type SurfaceMode = "hill" | "valley" | "twinHills" | "terrain" | "custom"
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("hill")
  const [customExpression, setCustomExpression] = useState<string>(
    "(4.901 / (x*x + z*z - 3.2*x - 2*z + 5.25)) +  (12.613 / (x*x + z*z + 3.46*x - 1.6*z + 8.043)) +  (2.519 / (x*x + z*z - 1.08*x - 6.46*z + 11.869)) -   (14.44 / (x*x + z*z - 6*x - 6.46*z + 23.043)) +  (2.576 / (x*x + z*z + 6.26*x - 8*z + 26.607)) +  (8.449 / (x*x + z*z + 6.04*x - 14.8*z + 66.537)) -   (23.7 / (x*x + z*z + 0.14*x - 14.8*z + 62.218))"
  )
  type OptimizerId = "newton" | "gd" | "momentum" | "rmsprop" | "adam"
  const [optimizerId, setOptimizerId] = useState<OptimizerId>("newton")
  const [initialX, setInitialX] = useState<number>(0)
  const [initialZ, setInitialZ] = useState<number>(0)
  const [positions, setPositions] = useState<Array<[number, number]>>([])
  const [running, setRunning] = useState<boolean>(false)
  const [steps, setSteps] = useState<number>(0)
  const [loss, setLoss] = useState<number | null>(null)
  const [learningRate, setLearningRate] = useState<number>(0.05)
  const [runId, setRunId] = useState<number | null>(null)
  const [runHistory, setRunHistory] = useState<{
    id: number
    optimizerId: OptimizerId
    learningRate: number
    steps: number
    loss: number
  }[]>([])
  const runTokenRef = useRef<number>(0)
  const [heightTol, setHeightTol] = useState<number>(1e-5)

  // MSurface with fail-safe: only update when expression parses successfully
  const defaultExpr = `1/(1 + x^2 + z^2)`
  const [mSurface, setMSurface] = useState<MSurface>(new MSurface(defaultExpr, ["x", "z"]))
  const [invalidExpression, setInvalidExpression] = useState<boolean>(false)

  useEffect(() => {
    let expr = ""
    switch (surfaceMode) {
      case "hill":
        expr = `1/(1 + x^2 + z^2)`
        break
      case "valley":
        expr = `-1/(1 + x^2 + z^2)`
        break
      case "twinHills":
        expr = `1/(1 + (x-1)^2 + z^2) + 0.9/(1 + (x+1)^2 + z^2)`
        break
      case "terrain": {
        const f = 1.0
        expr = `0.6*sin(2*${f}*x) + 0.4*cos(1.5*${f}*z)`
        break
      }
      case "custom": {
        expr = customExpression
        break
      }
      default:
        expr = defaultExpr
    }

    
    try {
      const next = new MSurface(expr, ["x", "z"])
      const view: { x: [number, number]; z: [number, number] } = { x: [-15, 15], z: [-15, 15] }
      const est = next.estimateArgMin(view, 121, 3, 0.3, 60)
      next.setLossTarget(est)
      setHeightTol(1e-5)
      if (typeof next.surfaceFn === 'function') {
        setMSurface(next)
        setInvalidExpression(false)
        setRunHistory([])
      }
    } catch {
      if (surfaceMode === "custom") setInvalidExpression(true)
    }
  }, [surfaceMode, customExpression])

  const formula: string = useMemo(() => {
    return `y = ${mSurface.toTeX()}`
  }, [mSurface])

  const onRandomInit = () => {
    const rx = (Math.random() - 0.5) * 6
    const rz = (Math.random() - 0.5) * 6
    setInitialX(Number(rx.toFixed(2)))
    setInitialZ(Number(rz.toFixed(2)))
    setRunHistory([])
  }

  useEffect(() => {
    if (!running) setPositions([[initialX, initialZ]])
  }, [initialX, initialZ])

  const onRun = async () => {
    if (running) return
    const newRunId = Date.now()
    setRunId(newRunId)
    setRunning(true)
    setSteps(0)
    const start: [number, number] = [initialX, initialZ]
    setPositions([start])
    const token = newRunId
    runTokenRef.current = token

    let opt: Optimizer
    const makeNewton = () => new Newton(mSurface, [initialX, initialZ])
    const makeGD = () => new GradientDescent(mSurface, [initialX, initialZ], { learningRate })
    const makeMomentum = () => new Momentum(mSurface, [initialX, initialZ], { learningRate, beta: 0.9 })
    const makeRMSProp = () => new RMSProp(mSurface, [initialX, initialZ], { learningRate, beta: 0.9 })
    const makeAdam = () => new Adam(mSurface, [initialX, initialZ], { learningRate })
    switch (optimizerId) {
      case "gd": opt = makeGD(); break
      case "momentum": opt = makeMomentum(); break
      case "rmsprop": opt = makeRMSProp(); break
      case "adam": opt = makeAdam(); break
      case "newton":
      default: opt = makeNewton(); break
    }

    const stagnationMoveTol = 1e-4
    const stagnationRequiredSteps = 150
    const maxSteps = 500
    let stagnationCount = 0
    let bestF: number | null = null
    let lastStepIndex = 0
    try {
      for (let i = 0; i < maxSteps; i++) {
        if (runTokenRef.current !== token) break // aborted
        
        const current = opt.current()
        const fCurrent = mSurface.valueAt(current)
        const fMin = mSurface.getLossTargetValue() ?? fCurrent
        if (bestF === null || fCurrent < bestF) bestF = fCurrent
        const targetValue = Math.min(fMin, bestF)
        const heightDiff = Math.abs(fCurrent - targetValue)
        setLoss(heightDiff)
        setSteps(i)
        lastStepIndex = i
        if (Number.isNaN(heightDiff)) break
        if (heightDiff < heightTol) break

        // step
        const next = opt.next()
        const stepSize = Math.hypot(next[0] - current[0], next[1] - current[1])
        if (stepSize < stagnationMoveTol) {
          stagnationCount += 1
          if (stagnationCount >= stagnationRequiredSteps) {
            if (heightDiff >= heightTol * 10) {
              const kickScale = 0.2
              const kx = next[0] + (Math.random() - 0.5) * kickScale
              const kz = next[1] + (Math.random() - 0.5) * kickScale
              setPositions((prev) => [...prev, [next[0], next[1]], [kx, kz]])
              stagnationCount = 0
              continue
            } else {
              setPositions((prev) => [...prev, [next[0], next[1]]])
              break
            }
          }
        } else {
          stagnationCount = 0
        }
        setPositions((prev) => [...prev, [next[0], next[1]]])
        await new Promise((r) => setTimeout(r, 100))
      }
    } finally {
      // final update
      const final = opt.current()
      const fFinal = mSurface.valueAt(final)
      const fMin = mSurface.getLossTargetValue() ?? fFinal
      const finalTarget = bestF === null ? fMin : Math.min(fMin, bestF)
      setLoss(Math.abs(fFinal - finalTarget))
      const finalLoss = Math.abs(fFinal - finalTarget)
      if (runTokenRef.current === token) {
        setRunHistory((prev) => {
          const next = [
            ...prev,
            {
              id: newRunId,
              optimizerId,
              learningRate,
              steps: lastStepIndex,
              loss: finalLoss,
            },
          ]
          return next
            .slice()
            .sort((a, b) => a.steps - b.steps)
        })
      }
      setRunning(false)
    }
  }

  const onStop = () => {
    if (!running) return
    runTokenRef.current = -1 // invalidate token
    setRunning(false)
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden flex flex-col p-4 gap-4">
      
      <div className="flex flex-1 min-h-0 gap-4">
        
        <div className="flex-[4] h-full flex items-center justify-center min-w-0">
          <div className="w-full h-full rounded-2xl border border-cyan-500/20 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group hover:border-cyan-500/40 transition-all duration-300">
          
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <ThreeDPlot
            mSurface={mSurface}
            positions={positions}
            showGrid={showGrid}
          />
          </div>
        </div>
        
        <div className="h-full flex-[1] max-w-sm min-w-[240px]">
          <ControlPanel
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            surfaceMode={surfaceMode}
            setSurfaceMode={setSurfaceMode}
            customExpression={customExpression}
            setCustomExpression={setCustomExpression}
            invalidExpression={invalidExpression}
            initialX={initialX}
            initialZ={initialZ}
            setInitialX={setInitialX}
            setInitialZ={setInitialZ}
            onRandomInit={onRandomInit}
            optimizerId={optimizerId}
            setOptimizerId={setOptimizerId}
            onRun={onRun}
            onStop={onStop}
            running={running}
            steps={steps}
            loss={loss}
            learningRate={learningRate}
            setLearningRate={setLearningRate}
            runHistory={runHistory}
            currentRunId={runId}
          />
        </div>
      </div>

      
      <div className="w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl shadow-2xl p-4 flex items-center justify-between min-h-[64px]">
        <span className="text-xs text-slate-400">Formula</span>
        <div className="flex-1 mx-4 overflow-auto flex items-center justify-center">
          <Latex tex={formula.replace(/^y\\s*=\\s*/, '')} displayMode className="text-cyan-200 text-xl" />
        </div>
        <span className="text-xs text-slate-500 ml-4">vars: x, z</span>
      </div>
    </div>
  )
}
