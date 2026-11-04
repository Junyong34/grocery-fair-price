"use client"

import { SectionRow } from "@/shared/shell/section-row"

import { SearchEntry } from "../components/search-entry"
import { HOME_SEARCH_ID } from "./search-id"

/** P1 본문 검색창(id)이 화면 위로 지나가면 헤더 아래에 붙는 검색 줄. 높이는 헤더와 같은 56px, 입력창은 P2 검색 헤더와 같은 44px. */
export function HomeSearchRow() {
  return (
    <SectionRow watch={HOME_SEARCH_ID} label="품종 검색(고정)" className="h-14">
      <SearchEntry className="h-11 flex-1 px-4 shadow-none [&_svg]:size-[18px]" />
    </SectionRow>
  )
}
