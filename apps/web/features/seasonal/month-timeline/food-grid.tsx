"use client"

import { Segmented } from "@workspace/ui/components/segmented"
import { cn } from "@workspace/ui/lib/utils"

import { DESKTOP_COLUMNS, MOBILE_COLUMNS, useMonthView } from "./view-store"

const MOBILE_GRID = {
  2: "grid-cols-2",
  4: "grid-cols-4",
  6: "grid-cols-6",
} as const
const DESKTOP_GRID = {
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
  8: "lg:grid-cols-8",
} as const

/** 보기 전환 세그먼트(명세 2.5). 모바일 2·4·6열, 데스크톱 4·6·8열. */
export function ViewSwitch() {
  const { mobile, desktop } = useMonthView()
  return (
    <>
      <Segment
        className="lg:hidden"
        values={MOBILE_COLUMNS}
        value={mobile}
        onChange={(value) =>
          useMonthView.setState({ mobile: value as typeof mobile })
        }
      />
      <Segment
        className="hidden lg:block"
        values={DESKTOP_COLUMNS}
        value={desktop}
        onChange={(value) =>
          useMonthView.setState({ desktop: value as typeof desktop })
        }
      />
    </>
  )
}

function Segment({
  values,
  value,
  onChange,
  className,
}: {
  values: readonly number[]
  value: number
  onChange: (value: number) => void
  className?: string
}) {
  // 보이기·숨기기는 바깥 div가 맡는다. cojeev 스타일이 루트의 display를 정하기 때문이다.
  return (
    <div className={className}>
      <Segmented
        aria-label="보기"
        options={values.map((columns) => ({ value: columns, label: `${columns}열` }))}
        value={value}
        onValueChange={onChange}
      />
    </div>
  )
}

/**
 * 품종 카드 그리드. 열 수에 따라 카드 모양이 바뀐다: 모바일 2열·데스크톱 4열은 상세 카드, 그 이상은 그림과 이름만.
 * 카드(서버 컴포넌트)는 data-mobile / data-desktop 값을 보고 CSS로만 모양을 바꾼다.
 */
export function FoodGrid({ children }: { children: React.ReactNode }) {
  const { mobile, desktop } = useMonthView()
  return (
    <ul
      data-mobile={mobile === 2 ? "detail" : "compact"}
      data-desktop={desktop === 4 ? "detail" : "compact"}
      className={cn(
        "group/grid grid gap-x-3 gap-y-5",
        MOBILE_GRID[mobile],
        DESKTOP_GRID[desktop]
      )}
    >
      {children}
    </ul>
  )
}
