import type { LucideIcon } from "lucide-react"

/**
 * 404 · 오류 화면이 같이 쓰는 본문: 아이콘, 제목, 설명, 다음 행동. 셸(헤더 · 하단 내비)은 부르는 쪽이 정한다.
 * 버튼 모양은 담은 품종 빈 화면(EmptyBasket)과 맞춘다.
 */
export function StatusView({
  Icon,
  title,
  body,
  children,
}: {
  Icon: LucideIcon
  title: string
  body: string
  /** 다음 행동. 첫 번째가 주 행동이다(statusAction.primary). */
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 pt-20 pb-12 text-center">
      <span aria-hidden className="grid size-16 place-items-center rounded-full bg-gold-wash text-gold-deep">
        <Icon size={26} />
      </span>
      <h1 className="mt-1 font-heading text-2xl text-ink">{title}</h1>
      <p className="text-sm text-caption">{body}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>
    </div>
  )
}

const ACTION_BASE =
  "inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-[background-color,scale] motion-safe:duration-300 active:scale-[.98]"

/** StatusView 안 행동의 클래스. 링크(Link)와 버튼(button)에 같이 쓴다. */
export const statusAction = {
  primary: `${ACTION_BASE} bg-ink text-canvas hover:bg-stone`,
  secondary: `${ACTION_BASE} border border-silver bg-surface text-ink hover:bg-canvas`,
}
