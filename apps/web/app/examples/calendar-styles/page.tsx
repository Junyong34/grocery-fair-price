import { CALENDAR_VARIANTS, MonthCalendar, type CalendarVariant } from "@/features/seasonal/components/month-calendar"

export const metadata = { title: "달력 모양 비교" }

const LABELS: Record<CalendarVariant, { name: string; note: string }> = {
  plain: { name: "A. plain — 지금 모양", note: "선 없이 작은 숫자. 공휴일은 모바일 점, 데스크톱 이름." },
  grid: { name: "B. grid — 격자", note: "칸마다 가는 선, 숫자는 왼쪽 위, 공휴일 이름을 칸 안에. 탁상 달력 느낌." },
  editorial: {
    name: "C. editorial — 큰 숫자",
    note: "큰 가는 숫자와 주 사이 가로줄만. 요일 머리에 굵은 먹선, 오늘은 먹색 원. 스위스 인쇄 달력 참고.",
  },
  tiles: { name: "D. tiles — 타일", note: "날마다 둥근 타일. 빨간 날은 옅은 빨강 타일, 오늘은 먹색 타일." },
}

// 2a 달력 모양 후보 비교. 추석(9월)과 개천절·한글날(10월)이 있는 2026년 가을, 오늘은 10월 15일로 고정했다.
const TODAY = { year: 2026, month: 10, day: 15 }

export default function Page() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">달력 모양 비교</h1>
        <p className="text-sm text-stone">
          토·일·공휴일은 모두 빨간 숫자(holiday 토큰)다. 왼쪽은 모바일 폭(339px), 오른쪽은 데스크톱 폭이다.
        </p>
      </div>
      {CALENDAR_VARIANTS.map((variant) => (
        <section key={variant} className="flex flex-col gap-3 border-t border-hairline pt-6">
          <div>
            <h2 className="font-semibold">{LABELS[variant].name}</h2>
            <p className="text-sm text-stone">{LABELS[variant].note}</p>
          </div>
          <div className="flex flex-wrap items-start gap-8">
            {/* lg: 클래스는 화면 폭 기준이라, 모바일 칸은 좁은 폭에서 볼 때만 모바일 모양이 된다. */}
            <div className="w-[339px] shrink-0">
              <p className="mb-2 font-number text-5xl">9</p>
              <MonthCalendar year={2026} month={9} today={TODAY} variant={variant} />
            </div>
            <div className="min-w-[339px] flex-1">
              <p className="mb-2 font-number text-5xl">10</p>
              <MonthCalendar year={2026} month={10} today={TODAY} variant={variant} />
            </div>
          </div>
        </section>
      ))}
    </main>
  )
}
