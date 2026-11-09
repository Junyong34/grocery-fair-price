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
        data={breadcrumb([{ name: seo.title, path: routes.babyFood.pairings }])}
      />
      <PairingCatalog />
    </>
  )
}
