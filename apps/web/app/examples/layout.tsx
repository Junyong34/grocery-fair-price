import type { Metadata } from "next"

// 디자인 비교 페이지는 검색에 나오지 않게 한다. /examples를 지울 때 이 파일과 shared/seo/pages.ts의 "/examples"도 함께 지운다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return children
}
