import { FestivalChips } from "@/features/seasonal/festivals/festival-chips"

// 1g 레이아웃. 명절 칩은 명절을 바꿔도 남아 있어(가로 스크롤 위치 유지) 페이지 밖에 둔다.
export default function FestivalsLayout({
  children,
}: LayoutProps<"/seasonal/festivals">) {
  return (
    <>
      <FestivalChips />
      {children}
    </>
  )
}
