const nerdamer: any = require('nerdamer/all')

export default class MSurface {
    name: string | null = null
    symbolicFn: string | any = null
    expression: any = null

    variables: string[] = ['x', 'y']

    surfaceFn: ((...args: number[]) => number) | null = null
    private gradientFns: Array<(...args: number[]) => number> = []
    private hessianFns: Array<Array<(...args: number[]) => number>> = []
    private lossTarget: number[] | null = null
    private lossTargetValue: number | null = null

    constructor(_symbolicFn: string | any, arg2?: string[] | string | null, arg3?: string | null) {
        this.symbolicFn = _symbolicFn
        if (Array.isArray(arg2)) {
            this.variables = arg2
            this.name = arg3 ?? null
        } else {
            this.name = (arg2 as string) ?? null
        }
        this.loadFromSymbolicFn()
    }

    private detectVariablesFallback() {
        try {
            if (this.expression && typeof this.expression.variables === 'function') {
                const detected = this.expression.variables()
                if (Array.isArray(detected) && detected.length > 0) {
                    this.variables = detected as string[]
                }
            }
        } catch {
            // ignore
        }
    }

    loadFromSymbolicFn(): void {
        this.expression = nerdamer(this.symbolicFn)
        console.log('Loaded expression:', this.expression.toString())

        if (!this.variables || this.variables.length === 0 || (this.variables.length === 2 && this.variables[0] === 'x' && this.variables[1] === 'y')) {
            this.detectVariablesFallback()
        }

        // Build surface function
        this.surfaceFn = this.expression.buildFunction(this.variables)
        this.symbolicFn = this.expression.toString()

        // Build gradient functions for each variable
        const derivativeExprs = this.variables.map((v) => nerdamer.diff(this.expression, v))
        this.gradientFns = derivativeExprs.map((expr) => expr.buildFunction(this.variables))

        // Build Hessian functions for each pair of variables
        const hessianExprs = derivativeExprs.map((di) => this.variables.map((vj) => nerdamer.diff(di, vj)))
        this.hessianFns = hessianExprs.map((row) => row.map((expr) => expr.buildFunction(this.variables)))
    }

    valueAt(point: number[]): number {
        if (!this.surfaceFn) throw new Error('Surface function not initialized')
        return this.surfaceFn(...point)
    }

    gradientAt(point: number[]): number[] {
        if (this.gradientFns.length === 0) throw new Error('Gradient functions not initialized')
        return this.gradientFns.map((fn) => fn(...point))
    }

    hessianAt(point: number[]): number[][] {
        if (this.hessianFns.length === 0) throw new Error('Hessian functions not initialized')
        return this.hessianFns.map((row) => row.map((fn) => fn(...point)))
    }

    setLossTarget(point: number[] | null) {
        this.lossTarget = point ? point.slice() : null
    }

    getLossTargetValue(): number | null {
        return this.lossTargetValue
    }

    lossAt(point: number[]): number {
        if (this.lossTarget && this.lossTarget.length === point.length) {
            let s = 0
            for (let i = 0; i < point.length; i++) {
                const d = point[i] - this.lossTarget[i]
                s += d * d
            }
            return Math.sqrt(s)
        }
        const g = this.gradientAt(point)
        let sum = 0
        for (let i = 0; i < g.length; i++) sum += g[i] * g[i]
        return Math.sqrt(sum)
    }

    estimateArgMin(
        bounds: { x: [number, number]; z: [number, number] },
        gridSize = 61,
        refinePasses = 2,
        shrink = 0.35,
        refineGDSteps = 40
    ): number[] {
        if (!this.surfaceFn) throw new Error('Surface function not initialized')
        let [xmin, xmax] = bounds.x
        let [zmin, zmax] = bounds.z
        let bestX = 0, bestZ = 0, bestY = Number.POSITIVE_INFINITY
        const evalGrid = (nx: number, nz: number) => {
            bestY = Number.POSITIVE_INFINITY
            for (let i = 0; i < nx; i++) {
                const x = xmin + (i / (nx - 1)) * (xmax - xmin)
                for (let j = 0; j < nz; j++) {
                    const z = zmin + (j / (nz - 1)) * (zmax - zmin)
                    let y = this.surfaceFn!(x, z)
                    if (!Number.isFinite(y)) y = Number.POSITIVE_INFINITY
                    if (y < bestY) { bestY = y; bestX = x; bestZ = z }
                }
            }
        }

        evalGrid(gridSize, gridSize)

        for (let pass = 0; pass < refinePasses; pass++) {
            const hx = (xmax - xmin) * shrink * 0.5
            const hz = (zmax - zmin) * shrink * 0.5
            xmin = bestX - hx; xmax = bestX + hx
            zmin = bestZ - hz; zmax = bestZ + hz
            evalGrid(gridSize, gridSize)
        }

        try {
            const ix = 0, iz = 1
            const inBounds = (x: number, z: number) => x >= bounds.x[0] && x <= bounds.x[1] && z >= bounds.z[0] && z <= bounds.z[1]
            let x = bestX, z = bestZ
            let y = this.surfaceFn!(x, z)
            for (let t = 0; t < refineGDSteps; t++) {
                const gAll = this.gradientAt([x, z])
                const gx = gAll[ix] ?? 0
                const gz = gAll[iz] ?? 0
                const gnorm = Math.hypot(gx, gz)
                if (!Number.isFinite(gnorm) || gnorm < 1e-8) break

                let dx = -gx, dz = -gz

                let alpha = 0.5
                let improved = false
                for (let k = 0; k < 10; k++) {
                    const xn = x + alpha * dx
                    const zn = z + alpha * dz
                    if (!inBounds(xn, zn)) { alpha *= 0.5; continue }
                    let yn = this.surfaceFn!(xn, zn)
                    if (!Number.isFinite(yn)) yn = Number.POSITIVE_INFINITY
                    if (yn < y) {
                        x = xn; z = zn; y = yn; improved = true
                        break
                    }
                    alpha *= 0.5
                }
                if (!improved) break
            }
            bestX = x; bestZ = z; bestY = y
        } catch {
            // ignore
        }
        this.lossTargetValue = bestY
        return [bestX, bestZ]
    }

    toTeX(): string {
        try {
            if (this.expression && typeof this.expression.toTeX === 'function') {
                return this.expression.toTeX()
            }
            const expr = nerdamer(this.symbolicFn)
            if (expr && typeof expr.toTeX === 'function') return expr.toTeX()
        } catch {
            // ignore
        }
        return String(this.symbolicFn)
    }
}