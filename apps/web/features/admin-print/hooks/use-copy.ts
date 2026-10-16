"use client"

import { useEffect, useRef, useState } from "react"

import { COPY_FEEDBACK_MS } from "../constants"

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
