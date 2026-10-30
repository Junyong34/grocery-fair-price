"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { Segmented } from "@workspace/ui/components/segmented"
import { Switch } from "@workspace/ui/components/switch"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { formatMonthLabel, MONTH_LABEL_STYLES } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { setSettings, useSettings } from "../stores/settings-store"
import { CalendarStylePicker } from "./calendar-style-picker"

/** ⚙ 표시 설정 내용(명세 4절. 24절기 표시는 MVP 밖). 맨 아래에 PDF 내려받기 화면과 개인정보 처리방침으로 가는 링크가 있다. */
export function SettingsFields({ onNavigate }: { onNavigate?: () => void }) {
  const { showHolidays, showEaten, calendarStyle, monthLabel } = useSettings((state) => state)
  return (
    <div className="flex flex-col divide-y divide-hairline">
      <CalendarStylePicker
        value={calendarStyle}
        onChange={(value) => setSettings({ calendarStyle: value })}
      />
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="flex flex-col">
          <span className="text-[15px] text-ink">달 이름</span>
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
      <Link href={routes.seasonal.downloads} onClick={onNavigate} className="flex items-center justify-between gap-4 py-3 text-[15px] text-ink">
        {DOWNLOADS_COPY.settingsLink}
        <ChevronRight aria-hidden size={18} strokeWidth={1.6} className="text-stone" />
      </Link>
      <Link href={routes.privacy} onClick={onNavigate} className="py-3 text-[13px] text-stone">
        개인정보 처리방침
      </Link>
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
