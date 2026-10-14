import { create } from "zustand"

// 2a에서 지금 보고 있는 달. 스크롤 위치가 정하고, 인디케이터·월 레일·데스크톱 휠이 읽는다.
// null이면 맨 위 히어로("지금은 N월")를 보고 있다.
export const useActiveMonth = create<{ active: number | null }>()(() => ({ active: null }))

export const HERO_ID = "this-month-top"
export const monthSectionId = (month: number) => `month-${month}`

/**
 * 그 달 섹션(null이면 히어로)으로 부드러운 스크롤 없이 즉시 이동하고, 도착한 섹션만 나타나게 한다(명세 3.1 ②).
 * 위치 보정은 섹션의 scroll-margin-top이 맡는다.
 */
export function jumpToMonth(month: number | null) {
  const target = document.getElementById(month ? monthSectionId(month) : HERO_ID)
  if (!target) return
  target.scrollIntoView({ block: "start", behavior: "instant" })
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" })
  }
}
