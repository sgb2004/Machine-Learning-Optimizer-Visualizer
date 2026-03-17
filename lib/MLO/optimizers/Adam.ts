import Optimizer from '../Optimizer'
import MSurface from '../MSurface'

type AdamOpts = { learningRate?: number; beta1?: number; beta2?: number; epsilon?: number }

export default class Adam extends Optimizer {
  private lr: number
  private beta1: number
  private beta2: number
  private eps: number
  private m: number[]
  private v: number[]
  private t = 0

  constructor(surface: MSurface, initial: number[], opts: AdamOpts = {}) {
    super(surface, initial)
    this.lr = opts.learningRate ?? 0.001
    this.beta1 = opts.beta1 ?? 0.9
    this.beta2 = opts.beta2 ?? 0.999
    this.eps = opts.epsilon ?? 1e-8
    const n = this.dim()
    this.m = new Array(n).fill(0)
    this.v = new Array(n).fill(0)
  }

  protected computeStep(): number[] {
    const g = this.gradient()
    this.t += 1

    for (let i = 0; i < g.length; i++) {
      this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * g[i]
      this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * (g[i] * g[i])
    }

    const mHat = this.m.map((mi) => mi / (1 - Math.pow(this.beta1, this.t)))
    const vHat = this.v.map((vi) => vi / (1 - Math.pow(this.beta2, this.t)))

    return mHat.map((mh, i) => -this.lr * mh / (Math.sqrt(vHat[i]) + this.eps))
  }
}
