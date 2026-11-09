import { PRICE_COPY } from "@workspace/price/copy"

/**
 * 검색 결과 묶음(식재료 시세 · 상품 판매가)의 공통 머리: 제목 · 개수 · 묶음 설명 한 줄 · 오른쪽 행동.
 * 두 묶음이 같은 모양이어야 "무엇이 다른 묶음인가"가 제목과 설명으로만 갈린다.
 * focusTarget이면 제목이 포커스를 받는다(위 묶음의 "상품 판매가 ↓" 버튼이 여기로 옮긴다).
 */
export function ResultSection({
  headingId,
  title,
  count,
  description,
  action,
  focusTarget = false,
  children,
}: {
  headingId: string
  title: string
  count: number
  description?: React.ReactNode
  action?: React.ReactNode
  focusTarget?: boolean
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2
            id={headingId}
            tabIndex={focusTarget ? -1 : undefined}
            className="flex scroll-mt-20 flex-wrap items-baseline gap-x-2 font-heading text-xl leading-snug font-bold text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring lg:scroll-mt-24"
          >
            {title}
            <span className="font-sans text-sm font-semibold text-stone tabular-nums">
              {PRICE_COPY.search.productsCount(count)}
            </span>
          </h2>
          {action}
        </div>
        {description && (
          <p className="text-[13px] leading-relaxed text-pretty break-keep text-caption">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}
