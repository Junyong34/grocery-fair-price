"use client"

import { useEffect, useRef, type RefObject } from "react"

/**
 * 옆으로 넘치는 한 줄(탭 줄)을 밀어 보게 한다. 터치는 브라우저가 스와이프로 밀고, 여기서는 그 밖을 맡는다.
 * - 마우스 세로 휠을 가로 이동으로 바꾼다(넘칠 때만. 안 넘치면 페이지가 그대로 스크롤된다).
 * - 양 끝에 더 있으면 data-more-start·data-more-end를 붙여 CSS가 가장자리를 흐리게 한다.
 * - 고른 항목(aria-selected)이 바뀌면 줄 안에서 보이게 민다. 페이지는 세로로 움직이지 않는다(scrollIntoView를 쓰지 않는 까닭).
 * selected는 고른 값이다. 바뀔 때마다 다시 민다.
 */
export function useScrollStrip<T extends HTMLElement>(selected: string): RefObject<T | null> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const mark = () => {
      const max = node.scrollWidth - node.clientWidth
      node.toggleAttribute("data-more-start", node.scrollLeft > 1)
      node.toggleAttribute("data-more-end", node.scrollLeft < max - 1)
    }
    const onWheel = (event: WheelEvent) => {
      if (node.scrollWidth <= node.clientWidth || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      event.preventDefault()
      node.scrollLeft += event.deltaY
    }
    mark()
    node.addEventListener("scroll", mark, { passive: true })
    node.addEventListener("wheel", onWheel, { passive: false })
    const observer = new ResizeObserver(mark)
    observer.observe(node)
    return () => {
      node.removeEventListener("scroll", mark)
      node.removeEventListener("wheel", onWheel)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = ref.current
    const item = node?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!node || !item) return
    const start = item.getBoundingClientRect().left - node.getBoundingClientRect().left + node.scrollLeft
    const left = start < node.scrollLeft ? start : start + item.offsetWidth > node.scrollLeft + node.clientWidth ? start + item.offsetWidth - node.clientWidth : node.scrollLeft
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    node.scrollTo({ left, behavior: reduce ? "auto" : "smooth" })
  }, [selected])

  return ref
}
