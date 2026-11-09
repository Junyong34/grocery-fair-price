import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { CatalogFilter } from "./catalog-filter"
import { PairingSource } from "./pairing-source"

export function PairingCatalog() {
  return (
    <div className="pairing-page">
      <SubHeader title="이유식 재료 궁합표" fallbackHref={routes.seasonal.root} revealAfter="pairing-catalog-title" />
      <div className="pairing-intro">
        <h1 id="pairing-catalog-title">이유식 재료 궁합표</h1>
        <Link
          className="pairing-pill pairing-primary"
          href={routes.babyFood.root}
        >
          내 재료 골라보기 →
        </Link>
      </div>
      <p className="pairing-lead">
        {INFANT_PAIRING_COPY.catalog(PAIRINGS.length)}
        {" "}O는 원본의 잘 맞는 목록, X는 원본의 주의 목록이에요.
      </p>
      <CatalogFilter rows={PAIRINGS} />
      <PairingSource />
    </div>
  )
}
