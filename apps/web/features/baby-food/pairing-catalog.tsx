import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

import { EditionCard } from "@/shared/downloads/downloads-card"
import { routes } from "@/shared/routes"
import { ShareButton } from "@/shared/share-button"
import { SubHeader } from "@/shared/shell/sub-header"

import { CatalogFilter } from "./catalog-filter"
import { PairingSource } from "./pairing-source"

export function PairingCatalog() {
  return (
    <div className="pairing-page">
      <SubHeader
        title="이유식 재료 궁합표"
        fallbackHref={routes.seasonal.root}
        revealAfter="pairing-catalog-title"
        actions={<ShareButton />}
      />
      <div className="pairing-intro">
        <h1 id="pairing-catalog-title">이유식 재료 궁합표</h1>
        <Link
          className="pairing-pill pairing-primary"
          href={routes.babyFood.root}
        >
          내 재료로 골라 보기
        </Link>
      </div>
      <p className="pairing-lead">
        {INFANT_PAIRING_COPY.catalog(PAIRINGS.length)}
      </p>
      <EditionCard kind="baby-food-pairings" placement="baby-food-pairings" className="mb-[22px] max-w-[420px]" />
      <CatalogFilter rows={PAIRINGS} />
      <PairingSource />
    </div>
  )
}
