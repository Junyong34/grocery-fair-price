"use client"

import { useEffect, useRef, useState } from "react"

import { OptionWheel, type OptionWheelItem } from "@workspace/ui/components/option-wheel"

import { formatMonthLabel } from "@workspace/seasonal/data/months"

import { useSettingsStore } from "../stores/settings-store"

import { jumpToMonth, useActiveMonth } from "./active-month"

export type PanelMonth = { month: number; note: string; count: number }

/** 휠을 돌릴 때 본문은 선택이 이만큼 멈춘 뒤 한 번만 이동한다. 클릭·키보드 선택은 바로 이동한다. */
const WHEEL_SETTLE_MS = 150

/**
 * 데스크톱 2a 왼쪽 고정 패널(명세 3.1 데스크톱). 스크롤 중인 달(없으면 이번 달)의 숫자·문구와 달 이동 휠.
 * 휠 항목은 "지금 · 10월"(히어로)과 1~12월이다(달 이름 표기는 ⚙에서 고른다). 스크롤로 바뀐 활성 달은 휠에 되돌려 준다.
 */
export function DesktopMonthPanel({
  thisMonth,
  months,
  presentation = "reel",
}: {
  thisMonth: number
  months: readonly PanelMonth[]
  presentation?: "arc" | "reel"
}) {
  const active = useActiveMonth((state) => state.active)
  const shown = months[(active ?? thisMonth) - 1]!
  const labelStyle = useSettingsStore((state) => state.monthLabel)

  const items: OptionWheelItem[] = [
    { id: "now", label: `지금 · ${formatMonthLabel(thisMonth, labelStyle)}`, description: "맨 위 이번 달 장면" },
    ...months.map(({ month, count }) => ({
      id: String(month),
      label: formatMonthLabel(month, labelStyle),
      description: `${count}가지 제철`,
    })),
  ]

  // 휠은 바로 따라가고(wheelIndex), 본문 이동은 입력 종류에 따라 바로 또는 멈춘 뒤에 한다.
  const [wheelIndex, setWheelIndex] = useState(active ?? 0)
  const lastInput = useRef<"wheel" | "other">("other")
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    // 스크롤이 정한 활성 달을 휠에 반영한다(외부 상태 → 휠).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWheelIndex(active ?? 0)
  }, [active])
  useEffect(() => () => clearTimeout(settle.current), [])

  const onSelect = (index: number) => {
    setWheelIndex(index)
    clearTimeout(settle.current)
    const go = () => jumpToMonth(index === 0 ? null : index)
    if (lastInput.current === "wheel") settle.current = setTimeout(go, WHEEL_SETTLE_MS)
    else go()
  }

  return (
    <div className="flex flex-col gap-4 py-8 pr-6">
      <p className="font-number text-[110px] leading-none tabular-nums">{shown.month}</p>
      <p className="min-h-12 font-heading text-lg text-stone">{shown.note}</p>
      <p className="text-xs text-ash">월 이동 · 누르면 바로 바뀌어요</p>
      <div
        onWheelCapture={() => (lastInput.current = "wheel")}
        onPointerDownCapture={() => (lastInput.current = "other")}
        onKeyDownCapture={() => (lastInput.current = "other")}
      >
        <OptionWheel
          aria-label="달 이동"
          items={items}
          selectedIndex={wheelIndex}
          onSelectionChange={onSelect}
          presentation={presentation}
          labels={{
            heading: "달 이동",
            listbox: "달 이동",
            previous: "이전 달",
            next: "다음 달",
            empty: "달이 없어요",
            noSelection: "선택 없음",
          }}
        />
      </div>
    </div>
  )
}
