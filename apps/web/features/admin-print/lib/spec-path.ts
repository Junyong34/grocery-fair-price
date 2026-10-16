export function getAt(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)
}

export function setAt<T>(value: T, path: readonly string[], next: unknown): T {
  const [key, ...rest] = path
  if (key === undefined) return next as T
  const node = value as Record<string, unknown>
  return { ...node, [key]: setAt(node[key], rest, next) } as T
}
