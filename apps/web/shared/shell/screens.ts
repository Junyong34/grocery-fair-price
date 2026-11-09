import { routes } from "@/shared/routes"

import { matchesPath } from "./match-path"

// 화면별 헤더 타입과 스크롤 동작(.scratch/shell-unify/spec.md 3장 · 4-1). 새 화면은 여기에 한 줄을 더해 정한다.
// 셸(site-nav)이 이 표를 읽는다. 페이지마다 prop으로 흩지 않는다.

/** 헤더 타입. root = 로고 · 🔍 · ⚙, sub = ‹ · 제목 · 액션(화면이 SubHeader로 채운다), search = 화면의 검색 입력이 헤더 자리를 맡는다. */
export type HeaderKind = "root" | "sub" | "search"

/** hide-on-scroll = 아래로 스크롤하면 헤더가 숨고 위로 올리면 나온다(모바일). pinned = 늘 보인다. */
export type HeaderScroll = "hide-on-scroll" | "pinned"

export type Screen = { header: HeaderKind; scroll: HeaderScroll }

type Row = Screen & { path: string; exact?: boolean }

/** 위에서부터 처음 맞는 줄을 쓴다. 하위 경로가 다른 동작이면 위에 둔다. */
const SCREENS: readonly Row[] = [
  { path: routes.home, exact: true, header: "root", scroll: "hide-on-scroll" },
  { path: routes.price.search, header: "search", scroll: "pinned" },
  { path: routes.price.varieties, header: "sub", scroll: "pinned" },
  { path: routes.price.basket, header: "root", scroll: "pinned" },
  { path: routes.seasonal.myTable, header: "root", scroll: "pinned" },
  { path: routes.seasonal.food("").slice(0, -1), header: "sub", scroll: "pinned" },
  { path: routes.seasonal.downloads, header: "sub", scroll: "pinned" },
  { path: routes.seasonal.root, header: "root", scroll: "hide-on-scroll" },
  { path: routes.babyFood.root, header: "sub", scroll: "pinned" },
  { path: routes.settings.root, header: "sub", scroll: "pinned" },
]

const FALLBACK: Screen = { header: "root", scroll: "pinned" }

/** 경로의 헤더 타입과 스크롤 동작. 표에 없으면 루트 · pinned. */
export function screenOf(pathname: string): Screen {
  const row = SCREENS.find(({ path, exact }) => matchesPath(pathname, path, { exact }))
  return row ? { header: row.header, scroll: row.scroll } : FALLBACK
}
