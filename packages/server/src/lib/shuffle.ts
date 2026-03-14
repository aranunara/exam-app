export function shuffleArray<T>(array: ReadonlyArray<T>): T[] {
  const result = [...array]
  const bytes = new Uint32Array(result.length)
  crypto.getRandomValues(bytes)

  for (let i = result.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1)
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }

  return result
}
