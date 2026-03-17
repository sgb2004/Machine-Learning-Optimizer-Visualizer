import MSurface from './MSurface'

export type Vector = number[]

export default abstract class Optimizer {
	protected surface: MSurface
	protected point: Vector
	protected stepCount = 0

	constructor(surface: MSurface, initial: Vector) {
		this.surface = surface
		this.point = initial.slice()
	}

	current(): Vector {
		return this.point.slice()
	}

	next(): Vector {
		const step = this.computeStep()
		if (step.length !== this.point.length) throw new Error('Step dimension mismatch')
		for (let i = 0; i < this.point.length; i++) this.point[i] += step[i]
		this.stepCount += 1
		return this.current()
	}

	protected dim(): number {
		return this.point.length
	}

	protected value(): number {
		return this.surface.valueAt(this.point)
	}

	protected gradient(): Vector {
		return this.surface.gradientAt(this.point)
	}

	protected abstract computeStep(): Vector
}

