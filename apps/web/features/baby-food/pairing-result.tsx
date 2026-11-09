import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"
import { Badge } from "@workspace/ui/components/badge"
import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { PairingGrid } from "./pairing-grid"

export function PairingResult({
  selected,
}: {
  selected: readonly string[]
}) {
  const pickerHref = routes.babyFood.withSelection(routes.babyFood.root, selected)
  const rows = PAIRINGS.filter(({ name }) => selected.includes(name))

  return (
    <div className="pairing-page">
      <SubHeader title="고른 재료의 궁합표" fallbackHref={pickerHref} revealAfter="pairing-result-title" />
      <div className="pairing-intro">
        <h1 id="pairing-result-title">고른 재료의 궁합표</h1>
        <Link className="pairing-pill" href={pickerHref}>
          재료 바꾸기
        </Link>
      </div>
      {rows.length > 0 ? (
        <>
          <p className="pairing-lead">
            함께 고른 재료는 목록 안에서 강조해 드려요.
          </p>
          <div className="pairing-controls mb-5">
            {selected.map((name) => (
              <Badge size="lg" className="bg-pair-muted text-pair-muted-foreground" key={name}>
                {name}
              </Badge>
            ))}
          </div>
        </>
      ) : (
        <p className="pairing-lead">
          고른 재료가 없어요. 재료를 고르거나 전체 궁합표를 펼쳐 보세요.
        </p>
      )}
      <Link
        className="pairing-pill pairing-primary mb-5"
        href={routes.babyFood.withSelection(routes.babyFood.pairings, selected)}
      >
        전체표 크게 보기 ↗
      </Link>
      <PairingGrid rows={rows} selected={selected} linkTitles />
      <section className="pairing-source">
        <h2 className="font-heading text-xl">표의 기준과 근거</h2>
        <p>{INFANT_PAIRING_COPY.source}</p>
        <p>{INFANT_PAIRING_COPY.limit}</p>
      </section>
    </div>
  )
}
