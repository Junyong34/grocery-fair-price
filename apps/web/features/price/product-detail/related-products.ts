import type { ProductSummary } from "@workspace/price/types"

/**
 * 같은 품목의 다른 상품(상품 상세 아래 "다른 ○○ 판매가").
 * 기준 단위가 같은 상품을 단위당 가격 싼 순으로 앞에 두어 바로 견주게 하고, 나머지는 판매가 싼 순으로 잇는다.
 * 조사 중단된 상품은 맨 뒤로 보낸다. total은 자르기 전 수("모두 보기" 링크에 쓴다).
 */
export function relatedProducts(
  products: readonly ProductSummary[],
  current: Pick<ProductSummary, "id" | "item" | "perUnit">,
  count: number
): { items: ProductSummary[]; total: number } {
  const unit = current.perUnit?.unit
  const rank = (product: ProductSummary) => {
    if (product.status === "discontinued") return 2
    return unit && product.perUnit?.unit === unit ? 0 : 1
  }
  const value = (product: ProductSummary) =>
    rank(product) === 0 ? product.perUnit!.price : product.price
  const same = products
    .filter(
      (product) => product.item === current.item && product.id !== current.id
    )
    .sort((a, b) => rank(a) - rank(b) || value(a) - value(b))
  return { items: same.slice(0, count), total: same.length }
}
