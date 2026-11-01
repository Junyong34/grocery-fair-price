"use client"

import { useEffect, useState } from "react"

import { SectionChip, SectionRow } from "@/shared/shell/section-row"

import { P3_SECTIONS } from "./section-ids"

type Section = { id: string; label: string }

/** 지금 화면 위쪽(고정 줄 바로 아래)에 걸친 섹션. 맨 끝까지 내리면 마지막 섹션. */
function useCurrentSection(sections: readonly Section[]) {
  const [current, setCurrent] = useState<string | undefined>(sections[0]?.id)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shell-top")) + 56
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      const passed = sections.filter(({ id }) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line)
      setCurrent((atEnd ? sections.at(-1) : passed.at(-1) ?? sections[0])?.id)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [sections])
  return current
}

/** P3 섹션 칩 줄(시세 · 어디서 · 왜 · 내 가격). 제목 줄이 헤더 밑으로 지나가면 하위 헤더 아래에 붙는다. */
export function SectionChips({ sections }: { sections: readonly Section[] }) {
  const current = useCurrentSection(sections)
  return (
    <SectionRow watch={P3_SECTIONS.title} label="섹션 이동">
      {sections.map(({ id, label }) => (
        <SectionChip
          key={id}
          href={`#${id}`}
          current={current === id}
          onClick={(event) => {
            event.preventDefault()
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
          }}
        >
          {label}
        </SectionChip>
      ))}
    </SectionRow>
  )
}
