import type { ProductSummary } from "@workspace/price/types"

const compact = (text: string) => text.replace(/\s+/g, "").toLowerCase()

/**
 * 상품 이름 아래 작은 줄: "품목 · 용량". 이름에 이미 용량이 들어 있으면("서울우유 흰우유(1L)") 되풀이하지 않고,
 * 품목 제목 아래(hideItem, 카테고리 둘러보기)에서는 품목을 뺀다. 남는 것이 없으면 빈 문자열.
 */
export function productSub(
  product: Pick<ProductSummary, "name" | "item" | "size">,
  hideItem = false
): string {
  const size =
    product.size && !compact(product.name).includes(compact(product.size))
      ? product.size
      : null
  return [hideItem ? null : product.item, size].filter(Boolean).join(" · ")
}
