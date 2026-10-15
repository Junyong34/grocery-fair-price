"use client"

import { Switch } from "@workspace/ui/components/switch"

import { useSettingsStore } from "../stores/settings-store"
import { CalendarStylePicker } from "./calendar-style-picker"

/** ⚙ 표시 설정 내용(명세 4절. 24절기 표시와 달력 다운로드는 MVP 밖). */
export function SettingsFields() {
  const { showHolidays, showEaten, calendarStyle, set } = useSettingsStore()
  return (
    <div className="flex flex-col divide-y divide-hairline">
      <CalendarStylePicker
        value={calendarStyle}
        onChange={(value) => set({ calendarStyle: value })}
      />
      <SettingRow
        label="공휴일 표시"
        hint="달력의 공휴일 이름과 빨간 날짜(토·일은 늘 빨강)"
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
      {/* cojeev 스위치는 64×44로 커서 줄여 쓴다. */}
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="-my-2 -mr-2.5 origin-right scale-[.68]"
      />
    </label>
  )
}
