"use client"

import { useEffect, useRef, useState } from "react"

import { COPY_FEEDBACK_MS } from "../constants"

/**
 * 클립보드 복사와 "복사했어요" 표시. key로 어느 버튼에서 복사했는지 기억하고, 잠시 뒤 표시를 지운다.
 * 클립보드를 쓸 수 없으면(권한 거절 등) 표시하지 않는다.
 */
export function useCopy<K extends string = string>() {
  const [copied, setCopied] = useState<K>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async (key: K, text: string) => {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      timer.current = setTimeout(() => setCopied(undefined), COPY_FEEDBACK_MS)
    } catch {
      setCopied(undefined)
    }
  }

  return { copied, copy }
}
