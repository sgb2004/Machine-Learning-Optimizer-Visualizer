import Optimizer from '../Optimizer'
import MSurface from '../MSurface'

type MomentumOpts = { learningRate?: number; beta?: number }

export default class Momentum extends Optimizer {
  private lr: number
  private beta: number
  private v: number[]

  constructor(surface: MSurface, initial: number[], opts: MomentumOpts = {}) {
    super(surface, initial)
    this.lr = opts.learningRate ?? 0.01
    this.beta = opts.beta ?? 0.9
    this.v = new Array(this.dim()).fill(0)
  }

  protected computeStep(): number[] {
    const g = this.gradient()
    for (let i = 0; i < this.v.length; i++) this.v[i] = this.beta * this.v[i] + (1 - this.beta) * g[i]
    return this.v.map((vi) => -this.lr * vi)
  }
}
