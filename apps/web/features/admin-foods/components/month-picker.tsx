"use client"

// 품종 폼이 함께 쓰는 조각: 카테고리 목록, 달 고르기, 여러 줄 입력 나누기.
export const CATEGORIES = ["채소", "과일", "버섯", "곡물·견과", "수산"] as const
export const FIELD = "grid gap-1.5 text-sm"
/** 줄바꿈이나 쉼표로 나눈 값. 빈 줄은 뺀다. */
export const lines = (text: string) => text.split(/[\n,]/).map((line) => line.trim()).filter(Boolean)

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** 달 12개를 눌러 고른다. allowed를 주면 그 달만 고를 수 있다(대표 달은 제철 달 안에서). */
export function MonthPicker({ label, value, allowed, onChange }: { label: string; value: readonly number[]; allowed?: readonly number[]; onChange: (months: number[]) => void }) {
  return (
    <fieldset className={FIELD}>
      <legend className="mb-1.5 text-stone">{label}</legend>
      <div className="grid grid-cols-6 gap-1">
        {MONTHS.map((month) => {
          const on = value.includes(month)
          return (
            <button
              key={month}
              type="button"
              aria-pressed={on}
              disabled={allowed !== undefined && !allowed.includes(month)}
              onClick={() => onChange(on ? value.filter((m) => m !== month) : [...value, month].sort((x, y) => x - y))}
              className="h-9 rounded-lg bg-canvas text-sm tabular-nums shadow-[inset_0_0_0_1px_var(--color-hairline)] aria-pressed:bg-gold-wash aria-pressed:font-semibold disabled:opacity-30"
            >
              {month}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
