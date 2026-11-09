import { PairingCatalog } from "@/features/baby-food/pairing-catalog"
import { createMetadata } from "@/shared/meta"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodPairingsSeo } from "@/shared/seo/titles"
import { routes } from "@/shared/routes"

const seo = babyFoodPairingsSeo()
export const metadata = createMetadata({
  ...seo,
  path: routes.babyFood.pairings,
})

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "제철달력", path: routes.seasonal.root },
          { name: "이유식 재료 궁합표", path: routes.babyFood.pairings },
        ])}
      />
      <PairingCatalog />
    </>
  )
}
