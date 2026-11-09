import { Suspense } from "react"

import { PairingResult } from "@/features/baby-food/pairing-result"
import { readPairingSelection } from "@/features/baby-food/selection"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "고른 재료의 궁합표",
  path: routes.babyFood.result,
  noIndex: true,
})

export default function Page({ searchParams }: PageProps<"/baby-food/result">) {
  return (
    <Suspense>
      <Result searchParams={searchParams} />
    </Suspense>
  )
}

async function Result({
  searchParams,
}: Pick<PageProps<"/baby-food/result">, "searchParams">) {
  const selection = await readPairingSelection(searchParams)
  return <PairingResult {...selection} />
}
