// 응답의 형태: 경로(예: items.item[].exmn_dd_prc)마다 관측된 값의 타입 목록.
// 값은 담지 않는다. 가격은 매일 바뀌므로 형태와 코드만 비교한다 (api 계약 테스트 명세).

export type Shape = Record<string, string[]>

export function describeShape(value: unknown): Shape {
  const seen = new Map<string, Set<string>>()
  collect(value, "", seen)
  const shape: Shape = {}
  for (const path of [...seen.keys()].sort()) {
    shape[path] = [...(seen.get(path) ?? [])].sort()
  }
  return shape
}

function collect(value: unknown, path: string, seen: Map<string, Set<string>>): void {
  if (path !== "") {
    const types = seen.get(path) ?? new Set<string>()
    types.add(typeName(value))
    seen.set(path, types)
  }
  if (Array.isArray(value)) {
    for (const element of value) collect(element, `${path}[]`, seen)
    return
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      collect(child, path === "" ? key : `${path}.${key}`, seen)
    }
  }
}

function typeName(value: unknown): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}
