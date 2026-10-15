"use client"

import { useEffect, useState } from "react"

const TICK_MS = 55

/**
 * 먹음 라벨. animate면 방금 체크한 순간이라 글자가 한 자씩 타자 치듯 나타난다(cojeev caret-swap의 타이핑 느낌).
 * 전체 글자를 보이지 않게 깔아 두어 폭이 흔들리지 않는다. 모션을 줄인 환경이면 바로 다 보인다.
 * 글자는 grapheme 단위로 끊어 한글이 쪼개지지 않는다. 문구가 바뀌면 부모가 key를 바꿔 다시 시작한다.
 */
export function TypedLabel({ text, animate }: { text: string; animate: boolean }) {
  const units = Array.from(new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(text), (part) => part.segment)
  const [shown, setShown] = useState(animate ? 0 : units.length)

  useEffect(() => {
    if (!animate) return
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(units.length)
      return
    }
    const timer = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= units.length) clearInterval(timer)
        return n + 1
      })
    }, TICK_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, text])

  const typing = animate && shown < units.length
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-grid">
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span className="col-start-1 row-start-1 text-right">
          {units.slice(0, shown).join("")}
          {typing && <span className="ml-px inline-block h-[0.9em] w-px translate-y-[0.1em] bg-gold-deep" />}
        </span>
      </span>
    </>
  )
}
