"use client"

import { SectionRow } from "@/shared/shell/section-row"

import { SearchEntry } from "../components/search-entry"
import { HOME_SEARCH_ID } from "./search-id"

/** P1 본문 검색창(id)이 화면 위로 지나가면 헤더 아래에 붙는 얇은 검색 줄. */
export function HomeSearchRow() {
  return (
    <SectionRow watch={HOME_SEARCH_ID} label="품종 검색(고정)">
      <SearchEntry className="h-8 flex-1 px-3.5 text-sm shadow-none [&_svg]:size-4" />
    </SectionRow>
  )
}
