"use client"

import { Settings } from "lucide-react"
import { overlay } from "overlay-kit"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Switch } from "@workspace/ui/components/switch"

import { useSettingsStore } from "../stores/settings-store"

/** ⚙ 표시 설정 내용(명세 4절. 24절기 표시와 달력 다운로드는 MVP 밖). */
function SettingsFields() {
  const { showHolidays, showEaten, set } = useSettingsStore()
  return (
    <div className="flex flex-col divide-y divide-hairline">
      <SettingRow
        label="공휴일 표시"
        hint="달력의 공휴일 점·이름과 빨간 날짜"
        checked={showHolidays}
        onChange={(value) => set({ showHolidays: value })}
      />
      <SettingRow
        label="먹은 음식 표시"
        hint="제철 그림의 ✓"
        checked={showEaten}
        onChange={(value) => set({ showEaten: value })}
      />
    </div>
  )
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="flex flex-col">
        <span className="text-[15px] text-ink">{label}</span>
        <span className="text-xs text-stone">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
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
        <SettingsFields />
      </BottomSheet>
    ))
  return (
    <Button variant="ghost" size="sm" aria-label="설정" onClick={open} className="size-10 px-0">
      <Settings aria-hidden size={20} strokeWidth={1.6} />
    </Button>
  )
}

/** 데스크톱 상단 바의 ⚙. 헤더에서 내려오는 패널로 연다. */
export function DesktopSettingsButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="설정" className="size-10 px-0">
          <Settings aria-hidden size={20} strokeWidth={1.6} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] bg-canvas">
        <p className="pb-1 font-semibold text-ink">표시</p>
        <SettingsFields />
      </PopoverContent>
    </Popover>
  )
}
