import { connection } from "next/server"
import { Suspense } from "react"

import { ProductBoard } from "@/features/admin-catalog/products/product-board"
import { getProductCatalog } from "@/features/admin-catalog/server/products"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">상품 목록</h1>
        <p className="max-w-[70ch] text-base text-pretty text-stone">
          참가격 상품이 어느 카테고리 · 품목에 들어가 상품 화면(/products)에 어떻게 나오는지 봐요. 운영 DB를 읽기 전용으로 읽어요. 품목이 틀리면 상품의 품목
          제안으로 고쳐요.
        </p>
      </header>
      <Suspense fallback={<p className="text-stone">불러오는 중…</p>}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  await connection()
  return <ProductBoard {...await getProductCatalog()} />
}
