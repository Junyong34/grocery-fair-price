import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getPriceSource } from "@/features/price/data/price-source"
import { ProductView } from "@/features/price/product-detail/product-view"
import { relatedProducts } from "@/features/price/product-detail/related-products"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { productSeo } from "@/shared/seo/titles"

type Params = PageProps<"/products/[product]">["params"]

/** 상세 아래 "다른 ○○ 판매가"에 보이는 수 */
const RELATED_COUNT = 6

// 참가격 상품을 모두 빌드 때 그린다(상세 읽기가 캐시라 본문이 정적 셸에 들어간다). 목록에 없는 id는 요청 때 그리고 없으면 notFound().
export async function generateStaticParams() {
  const products = await getPriceSource().listProducts()
  return products.map(({ id }) => ({ product: id }))
}

export async function generateMetadata(props: PageProps<"/products/[product]">): Promise<Metadata> {
  const product = await getPriceSource().getProduct((await props.params).product)
  if (!product) return {}
  return createMetadata({
    ...productSeo(product),
    path: routes.price.product(product.id),
    ogImage: { title: product.name, subtitle: "판매처별 가격 비교", badge: "가격" },
  })
}

// 참가격 상품 상세 (catalog-scale/10). 본문은 정적이다.
export default function Page(props: PageProps<"/products/[product]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Product params={props.params} />
    </Suspense>
  )
}

async function Product({ params }: { params: Params }) {
  const source = getPriceSource()
  const id = (await params).product
  // 두 목록은 generateStaticParams · 검색과 같은 캐시 읽기라 상세마다 DB를 다시 읽지 않는다.
  const [product, products, varieties] = await Promise.all([source.getProduct(id), source.listProducts(), source.listVarieties()])
  if (!product) notFound()
  // 판정 목록에 없는 품종은 시세 화면이 404라 잇지 않는다.
  const variety = varieties.find((v) => v.id === product.varietyId) ?? null
  return (
    <>
      <JsonLd data={breadcrumb([{ name: productSeo(product).title, path: routes.price.product(product.id) }])} />
      <ProductView product={product} variety={variety} related={relatedProducts(products, product, RELATED_COUNT)} />
    </>
  )
}
