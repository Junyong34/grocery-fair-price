"use client"

import { Segmented } from "@workspace/ui/components/segmented"
import { Switch } from "@workspace/ui/components/switch"

import { formatMonthLabel, MONTH_LABEL_STYLES } from "@workspace/seasonal/data/months"

import { ClearRow } from "@/shared/settings/clear-row"
import { SettingWhere } from "@/shared/settings/setting-section"
import { clearEaten, useEatenHydrated, useEatenTotal } from "@/shared/eaten-store"

import { setSettings, useSettings } from "../stores/settings-store"
import { CalendarStylePicker } from "../this-month/calendar-style-picker"

/** 설정 화면 "화면 표시" 섹션의 제철달력 항목(.scratch/shell-unify/spec.md 5장. 24절기 표시는 MVP 밖). */
export function SeasonalDisplaySettings() {
  const { showHolidays, showEaten, calendarStyle, monthLabel } = useSettings((state) => state)
  return (
    <div className="flex flex-col divide-y divide-hairline">
      <CalendarStylePicker
        value={calendarStyle}
        onChange={(value) => setSettings({ calendarStyle: value })}
      />
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="flex flex-col">
          <span className="text-[15px] text-ink">
            달 이름
            <SettingWhere>제철달력</SettingWhere>
          </span>
          <span className="text-xs text-stone">달 제목과 달 이동 목록의 표기</span>
        </span>
        <Segmented
          aria-label="달 이름"
          options={MONTH_LABEL_OPTIONS}
          value={monthLabel}
          onValueChange={(value) => setSettings({ monthLabel: value })}
        />
      </div>
      <SettingRow
        label="공휴일 표시"
        hint="달력의 공휴일 이름과 빨간 날짜(토·일은 늘 빨강)"
        checked={showHolidays}
        onChange={(value) => setSettings({ showHolidays: value })}
      />
      <SettingRow
        label="먹은 음식 표시"
        hint="제철 그림의 ✓"
        checked={showEaten}
        onChange={(value) => setSettings({ showEaten: value })}
      />
    </div>
  )
}

/** 1월을 예로 세 표기를 보여 준다. */
const MONTH_LABEL_OPTIONS = MONTH_LABEL_STYLES.map((style) => ({
  value: style,
  label: formatMonthLabel(1, style),
}))

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
        <span className="text-[15px] text-ink">
          {label}
          <SettingWhere>제철달력</SettingWhere>
        </span>
        <span className="text-xs text-stone">{hint}</span>
      </span>
      {/* cojeev 스위치는 64×44로 커서 줄여 쓴다. */}
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="-my-2 origin-right scale-[.68]"
      />
    </label>
  )
}

/** 설정 화면 "내 기록" 섹션의 먹음 기록 지우기. */
export function EatenRecordSetting() {
  const total = useEatenTotal()
  const hydrated = useEatenHydrated()
  return <ClearRow label="먹음 기록" where="나의 식탁" count={hydrated ? total : null} onClear={clearEaten} />
}
