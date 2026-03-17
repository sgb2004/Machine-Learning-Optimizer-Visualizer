import Optimizer from '../Optimizer'
import { gaussianElimination } from '../guass'
import MSurface from '../MSurface'

function choleskyDecomposition(A: number[][]): number[][] {
  const n = A.length
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k]
      if (i === j) {
        const diag = A[i][i] - sum
        if (!(diag > 0)) throw new Error('Not PD')
        L[i][j] = Math.sqrt(diag)
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j]
      }
    }
  }
  return L
}

function isSymmetric(A: number[][], tol = 1e-9): boolean {
  const n = A.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j] - A[j][i]) > tol) return false
    }
  }
  return true
}

export default class Newton extends Optimizer {
  constructor(surface: MSurface, initial: number[]) {
    super(surface, initial)
  }

  protected computeStep(): number[] {
    const x = this.current()
    const g = this.gradient()
    const n = g.length
    let H = this.surface.hessianAt(x)

    if (!isSymmetric(H)) {
      const HT = H[0].map((_, j) => H.map(row => row[j]))
      H = H.map((row, i) => row.map((_, j) => 0.5 * (H[i][j] + HT[i][j])))
    }

    let Hreg = H.map(r => r.slice())
    let lambda = 1e-8
    for (let tries = 0; tries < 8; tries++) {
      try {
        choleskyDecomposition(Hreg)
        break
      } catch {
        Hreg = Hreg.map((row, i) => row.map((v, j) => v + (i === j ? lambda : 0)))
        lambda *= 10
      }
    }

    // solve Hreg p = -g
    let direction: number[]
    try {
      const p = gaussianElimination(Hreg, g)
      direction = p.map(v => -v)
    } catch {
      direction = g.map(gi => -gi)
    }

    // If not a descent direction, switch to steepest descent
    const dot = g.reduce((s, gi, i) => s + gi * direction[i], 0)
    if (!(dot < 0)) {
      for (let i = 0; i < n; i++) direction[i] = -g[i]
    }

    // Armijo backtracking line search
    const f = (pt: number[]) => this.surface.valueAt(pt)
    const f0 = f(x)
    const c1 = 1e-4
    let alpha = 1.0
    const minAlpha = 1 / 4096
    const gTd = g.reduce((s, gi, i) => s + gi * direction[i], 0)
    let step = direction.map(d => alpha * d)
    let xn = x.map((xi, i) => xi + step[i])
    while (alpha > minAlpha && !(f(xn) <= f0 + c1 * alpha * gTd)) {
      alpha *= 0.5
      step = direction.map(d => alpha * d)
      xn = x.map((xi, i) => xi + step[i])
    }

    return step
  }
}

