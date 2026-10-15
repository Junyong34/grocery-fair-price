"use client"

import { Settings } from "lucide-react"
import { overlay } from "overlay-kit"
import { lazy, Suspense } from "react"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

// 설정 내용(달력 모양 미리보기, 스위치, 공휴일 데이터)은 ⚙를 처음 열 때 불러온다. 버튼에 포인터나 초점이 오면 미리 받아 둔다.
const loadFields = () => import("./settings-fields")
const LazySettingsFields = lazy(() =>
  loadFields().then(({ SettingsFields }) => ({ default: SettingsFields }))
)

/** 손가락은 hover가 없어 누르는 순간(pointerdown)에 받기 시작한다. */
const preload = {
  onPointerEnter: () => void loadFields(),
  onPointerDown: () => void loadFields(),
  onFocus: () => void loadFields(),
}

/** 모바일 헤더의 ⚙. 하단 시트로 연다. */
export function MobileSettingsButton() {
  const open = () =>
    overlay.open(({ isOpen, close, unmount }) => (
      <BottomSheet
        open={isOpen}
        onClose={close}
        onExited={unmount}
        title="설정"
        footer={
          <Button variant="outline" fullWidth onClick={close}>
            닫기
          </Button>
        }
      >
        <Suspense>
          <LazySettingsFields />
        </Suspense>
      </BottomSheet>
    ))
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="설정"
      onClick={open}
      {...preload}
      className="size-10 px-0"
    >
      <Settings aria-hidden size={20} strokeWidth={1.6} />
    </Button>
  )
}

/** 데스크톱 상단 바의 ⚙. 헤더에서 내려오는 패널로 연다. */
export function DesktopSettingsButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="설정"
          {...preload}
          className="size-10 px-0"
        >
          <Settings aria-hidden size={20} strokeWidth={1.6} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] bg-canvas">
        <p className="font-semibold text-ink">표시</p>
        <Suspense>
          <LazySettingsFields />
        </Suspense>
      </PopoverContent>
    </Popover>
  )
}
