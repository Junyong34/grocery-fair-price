"use client"

import { useEffect } from "react"

import { jumpToMonth, useActiveMonth } from "./active-month"

/**
 * 스크롤 위치로 지금 보는 달을 정한다. 화면 높이 45% 위로 지나간 마지막 [data-month] 섹션이 활성 달이다.
 * 주소에 #month-N이 있으면 처음 그릴 때 그 달로 이동한다(다른 화면의 "달력에서 보기").
 */
export function MonthScrollSpy() {
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.45
      let active: number | null = null
      for (const section of document.querySelectorAll<HTMLElement>("[data-month]")) {
        if (section.getBoundingClientRect().top < line) active = Number(section.dataset.month)
      }
      if (useActiveMonth.getState().active !== active) useActiveMonth.setState({ active })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const fromHash = /^#month-(\d{1,2})$/.exec(window.location.hash)
    if (fromHash) jumpToMonth(Number(fromHash[1]))
    update()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    // 새로고침 때 브라우저가 되살린 스크롤 위치는 그림·달력이 그려지며 높이가 바뀌는 동안 scroll 이벤트 없이 달라진다.
    // 본문 높이가 바뀔 때도 다시 재서, 맨 위로 돌아왔는데 마지막 달이 활성으로 남는 일을 막는다.
    const observer = new ResizeObserver(onScroll)
    observer.observe(document.body)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
