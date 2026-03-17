import Optimizer from '../Optimizer'
import MSurface from '../MSurface'

type RMSPropOpts = { learningRate?: number; beta?: number; epsilon?: number }

export default class RMSProp extends Optimizer {
  private lr: number
  private beta: number
  private eps: number
  private s: number[]

  constructor(surface: MSurface, initial: number[], opts: RMSPropOpts = {}) {
    super(surface, initial)
    this.lr = opts.learningRate ?? 0.001
    this.beta = opts.beta ?? 0.9
    this.eps = opts.epsilon ?? 1e-8
    this.s = new Array(this.dim()).fill(0)
  }

  protected computeStep(): number[] {
    const g = this.gradient()
    for (let i = 0; i < this.s.length; i++) this.s[i] = this.beta * this.s[i] + (1 - this.beta) * (g[i] * g[i])
    return g.map((gi, i) => -this.lr * gi / (Math.sqrt(this.s[i]) + this.eps))
  }
}
