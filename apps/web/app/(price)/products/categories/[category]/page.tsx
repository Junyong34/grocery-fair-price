import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { productCategories } from "@workspace/price/list"

import { getPriceSource } from "@/features/price/data/price-source"
import { CategoryView } from "@/features/price/product-catalog/category-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { productCategorySeo, productsSeo } from "@/shared/seo/titles"

type Params = PageProps<"/products/categories/[category]">["params"]

/** 상품이 있는 카테고리 목록. 두 읽기 모두 캐시라 generateStaticParams · 메타데이터 · 본문이 DB를 다시 읽지 않는다. */
async function listProductCategories() {
  const source = getPriceSource()
  const [categories, products] = await Promise.all([source.listCategories(), source.listProducts()])
  return { products, categories: productCategories(categories, products) }
}

// 상품이 있는 카테고리를 모두 빌드 때 그린다. 목록에 없는 slug는 notFound()로 막는다.
export async function generateStaticParams() {
  const { categories } = await listProductCategories()
  return categories.map(({ slug }) => ({ category: slug }))
}

export async function generateMetadata(props: PageProps<"/products/categories/[category]">): Promise<Metadata> {
  const slug = (await props.params).category
  const category = (await listProductCategories()).categories.find((c) => c.slug === slug)
  if (!category) return {}
  return createMetadata({
    ...productCategorySeo(category),
    path: routes.price.productCategory(category.slug),
    ogImage: { title: `${category.name} 가격 비교`, subtitle: `상품 ${category.count}개 전국 판매가`, badge: "가격" },
  })
}

// 상품 카테고리 페이지. 본문은 정적이다.
export default function Page(props: PageProps<"/products/categories/[category]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Category params={props.params} />
    </Suspense>
  )
}

async function Category({ params }: { params: Params }) {
  const slug = (await params).category
  const [{ products, categories }, varieties] = await Promise.all([listProductCategories(), getPriceSource().listVarieties()])
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: productsSeo().title, path: routes.price.products },
          { name: productCategorySeo(category).title, path: routes.price.productCategory(category.slug) },
        ])}
      />
      <CategoryView
        category={category}
        products={products.filter((product) => product.category === category.name)}
        varieties={varieties.filter((variety) => variety.category === category.name)}
        others={categories.filter((c) => c.slug !== category.slug)}
      />
    </>
  )
}
