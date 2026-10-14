// 앱의 모든 경로를 여기서 만든다. 화면 코드는 경로 문자열을 직접 쓰지 않고 routes를 쓴다.
// 제철 영역의 접두어(/seasonal)나 메인 경로가 바뀌어도 이 파일과 폴더 이름만 고치면 된다.

import type { Festival } from "@workspace/seasonal/data/festivals"
import type { Season } from "@workspace/seasonal/data/seasons"

export const routes = {
  /**
   * "/"가 보내는 곳. 지금은 제철 메인이다.
   * 식재료 가격 비교 메인이 생기면 app/page.tsx를 그 화면으로 바꾸고, 이 값은 지운다.
   */
  home: "/seasonal",

  seasonal: {
    /** 2a 이달 · 12개월 스크롤 */
    root: "/seasonal",
    /** 2b 월별 보기. 접두 경로만 열면 proxy.ts가 이번 달로 보낸다. */
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
  },
} as const
