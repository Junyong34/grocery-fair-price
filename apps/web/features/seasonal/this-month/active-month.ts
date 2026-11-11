import { create } from "zustand"

// 2a에서 지금 보고 있는 달. 스크롤 위치가 정하고, 인디케이터·월 레일·데스크톱 휠이 읽는다.
// null이면 맨 위 히어로("지금은 N월")를 보고 있다.
export const useActiveMonth = create<{ active: number | null }>()(() => ({ active: null }))

// 내용을 그리기로 한 달(LazyMonth). 한 번 그린 달은 계속 둔다. 서버가 그린 달은 여기 없어도 이미 내용이 있다.
const useRequestedMonths = create<{ months: ReadonlySet<number> }>()(() => ({ months: new Set() }))

export function requestMonth(month: number) {
  const { months } = useRequestedMonths.getState()
  if (!months.has(month)) useRequestedMonths.setState({ months: new Set(months).add(month) })
}

export function useRequestedMonth(month: number): boolean {
  return useRequestedMonths((state) => state.months.has(month))
}

export const HERO_ID = "this-month-top"
export const monthSectionId = (month: number) => `month-${month}`

/**
 * 그 달 섹션(null이면 히어로)으로 부드러운 스크롤 없이 즉시 이동하고, 도착한 섹션만 나타나게 한다(명세 3.1 ②).
 * 위치 보정은 섹션의 scroll-margin-top이 맡는다. 아직 내용을 그리지 않은 달이면 먼저 그리게 한다(LazyMonth).
 */
export function jumpToMonth(month: number | null) {
  if (month) requestMonth(month)
  const target = document.getElementById(month ? monthSectionId(month) : HERO_ID)
  if (!target) return
  alignTo(target)
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" })
  }
}

// 화면 밖 달은 예상 높이로 놓여 있다가(content-visibility) 화면 가까이 오면 실제 높이로 그려진다. 바로 위 달이 이동한 뒤
// 수백 ms 지나 그려지며 자리를 민다(8월은 예상보다 약 200px 크다). 그래서 ALIGN_MS 동안 밀릴 때마다 다시 맞춘다.
// 그사이 사용자가 직접 스크롤하면 바로 그만둔다. 늦게 그리는 달은 내용 청크를 받는 동안(비어 있는 동안) 기다렸다가 그 뒤 ALIGN_MS를 센다.
const ALIGN_MS = 600
/** 내용 청크를 기다리는 최대 시간. 느린 망에서 끝없이 붙잡지 않는다. */
const LOAD_WAIT_MS = 4000
let stopAlign: (() => void) | null = null

function alignTo(target: HTMLElement) {
  stopAlign?.()
  const align = () => target.scrollIntoView({ block: "start", behavior: "instant" })
  align()
  const expected = target.getBoundingClientRect().top
  const started = performance.now()
  let until = started + ALIGN_MS
  let frame = 0
  const check = () => {
    if (Math.abs(target.getBoundingClientRect().top - expected) >= 1) align()
    const now = performance.now()
    if (target.childElementCount === 0 && now - started < LOAD_WAIT_MS) until = now + ALIGN_MS
    if (now < until) frame = requestAnimationFrame(check)
    else stop()
  }
  const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const
  const stop = () => {
    cancelAnimationFrame(frame)
    for (const type of inputs) window.removeEventListener(type, stop, true)
    stopAlign = null
  }
  for (const type of inputs) window.addEventListener(type, stop, { capture: true, passive: true })
  stopAlign = stop
  frame = requestAnimationFrame(check)
}
