// 옵션 칸이 고치는 사양의 경로(["calendar", "weekStart"] 같은)를 읽고 쓴다. 원본은 바꾸지 않는다.

/** 경로의 값을 읽는다. */
export function getAt(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)
}

/** 경로의 값을 바꾼 새 객체 */
export function setAt<T>(value: T, path: readonly string[], next: unknown): T {
  const [key, ...rest] = path
  if (key === undefined) return next as T
  const node = value as Record<string, unknown>
  return { ...node, [key]: setAt(node[key], rest, next) } as T
}
