// 앱의 모든 경로를 여기서 만든다. 화면 코드는 경로 문자열을 직접 쓰지 않고 routes를 쓴다.
// 제철 영역의 접두어(/seasonal)나 메인 경로가 바뀌어도 이 파일과 폴더 이름만 고치면 된다.

import type { Festival } from "@workspace/seasonal/data/festivals"
import type { Season } from "@workspace/seasonal/data/seasons"
import { encodeSpec, type Paper, type PrintSpec, type PublishedPaper } from "@workspace/seasonal/print/spec"

export const routes = {
  /** 서비스 메인(P1 시세 메인). 로고와 하단 내비 "시세"가 여기로 간다. */
  home: "/",

  /** 가격 화면(시세 · 판정). .scratch/price-screens/spec.md */
  price: {
    /** P2 품종 검색. 검색어는 ?q= */
    search: "/search",
    searchFor: (query: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
    /** P3 품종 상세의 접두 경로 */
    varieties: "/prices",
    /** P3 품종 상세 */
    variety: (id: string) => `/prices/${id}`,
    /** P4 담은 품종 */
    basket: "/basket",
  },

  seasonal: {
    /** 2a 이달 · 12개월 스크롤 */
    root: "/seasonal",
    /** 2a의 그 달 섹션. 해시라 정적 셸이 유지되고, 2a가 해시를 읽어 즉시 이동한다. */
    rootAt: (month: number) => `/seasonal#month-${month}`,
    /** 2b 월별 보기: 열두 달 카드 목록과 그 달 상세 */
    months: "/seasonal/months",
    month: (month: number) => `/seasonal/months/${month}`,
    /** 3a 계절 히어로 · 계절 상세 */
    seasons: "/seasonal/seasons",
    season: (season: Season) => `/seasonal/seasons/${season}`,
    /** 1g 명절. 접두 경로만 열면 proxy.ts가 다가오는 명절로 보낸다. */
    festivals: "/seasonal/festivals",
    festival: (festival: Festival) => `/seasonal/festivals/${festival}`,
    /** 1h 나의 식탁 */
    myTable: "/seasonal/my-table",
    /** 1i 품종 상세. 제철 화면 안에서 누르면 하단 시트로, 주소로 직접 열면 전체 페이지로 뜬다. */
    food: (id: string) => `/seasonal/foods/${id}`,
    /** 달력·포스터 PDF 내려받기 */
    downloads: "/seasonal/downloads",
    /** 에디션 상세. 제철 화면 안에서 누르면 하단 시트로, 주소로 직접 열면 전체 페이지로 뜬다. */
    download: (id: string) => `/seasonal/downloads/${id}`,
    /** 에디션 PDF 내려받기 주소. 저장소의 짧은 서명 링크로 넘긴다(ADR 0003). */
    downloadFile: (id: string, paper: PublishedPaper) => `/seasonal/downloads/${id}/${paper.toLowerCase()}`,
  },

  /** 인쇄물 어드민. 개발 서버에서만 열린다(.scratch/calendar-print/spec.md). */
  admin: {
    root: "/admin",
    edition: (id: string) => `/admin/edit?id=${encodeURIComponent(id)}`,
    /** 인쇄물 구조 안(와이어프레임) 모음 */
    wireframes: "/admin/wireframes",
  },

  /** 인쇄 전용 페이지. 어드민 미리보기와 PDF 생성기가 연다. */
  print: (spec: PrintSpec, paper: Paper) => `/print?spec=${encodeSpec(spec)}&paper=${paper}`,
} as const
