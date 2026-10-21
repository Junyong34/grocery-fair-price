// 에디션 표의 줄 모양. 머리줄(kind-group)과 줄(edition-row)이 같은 열을 쓴다.
export const BOARD_COLUMNS = "sm:grid-cols-[minmax(0,1fr)_88px_148px_148px] sm:gap-x-4"

/** 줄 전체를 덮는 링크. 그 위에 눌러야 하는 것은 ABOVE_ROW_LINK로 올린다. */
export const ROW_LINK = "after:absolute after:inset-0 after:content-['']"
export const ABOVE_ROW_LINK = "relative z-10"
