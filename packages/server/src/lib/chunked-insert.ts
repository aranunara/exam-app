const D1_MAX_BOUND_PARAMS = 50

export async function chunkedInsert<T>(
  values: T[],
  fieldsPerRow: number,
  insertFn: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  if (values.length === 0) return
  const chunkSize = Math.max(1, Math.floor(D1_MAX_BOUND_PARAMS / fieldsPerRow))
  for (let i = 0; i < values.length; i += chunkSize) {
    await insertFn(values.slice(i, i + chunkSize))
  }
}
