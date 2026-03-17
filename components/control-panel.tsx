"use client"
import { useMemo } from "react"

type SurfaceMode = "hill" | "valley" | "twinHills" | "terrain" | "custom"
type OptimizerId = "newton" | "gd" | "momentum" | "rmsprop" | "adam"

interface RunRecord {
  id: number
  optimizerId: OptimizerId
  learningRate: number
  steps: number
  loss: number
}

interface ControlPanelProps {
  showGrid: boolean
  setShowGrid: (value: boolean) => void
  surfaceMode: SurfaceMode
  setSurfaceMode: (value: SurfaceMode) => void
  customExpression: string
  setCustomExpression: (value: string) => void
  invalidExpression?: boolean

  initialX: number
  initialZ: number
  setInitialX: (v: number) => void
  setInitialZ: (v: number) => void
  onRandomInit: () => void

  optimizerId: OptimizerId
  setOptimizerId: (id: OptimizerId) => void

  onRun: () => void
  onStop: () => void
  running?: boolean
  steps?: number
  loss?: number | null
  learningRate: number
  setLearningRate: (v: number) => void
  runHistory?: RunRecord[]
  currentRunId?: number | null
}

export default function ControlPanel({
  showGrid,
  setShowGrid,
  surfaceMode,
  setSurfaceMode,
  customExpression,
  setCustomExpression,
  invalidExpression,
  initialX,
  initialZ,
  setInitialX,
  setInitialZ,
  onRandomInit,
  optimizerId,
  setOptimizerId,
  onRun,
  onStop,
  running,
  steps = 0,
  loss = null,
  learningRate,
  setLearningRate,
  runHistory = [],
  currentRunId = null,
}: ControlPanelProps) {
  const optimizerComplexity = useMemo(() => {
    switch (optimizerId) {
      case "newton":
        return "Per-step: O(n^3) for Hessian solve"
      case "gd":
        return "Per-step: O(n) gradient step"
      case "momentum":
        return "Per-step: O(n) with velocity"
      case "rmsprop":
        return "Per-step: O(n) adaptive"
      case "adam":
        return "Per-step: O(n) adaptive (m,v)"
      default:
        return ""
    }
  }, [optimizerId])
  return (
    <div className="w-full h-full">
      <div className="w-full h-full rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl shadow-2xl p-4 space-y-6 relative group hover:border-cyan-500/50 transition-all duration-300">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-cyan-300 mb-1">3D Hill Visualizer</h2>
            <p className="text-xs text-cyan-500/70">Control the simulation</p>
          </div>

          {/* Grid Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-cyan-200">Show Grid</label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="h-4 w-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Surface Preset */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-cyan-200">Surface</label>
              <select
                value={surfaceMode}
                onChange={(e) => setSurfaceMode(e.target.value as SurfaceMode)}
                className="text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-1 text-slate-200"
              >
                <option value="hill">Standard Hill</option>
                <option value="valley">Standard Valley</option>
                <option value="twinHills">Twin Hills</option>
                <option value="terrain">Simple Terrain</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {surfaceMode === "custom" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customExpression}
                  onChange={(e) => setCustomExpression(e.target.value)}
                  placeholder="Enter expression in x,z. e.g. 1/(1 + x^2 + z^2)"
                  className="w-full text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-2 text-slate-200 font-mono"
                />
                <p className="text-xs text-slate-400">Variables: x, z. Math.* allowed.</p>
                {invalidExpression && (
                  <p className="text-xs text-red-400">Invalid or incomplete expression. Showing last valid surface.</p>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          {/* Optimizer controls */}
          <div className="space-y-3">
            {/* Initial point row */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={initialX}
                onChange={(e) => setInitialX(Number(e.target.value))}
                placeholder="x"
                className="flex-1 min-w-[80px] text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-2 text-slate-200 font-mono"
              />
              <input
                type="number"
                value={initialZ}
                onChange={(e) => setInitialZ(Number(e.target.value))}
                placeholder="z"
                className="flex-1 min-w-[80px] text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-2 text-slate-200 font-mono"
              />
              <button
                onClick={onRandomInit}
                className="px-3 py-2 text-sm bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded text-slate-200 whitespace-nowrap"
              >
                Random
              </button>
            </div>

            {/* Optimizer dropdown (no label) */}
            <select
              value={optimizerId}
              onChange={(e) => setOptimizerId(e.target.value as OptimizerId)}
              className="w-full text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-2 text-slate-200"
            >
              <option value="newton">Newton's Method</option>
              <option value="gd">Gradient Descent</option>
              <option value="momentum">Momentum</option>
              <option value="rmsprop">RMSProp</option>
              <option value="adam">Adam</option>
            </select>

            {/* Learning rate input (skip for Newton visually but allow adjusting fallback) */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                step="0.001"
                min="0"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="w-full text-sm bg-slate-800/70 border border-slate-600/50 rounded px-2 py-2 text-slate-200 font-mono"
                placeholder="learning rate"
              />
            </div>

            {/* Run button */}
            <div className="flex gap-2">
              <button
                onClick={onRun}
                disabled={!!running}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-600/50 hover:bg-cyan-600/70 disabled:opacity-60 disabled:cursor-not-allowed text-cyan-100 border border-cyan-500/60 transition-all duration-200 font-medium text-sm"
              >
                {running ? 'Running…' : 'Run'}
              </button>
              <button
                onClick={onStop}
                disabled={!running}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/40 hover:bg-red-600/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-100 border border-red-500/50 transition-all duration-200 font-medium text-sm"
              >
                Stop
              </button>
            </div>

            {/* Stats card */}
            <div className="w-full rounded-lg border border-slate-600/50 bg-slate-800/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Steps</span>
                <span className="font-mono text-cyan-300">{steps}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-300">Loss</span>
                <span className="font-mono text-cyan-300">{loss == null ? '-' : loss.toExponential(3)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-300">LR</span>
                <span className="font-mono text-cyan-300">{learningRate}</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">{optimizerComplexity}</div>
            </div>

            {/* Runs table */}
            {runHistory.length > 0 && (
              <div className="w-full rounded-lg border border-slate-600/50 bg-slate-900/50 p-2 max-h-40 overflow-y-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-slate-300 border-b border-slate-700/60">
                      <th className="py-1 px-1 text-left font-normal">#</th>
                      <th className="py-1 px-1 text-left font-normal">Optimizer</th>
                      <th className="py-1 px-1 text-left font-normal">LR</th>
                      <th className="py-1 px-1 text-left font-normal">Steps</th>
                      <th className="py-1 px-1 text-left font-normal">Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runHistory.map((r, idx) => {
                      const isCurrent = currentRunId != null && r.id === currentRunId
                      return (
                        <tr
                          key={r.id}
                          className={
                            isCurrent
                              ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-100"
                              : "bg-slate-800/40 text-slate-200"
                          }
                        >
                          <td className="py-0.5 px-1 font-mono text-[11px] align-middle">{idx + 1}</td>
                          <td className="py-0.5 px-1 font-mono text-[11px] align-middle">
                            {r.optimizerId === "gd"
                              ? "GD"
                              : r.optimizerId === "rmsprop"
                              ? "RMSProp"
                              : r.optimizerId === "adam"
                              ? "Adam"
                              : r.optimizerId === "momentum"
                              ? "Momentum"
                              : "Newton"}
                          </td>
                          <td className="py-0.5 px-1 font-mono text-[11px] align-middle truncate">{r.learningRate}</td>
                          <td className="py-0.5 px-1 font-mono text-[11px] align-middle">{r.steps}</td>
                          <td className="py-0.5 px-1 font-mono text-[11px] align-middle">
                            {Number.isFinite(r.loss) ? r.loss.toExponential(2) : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formula moved to bottom bar in page.tsx */}
        </div>
      </div>
    </div>
  )
}
