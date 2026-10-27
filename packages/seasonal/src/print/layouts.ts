import type { PrintKind } from "./spec"

// 인쇄물 구성(layout) 정의. 구성 하나가 무엇인지(이름, 와이어프레임 안, 용지 방향, 품종 상한, 읽지 않는 옵션)를 이 표 한 곳에 둔다.
// 사양 스키마(spec.ts), 어드민 편집 폼(admin-print/editor/option-fields.ts), 품종 고르기(foods.ts)가 모두 여기서 읽는다.
// 새 구성은 LAYOUTS에 값을, LAYOUT_DEFS에 정의를 더하고 종류별 화면(apps/web/features/print/<kind>.tsx)에 그리기를 더한다.

/** 종류마다 구성 값. 사양 스키마의 enum이고, LAYOUT_DEFS가 값마다 정의를 빠짐없이 갖는다(타입이 검사한다). */
export const LAYOUTS = {
  monthly: ["scatter", "grid", "none", "side-check", "strip", "allover"],
  "year-sheet": ["pairs", "hero-top", "chart"],
  "season-poster": ["bands", "quarters", "wheel", "per-season"],
  "month-poster": ["cells", "chart", "wheel", "rows-check"],
} as const satisfies Record<PrintKind, readonly string[]>

/** 구성에 따라 읽거나 읽지 않는 사양 옵션(경로). 읽지 않으면 편집 폼이 숨기고 인쇄도 그 값을 보지 않는다. 값은 사양에 남는다. */
export type LayoutOption = "foods.names" | "foods.max" | "memo" | "grid" | "calendar.variant" | "calendar.weekStart"

export type LayoutDef = {
  /** 편집 폼의 구성 이름 */
  label: string
  /** 그리는 와이어프레임 안 코드(apps/web/features/admin-print/lib/wireframe-catalog.ts). 한 안을 여러 값이 같이 쓸 수 있다(M-A). */
  wireframe: string
  /** 세로 용지에서만 된다. 가로 용지에서는 칸이 너무 좁거나 낮아진다. 스키마가 가로 + 이 구성을 거절한다. */
  portraitOnly?: boolean
  /** 칸 하나(달)에 넣는 그림 품종 수의 판 크기 상한. 사양의 foods.max와 작은 쪽을 쓰고, 편집 폼의 최대 개수도 여기까지다. */
  foodsCap?: number
  /** 이 구성이 읽지 않는 옵션 */
  ignores?: readonly LayoutOption[]
  /** 가로 용지일 때 더 읽지 않는 옵션 */
  landscapeIgnores?: readonly LayoutOption[]
}

