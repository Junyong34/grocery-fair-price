import { Suspense } from "react"

import { FruitsDashboard } from "@/features/baby-food/fruits/fruits-dashboard"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodFruitsSeo } from "@/shared/seo/titles"
import { getSeoulToday } from "@/shared/today"

const seo = babyFoodFruitsSeo()
export const metadata = createMetadata({
  ...seo,
  path: routes.babyFood.fruits,
})

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "제철달력", path: routes.seasonal.root },
          { name: "월령별 과일 도감", path: routes.babyFood.fruits },
        ])}
      />
      <Suspense fallback={<div className="min-h-svh" aria-busy />}>
        <FruitsContent />
      </Suspense>
    </>
  )
}

async function FruitsContent() {
  const today = await getSeoulToday()
  return <FruitsDashboard currentMonth={today.month} />
}
