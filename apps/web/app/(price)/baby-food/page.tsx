import { Suspense } from "react"

import { IngredientPicker } from "@/features/baby-food/ingredient-picker"
import { readPairingSelection } from "@/features/baby-food/selection"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "이유식 재료 선택",
  path: routes.babyFood.root,
  noIndex: true,
})

export default function Page({ searchParams }: PageProps<"/baby-food">) {
  return (
    <Suspense>
      <Picker searchParams={searchParams} />
    </Suspense>
  )
}

async function Picker({
  searchParams,
}: Pick<PageProps<"/baby-food">, "searchParams">) {
  const selection = await readPairingSelection(searchParams)
  return <IngredientPicker key={JSON.stringify(selection)} {...selection} />
}
