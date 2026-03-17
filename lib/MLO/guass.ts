// Gaussian elimination with partial pivoting for dense systems
// Solves A x = b and returns x

export function gaussianElimination(A: number[][], b: number[]): number[] {
	const n = A.length
	if (n === 0 || A[0].length !== n || b.length !== n) {
		throw new Error('Invalid dimensions for Gaussian elimination')
	}

	// Create augmented matrix [A | b]
	const M: number[][] = A.map((row, i) => [...row, b[i]])

	// Forward elimination
	for (let k = 0; k < n; k++) {
		// Partial pivoting: find row with max |M[i][k]| for i>=k
		let pivot = k
		let maxVal = Math.abs(M[k][k])
		for (let i = k + 1; i < n; i++) {
			const val = Math.abs(M[i][k])
			if (val > maxVal) {
				maxVal = val
				pivot = i
			}
		}

		if (maxVal === 0) throw new Error('Matrix is singular or ill-conditioned')

		// Swap rows k and pivot if needed
		if (pivot !== k) {
			const tmp = M[k]
			M[k] = M[pivot]
			M[pivot] = tmp
		}

		// Normalize pivot row (optional but improves stability for small systems)
		const pivotVal = M[k][k]
		for (let j = k; j <= n; j++) M[k][j] /= pivotVal

		// Eliminate below
		for (let i = k + 1; i < n; i++) {
			const factor = M[i][k]
			if (factor === 0) continue
			for (let j = k; j <= n; j++) {
				M[i][j] -= factor * M[k][j]
			}
		}
	}

	// Back substitution
	const x = new Array(n).fill(0)
	for (let i = n - 1; i >= 0; i--) {
		let sum = M[i][n] // RHS
		for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j]
		x[i] = sum // diagonal is normalized to 1
	}

	return x
}

export default gaussianElimination

