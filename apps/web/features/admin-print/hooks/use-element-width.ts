"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

/** 요소의 내용 폭(px)을 따라간다. 처음에는 fallback을 쓰고, 마운트 뒤 실제 폭으로 바꾼다. */
export function useElementWidth<T extends HTMLElement>(fallback: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}
