import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { CatalogFilter } from "./catalog-filter"
import { PAIRING_REFERENCES, PAIRINGS } from "./data"
import { PairingEvidence } from "./pairing-evidence"

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
      <section className="pairing-source">
        <h2 className="font-heading text-xl">자료와 해석</h2>
        <p>{INFANT_PAIRING_COPY.source}</p>
        <p>{INFANT_PAIRING_COPY.limit}</p>
        <p>{INFANT_PAIRING_COPY.conflict}</p>
        <div className="pairing-controls">
          <PairingEvidence base="우유" name="고구마" sign="O">
            우유 + 고구마 근거 ↗
          </PairingEvidence>
          <PairingEvidence base="우유" name="시금치" sign="O">
            우유 + 시금치 근거 ↗
          </PairingEvidence>
        </div>
        <ul className="grid gap-1 text-sm">
          {Object.values(PAIRING_REFERENCES).map(({ title, href }) => (
            <li key={href}>
              <a href={href} className="underline underline-offset-4">
                {title}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-caption">우유 조합 검토일 2026.11.07</p>
      </section>
    </div>
  )
}
