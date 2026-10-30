import type { PublishedPaper, PrintKind } from "@workspace/seasonal/print/spec"

// 분석 이벤트 카탈로그. 화면은 track(이름, 매개변수)만 부른다(./track.ts).
// 더하기: AnalyticsEvents에 한 줄 + EVENT_SAMPLES에 표본 + 부르는 곳. 새 매개변수면 GA 관리 → 맞춤 정의에 등록하고 REGISTERED_PARAMS에 더한다.
// 지우기: AnalyticsEvents에서 지우면 부르는 곳이 타입 오류로 드러난다. 고치기도 같다. 규칙은 events.test.ts가 검사한다.

/** 이벤트 이름 → 매개변수. 주석은 언제 보내는지다. */
export type AnalyticsEvents = {
  /** 인쇄물 상세의 "PDF 내려받기" · 받은 뒤 "다시 내려받기" */
  print_download: { edition_id: string; edition_kind: PrintKind; paper: PublishedPaper; placement: "sheet" | "page" }
  /** "A3도 원해요"를 이 기기에서 처음 누를 때만 */
  print_a3_request: { edition_id: string; edition_kind: PrintKind }
  /** 인쇄물 상세의 "공유", 받은 뒤 "링크 복사" · "공유하기" */
  print_share: { edition_id: string; method: "copy" | "share" }
  /** 2a · 2b의 "제철 달력 · 포스터 PDF 받기" 카드 */
  print_entry_click: { placement: "this-month" | "month-timeline" }
}

export type AnalyticsEventName = keyof AnalyticsEvents

/** GA 관리 → 맞춤 정의에 등록한 이벤트 매개변수. 등록하지 않은 매개변수는 보고서에 나오지 않는다. */
export const REGISTERED_PARAMS = ["edition_id", "edition_kind", "paper", "placement", "method"] as const

/** 이벤트마다 표본 하나. 규칙 테스트가 읽는다. 이벤트를 더하면 타입이 표본을 요구한다. */
export const EVENT_SAMPLES: { [N in AnalyticsEventName]: AnalyticsEvents[N] } = {
  print_download: { edition_id: "monthly-1", edition_kind: "monthly", paper: "A4", placement: "sheet" },
  print_a3_request: { edition_id: "monthly-1", edition_kind: "monthly" },
  print_share: { edition_id: "monthly-1", method: "copy" },
  print_entry_click: { placement: "this-month" },
}