/** 구성 값마다 정의. 종류·값이 LAYOUTS와 어긋나면 타입 오류다. */
export const LAYOUT_DEFS: { [K in PrintKind]: Record<(typeof LAYOUTS)[K][number], LayoutDef> } = {
  monthly: {
    scatter: { label: "그림 위, 달력 아래 · 흩뿌림", wireframe: "M-A" },
    grid: { label: "그림 위, 달력 아래 · 줄 맞춤", wireframe: "M-A" },
    none: { label: "달력만(그림 없음)", wireframe: "M-A", ignores: ["foods.names", "foods.max"] },
    // 체크 목록이 달력 옆에 있어 달력 아래 메모 자리가 없다.
    "side-check": { label: "달력 옆 제철 체크 목록(세로 용지)", wireframe: "M-B", portraitOnly: true, ignores: ["memo"] },
    // 쓰는 칸이 필요해 달력은 격자 모양으로 정해져 있고, 그림 있는 품종을 모두 띠와 빈 칸에 넣는다(foods.ts stripFoods). 달력 칸 자체가 쓰는 자리다.
    strip: { label: "쓰는 큰 칸 달력 + 그림 띠(빈 날짜 칸에도 그림)", wireframe: "M-D", ignores: ["memo", "foods.max", "calendar.variant"] },
    // 그림이 판 전체라 메모가 없다. 가로 용지는 달력 대신 날짜를 한 열로 늘어놓아 달력 모양과 주 시작이 없다.
    allover: {
      label: "그림이 판 전체, 달력은 모서리 블록(세로)·날짜 한 열(가로)",
      wireframe: "M-E",
      ignores: ["memo"],
      landscapeIgnores: ["calendar.variant", "calendar.weekStart"],
    },
  },
  "year-sheet": {
    pairs: { label: "그림·달력 짝 체크무늬", wireframe: "Y-A" },
    // 달 배열이 3x4로, 위 그림은 달마다 하나로 정해져 있다(foods.ts yearPictures).
    "hero-top": { label: "큰 그림 위, 열두 달 아래(세로 용지)", wireframe: "Y-B", portraitOnly: true, ignores: ["grid", "foods.max"] },
    // 달 배열이 방향마다 정해져 있고, 막대표는 달마다 넷을 줄마다 이름과 함께 싣는다(foods.ts chartFoods).
    chart: { label: "열두 달 달력 + 제철 막대표", wireframe: "Y-C", ignores: ["grid", "foods.max", "foods.names"] },
  },
  "season-poster": {
    bands: { label: "가로 띠 넷", wireframe: "S-A" },
    quarters: { label: "사분면(가로 용지는 네 열)", wireframe: "S-B" },
    // 그림을 고리에 빽빽이 놓아 이름 자리가 없다.
    wheel: { label: "사계절 원형 판", wireframe: "S-C", ignores: ["foods.names"] },
    "per-season": { label: "계절마다 한 장(4쪽)", wireframe: "S-D" },
  },
  "month-poster": {
    cells: { label: "열두 칸", wireframe: "P-A" },
    // 줄마다 이름을 적고 달마다 대표 여섯을 싣는다(foods.ts chartFoods).
    chart: { label: "품종×달 막대표", wireframe: "P-B", ignores: ["grid", "foods.names", "foods.max"] },
    // 원판 조각 하나가 좁아 넷을 넘으면 그림이 작아진다. 이름 자리가 없다.
    wheel: { label: "열두 달 원형 판", wireframe: "P-C", foodsCap: 4, ignores: ["grid", "foods.names"] },
    // 한 줄로만 놓아 여섯을 넘으면 두 줄로 접혀 그림이 작아진다. 나머지는 체크 목록에 이름으로 있다. 달을 한 줄씩 쌓는다.
    "rows-check": {
      label: "한 줄에 한 달 · 장보기 체크(세로 용지)",
      wireframe: "P-D",
      portraitOnly: true,
      foodsCap: 6,
      ignores: ["grid", "foods.names"],
    },
  },
}

/** 구성을 고른 사양. 스키마가 이 모듈을 쓰므로 PrintSpec 대신 필요한 필드만 받는다. */
type LayoutChoice = { kind: PrintKind; layout: string }

/** 사양이 고른 구성의 정의. */
export function layoutDef(spec: LayoutChoice): LayoutDef {
  return (LAYOUT_DEFS[spec.kind] as Record<string, LayoutDef>)[spec.layout]!
}

/** 이 사양(구성 · 용지 방향)이 그 옵션을 읽는가. 읽지 않으면 편집 폼이 숨긴다. */
export function layoutReads(spec: LayoutChoice & { orientation: "portrait" | "landscape" }, option: LayoutOption): boolean {
  const def = layoutDef(spec)
  if (def.ignores?.includes(option)) return false
  return !(spec.orientation === "landscape" && def.landscapeIgnores?.includes(option))
}

/** 칸 하나에 넣을 그림 품종 수: 사양의 foods.max와 구성의 판 크기 상한 가운데 작은 쪽. */
export function foodsPerCell(spec: LayoutChoice & { foods: { max: number } }): number {
  return Math.min(spec.foods.max, layoutDef(spec).foodsCap ?? Infinity)
}
