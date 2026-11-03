"use client"

import { useEffect, useState } from "react"

/**
 * 본문의 원래 줄(id=watch)의 아래 끝이 고정 줄(헤더 --shell-top, belowTabs면 + 탭 줄 --tabs-h) 밑으로 지나갔는지.
 * edge="center"면 줄의 세로 가운데가 지나갔는지 본다(반쯤 가려지면 지나간 것으로).
 * 구간 줄(section-row)과 하위 헤더 제목(sub-header revealAfter)이 같이 쓴다.
 */
export function useScrolledPast(
  watch: string | undefined,
  {
    belowTabs = false,
    edge = "bottom",
  }: { belowTabs?: boolean; edge?: "bottom" | "center" } = {}
) {
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    if (!watch) return
    let frame = 0
    const update = () => {
      frame = 0
      const target = document.getElementById(watch)
      if (!target) return setPassed(false)
      const root = getComputedStyle(document.documentElement)
      const top =
        parseFloat(root.getPropertyValue("--shell-top")) +
        (belowTabs ? parseFloat(root.getPropertyValue("--tabs-h")) : 0)
      const rect = target.getBoundingClientRect()
      setPassed(
        (edge === "center" ? rect.top + rect.height / 2 : rect.bottom) < top
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [watch, belowTabs, edge])
  return passed
}
