"use client"

import { useState } from "react"
import { overlay } from "overlay-kit"

import { BottomSheet, openBottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"

type Range = "이번 달" | "12개월 전체"

export function BottomSheetDemo() {
  const [range, setRange] = useState<Range>("이번 달")

  // 1) overlay.open — 열기만 하고 결과는 받지 않는다. 안내·상세 보기용.
  const openInfo = () =>
    overlay.open(({ isOpen, close, unmount }) => (
      <BottomSheet
        open={isOpen}
        onClose={close}
        onExited={unmount}
        title="전어"
        description="제철 9·10월 · 가을"
        footer={<Button onClick={close}>닫기</Button>}
      >
        <p className="text-sm text-stone">
          음식 상세 시트 자리. 바깥을 누르거나 Esc를 눌러도 닫힌다.
        </p>
      </BottomSheet>
    ))

  // 2) openBottomSheet(= overlay.openAsync) — 고른 값을 await로 돌려받는다. 닫기만 하면 null.
  const pickRange = async () => {
    const picked = await openBottomSheet<Range>(
      { title: "달력 다운로드", description: "범위를 고른다." },
      (choose) => (
        <>
          <Button fullWidth onClick={() => choose("이번 달")}>
            이번 달
          </Button>
          <Button fullWidth variant="outline" onClick={() => choose("12개월 전체")}>
            12개월 전체
          </Button>
        </>
      )
    )
    if (picked) setRange(picked)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" onClick={openInfo}>
        음식 상세 열기 (overlay.open)
      </Button>
      <Button onClick={pickRange}>범위 고르기 (overlay.openAsync)</Button>
      <p className="text-sm" data-testid="range">
        선택한 범위: <b>{range}</b>
      </p>
    </div>
  )
}
