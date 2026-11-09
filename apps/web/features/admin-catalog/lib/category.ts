// 카테고리 어드민의 순수 규칙: 입력 검사와 순서 바꾸기 (GLOSSARY "카테고리", ADR 0005).

export const CATEGORY_NAME_MAX = 20
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export type CategoryInput = { slug: string; name: string }
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

export function parseCategoryInput(input: { slug: string; name: string }): Parsed<CategoryInput> {
  const slug = input.slug.trim()
  const name = input.name.trim()
  if (!SLUG.test(slug)) return { ok: false, error: "slug는 영문 소문자·숫자·하이픈만 써요 (예: ramen-noodle)." }
  if (name.length === 0 || name.length > CATEGORY_NAME_MAX) return { ok: false, error: `이름은 1~${CATEGORY_NAME_MAX}자로 적어 주세요.` }
  return { ok: true, value: { slug, name } }
}

type Ordered = { id: number; sort: number | null }

// 이웃과 자리를 바꾼다. rows는 지금 보이는 순서. 돌려주는 값: 바뀔 행의 새 sort (끝이면 빈 배열)
export function moveOrder(rows: readonly Ordered[], id: number, direction: "up" | "down"): { id: number; sort: number }[] {
  const at = rows.findIndex((r) => r.id === id)
  const other = at + (direction === "up" ? -1 : 1)
  if (at < 0 || other < 0 || other >= rows.length) return []
  const position = (i: number) => rows[i]!.sort ?? i + 1
  const [a, b] = [position(at), position(other)]
  // 같은 sort였다면 자리를 바꿔도 같아지므로 위치 번호를 쓴다
  const [sa, sb] = a === b ? [other + 1, at + 1] : [b, a]
  return [
    { id: rows[at]!.id, sort: sa },
    { id: rows[other]!.id, sort: sb },
  ]
}

// 보정: 지금 보이는 순서대로 1부터 다시 매긴다. 바뀐 행만 돌려준다
export function renumber(rows: readonly Ordered[]): { id: number; sort: number }[] {
  return rows.flatMap((r, i) => (r.sort === i + 1 ? [] : [{ id: r.id, sort: i + 1 }]))
}
