import Link from "next/link"

import type { ProductCategory } from "@workspace/price/list"

import { routes } from "@/shared/routes"

/**
 * 상품 카테고리 알약 목록. 시세 메인과 상품 카테고리 페이지 아래에서 다른 카테고리로 잇는다.
 * 알약은 "다른 ○○ 시세"와 같은 pair-light다(DESIGN.md). 검색 없이 링크만으로 모든 카테고리에 닿게 하는 길이라 숨기거나 접지 않는다.
 */
export function CategoryLinks({
  categories,
}: {
  categories: readonly Pick<ProductCategory, "slug" | "name">[]
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map(({ slug, name }) => (
        <li key={slug}>
          <Link
            href={routes.price.productCategory(slug)}
            className="inline-flex min-h-11 items-center rounded-full border border-hairline bg-pair-light px-3.5 text-sm text-pair-light-foreground no-underline hover:border-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
