import type { EditionStatus } from "@workspace/seasonal/print/edition"
import type { PrintKind } from "@workspace/seasonal/print/spec"

// 인쇄물 어드민의 화면 사이에서 오가는 타입. 도메인 타입(Edition, BuildRecord, PrintSpec)은 @workspace/seasonal/print에 있다.

/** Server Action 결과. 성공하면 data, 실패하면 화면에 보일 error 문장. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

/** useActionState로 부르는 폼 액션의 상태 */
export type FormState = { error?: string }

/** 편집기에서 진행 중인 작업 */
export type EditorAction = "save" | "generate"

/** 목록 한 줄에 필요한 것만 추린 에디션 */
export type EditionSummary = {
  id: string
  kind: PrintKind
  title: string
  status: EditionStatus
  /** 지금 사양으로 만든 PDF의 생성일(서울, "2026-10-16"). 없거나 사양이 바뀌었으면 null */
  generatedAt: string | null
}

/** 상태 점의 뜻: 끝남 · 손봐야 함 · 아직 아님 */
export type StatusTone = "ok" | "warn" | "idle"
