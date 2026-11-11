import { monthSectionId } from "./active-month"

/**
 * 2a 달 섹션의 틀. 서버가 내용을 그린 달과 브라우저가 늦게 그리는 달(LazyMonth)이 같은 틀을 쓴다.
 * 비어 있는 동안(늦게 그릴 달)은 대개의 섹션 높이(375 · 1280에서 923~1226px, 대개 1030px)만큼 자리를 잡는다.
 * 화면 밖 달은 스타일 · 레이아웃 · 페인트를 건너뛴다(content-visibility). 예상 높이는 위아래 padding을 뺀 콘텐츠 높이이고,
 * auto라서 한 번 그려진 뒤에는 실제 높이를 기억한다. 판의 그림은 판 안에서만 움직여 섹션 밖으로 넘치지 않는다.
 */
export function MonthShell({ month, ref, children }: { month: number; ref?: React.Ref<HTMLElement>; children?: React.ReactNode }) {
  return (
    <section
      ref={ref}
      id={monthSectionId(month)}
      data-month={month}
      aria-label={`${month}월`}
      className="scroll-mt-16 border-t border-hairline [content-visibility:auto] [contain-intrinsic-block-size:auto_955px] pr-12 pl-[18px] pt-12 pb-7 empty:min-h-[1030px] lg:scroll-mt-32 lg:px-0 lg:pt-8"
    >
      {children}
    </section>
  )
}
