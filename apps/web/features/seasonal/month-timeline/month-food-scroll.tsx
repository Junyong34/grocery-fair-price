"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 접힌 카드에 보이는 품종 수(열 × 줄). 넘으면 안쪽 스크롤과 펼치기 버튼이 생긴다.
 * 아래 --cols·--rows 클래스와 같은 값이어야 한다(모바일 2열 4줄, sm부터 3열 3줄).
 */
const VISIBLE = { mobile: 2 * 4, wide: 3 * 3 } as const

/**
 * 접힌 높이. 품종 칸 크기가 카드 폭을 따라 바뀌어 px로 못 박지 않고 컨테이너 폭(cqw)으로 계산한다.
 * 그래서 서버 렌더부터 높이가 맞고, 다음 줄 그림이 반쯤(--peek) 보여 아래에 더 있다는 걸 알린다.
 * 품종 칸 = (폭 - 오른쪽 스크롤 자리 - 열 사이) / 열, 그림 = 칸의 84%, 줄 = 그림 + 사이 + 이름 한 줄.
 */
const COLLAPSED_HEIGHT = cn(
  "[--cols:2] [--gi:4px] [--gx:6px] [--gy:8px] [--lh:16px] [--peek:0.45] [--rows:4]",
  "sm:[--cols:3] sm:[--gi:6px] sm:[--gx:8px] sm:[--gy:12px] sm:[--lh:20px] sm:[--rows:3]",
  "[--img:calc((100cqw-var(--bar)-(var(--cols)-1)*var(--gx))/var(--cols)*0.84)]",
  "[--h:calc(4px+var(--rows)*(var(--img)+var(--gi)+var(--lh)+var(--gy))+var(--peek)*var(--img))]"
)

/**
 * 열두 달 카드의 품종 목록. 품종이 많으면 정해진 높이에서 안쪽으로 스크롤하고, 펼치면 모두 보인다.
 * 부모 카드가 컨테이너(@container)여야 높이 계산이 맞는다. 목록 줄 간격은 위 변수와 같게 children(ul)이 맞춘다.
 */
export function MonthFoodScroll({
  month,
  count,
  children,
}: {
  month: number
  count: number
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const [moreBelow, setMoreBelow] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // 접을 때 버튼이 손가락(포인터) 아래 그대로 있도록, 접기 전 버튼 위치를 기억해 두고 줄어든 만큼 화면을 올린다.
  const anchorTop = useRef<number | null>(null)
  const viewportId = useId()

  const overflowsMobile = count > VISIBLE.mobile
  const overflowsWide = count > VISIBLE.wide

  // 아래에 가려진 품종이 있을 때만 끝을 흐리게 한다.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const measure = () =>
      setMoreBelow(
        viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 2
      )
    measure()
    viewport.addEventListener("scroll", measure, { passive: true })
    const resize = new ResizeObserver(measure)
    resize.observe(viewport)
    if (viewport.firstElementChild) resize.observe(viewport.firstElementChild)
    return () => {
      viewport.removeEventListener("scroll", measure)
      resize.disconnect()
    }
  }, [expanded])

  useLayoutEffect(() => {
    if (expanded || anchorTop.current === null || !buttonRef.current) return
    window.scrollBy({
      top: buttonRef.current.getBoundingClientRect().top - anchorTop.current,
      behavior: "instant",
    })
    anchorTop.current = null
  }, [expanded])

  const toggle = () => {
    const viewport = viewportRef.current
    if (expanded)
      anchorTop.current = buttonRef.current?.getBoundingClientRect().top ?? null
    // 펼치든 접든 목록은 맨 위부터 보이게 한다.
    if (viewport) viewport.scrollTop = 0
    setExpanded(!expanded)
  }

  return (
    <>
      <ScrollArea
        variant="plain"
        scrollbarSize={4}
        scrollbarColor="var(--color-silver)"
        className={cn(
          "mt-2 [--bar:10px] sm:mt-3",
          expanded ? "[--h:none]" : COLLAPSED_HEIGHT
        )}
        viewportProps={{
          id: viewportId,
          ref: viewportRef,
          "aria-label": `${month}월 제철 품종`,
        }}
        // cojeev 기본 여백 대신: 위는 품종이 살짝 떠오를 자리, 오른쪽은 스크롤 막대 자리. 페이지 스크롤로 이어지게 overscroll은 기본값.
        viewportClassName={cn(
          "overscroll-auto! pt-1! pr-(--bar)! pb-1! pl-0!",
          moreBelow &&
            !expanded &&
            "[mask-image:linear-gradient(to_bottom,black_calc(100%-48px),transparent)]"
        )}
      >
        {children}
      </ScrollArea>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        aria-controls={viewportId}
        onClick={toggle}
        className={cn(
          "mt-auto w-full! gap-1! text-[13px]! text-stone! hover:text-ink!",
          // 넘칠 때만 버튼을 둔다. 폭마다 보이는 품종 수가 달라 화면 폭별로 정한다(서버 렌더부터 맞게).
          !overflowsMobile && "max-sm:hidden!",
          !overflowsWide && "sm:hidden!"
        )}
      >
        {expanded ? "접기" : "펼치기"}
        {expanded ? (
          <ChevronUp aria-hidden size={16} />
        ) : (
          <ChevronDown aria-hidden size={16} />
        )}
      </Button>
    </>
  )
}
