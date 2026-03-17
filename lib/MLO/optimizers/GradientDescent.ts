import Optimizer from '../Optimizer'
import MSurface from '../MSurface'

type GDOpts = { learningRate?: number }

export default class GradientDescent extends Optimizer {
  private lr: number

  constructor(surface: MSurface, initial: number[], opts: GDOpts = {}) {
    super(surface, initial)
    this.lr = opts.learningRate ?? 0.01
  }

  protected computeStep(): number[] {
    const g = this.gradient()
    return g.map((gi) => -this.lr * gi)
  }
}
