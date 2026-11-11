"use client"

import { useLayoutEffect, useRef, useState } from "react"

/**
 * 모바일 달 판의 달력을 이 폭(375 화면의 판 폭, css px)으로 그린 뒤 실제 판 폭에 맞춰 확대·축소한다.
 * 판은 폭에 비례해 커지지만 달력 글자는 고정 크기라, 그대로 두면 넓은 화면에서 비워 둔 달력 자리 위에 빈 띠가 남는다.
 */
const BASE_WIDTH = 309

/**
 * 판(부모) 바닥에 붙는 달력. 배율 = 판 폭 / BASE_WIDTH, 재기 전(서버 HTML)은 1이다.
 * 이달 화면의 달 섹션은 content-visibility:auto라, 화면 밖 판은 화면 가까이 올 때까지 ResizeObserver가 알리지 않는다.
 * 그러면 월 레일로 이동한 직후 달력이 1배로 작게 보였다가 커진다. 그래서 처음과 창 크기가 바뀔 때는 직접 잰다.
 */
export function CalendarFit({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const field = ref.current?.parentElement
    if (!field) return
    const measure = () => setScale(field.getBoundingClientRect().width / BASE_WIDTH)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(field)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])
  return (
    <div ref={ref} className="absolute bottom-0 left-0 z-0 origin-bottom-left px-2 pb-2" style={{ width: BASE_WIDTH, scale }}>
      {children}
    </div>
  )
}
