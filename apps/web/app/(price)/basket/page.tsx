import { BasketView } from "@/features/price/basket/basket-view"
import { getPriceSource } from "@/features/price/data/price-source"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "담은 품종",
  description: "담아 둔 품종의 오늘 판정을 한 번에 봐요.",
  path: routes.price.basket,
  noIndex: true,
})

// P4 담은 품종. 담은 목록은 기기에 있고, 판정은 데이터 입구의 목록에서 붙인다.
export default async function Page() {
  const varieties = await getPriceSource().listVarieties()
  return <BasketView varieties={varieties} />
}
