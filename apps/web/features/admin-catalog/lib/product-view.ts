// 상품 목록 어드민의 화면 모양 (catalog-scale/10의 읽기 화면). DB 행을 화면 상태·요약으로 바꾸는 순수 함수.

export type ProductRow = {
  goodId: string // 참가격 상품 번호. 상품 상세 주소에 쓴다
  name: string
  status: "surveyed" | "not_surveyed" | "merged" // product.status
  category: string // 품목의 카테고리. 품목이 없으면 출처 분류 대응표(05)의 카테고리, 그것도 없으면 "기타"
  item: string // 품목 이름. 품목이 없으면 참가격 소분류 이름
  itemSet: boolean // product.item_id가 정해졌나 (아니면 item은 소분류 이름이다)
  // 품종 연결 (product_variety_map): 이으면 그 품종, 아니면 제외(가공식품 등) · pending
  link: { kind: "mapped"; variety: string; varietyName: string } | { kind: "ignored" } | { kind: "pending" }
  // 지금 공개된 판정 묶음의 상품 payload. 없으면 상품 상세가 404다 (전국 요약이 한 번도 없다)
  page: { status: "active" | "stale" | "discontinued"; price: number; perUnit: string | null; surveyedOn: string } | null
}

export type PageState = "shown" | "stale" | "no-page" | "discontinued"

export const PAGE_STATE_LABEL: Record<PageState, string> = {
  shown: "노출",
  stale: "노출 · 오래됨",
  "no-page": "미노출 · 전국 요약 없음",
  discontinued: "조사 중단",
}

export function pageStateOf(r: ProductRow): PageState {
  if (r.status !== "surveyed" || r.page?.status === "discontinued") return "discontinued"
  if (r.page === null) return "no-page"
  return r.page.status === "stale" ? "stale" : "shown"
}

export type ProductSummary = { total: number; shown: number; stale: number; noPage: number; discontinued: number; noItem: number }

export function summarizeProducts(rows: readonly ProductRow[]): ProductSummary {
  const count = (state: PageState) => rows.filter((r) => pageStateOf(r) === state).length
  return {
    total: rows.length,
    shown: count("shown"),
    stale: count("stale"),
    noPage: count("no-page"),
    discontinued: count("discontinued"),
    noItem: rows.filter((r) => !r.itemSet).length,
  }
}
