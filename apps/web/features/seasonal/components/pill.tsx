import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

/**
 * 제철 화면의 고르기 알약. 보이는 높이는 36px이고, 누르는 영역은 위아래로 넓혀 44px다.
 * 가로 스크롤 줄 안에 두면 넓힌 영역이 잘리므로 줄에 위아래 여백(4px 이상)을 둔다.
 * 색 전환을 두지 않는다. 고른 칸을 바꿀 때 전과 새 칸이 동시에 반쯤 활성으로 보여 깜빡인다.
 */
const pillClass = (selected: boolean, className?: string) =>
  cn(
    "relative inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-3.5 text-sm whitespace-nowrap tabular-nums no-underline after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:outline-2 focus-visible:outline-gold",
    selected
      ? "border-gold bg-gold-soft font-semibold text-espresso"
      : "border-hairline bg-surface/70 text-stone hover:border-silver hover:text-ink",
    className
  )

/** 알약을 담는 고정 구간 줄(SectionRow)의 높이. 위는 탭 줄 여백이 있어 아래에만 숨 쉴 틈을 더 둔다. */
export const PILL_SECTION_ROW = "h-12 pb-1.5"

/** 다른 주소로 가는 알약. 지금 주소면 aria-current="page"다. */
export function PillLink({
  current,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "aria-current"> & {
  current: boolean
}) {
  return (
    <Link
      {...props}
      aria-current={current ? "page" : undefined}
      className={pillClass(current, className)}
    />
  )
}

/** 화면 안의 값을 고르는 알약. 고른 값이면 aria-pressed다. */
export function PillButton({
  selected,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "aria-pressed"> & {
  selected: boolean
}) {
  return (
    <button
      type="button"
      {...props}
      aria-pressed={selected}
      className={pillClass(selected, className)}
    />
  )
}
