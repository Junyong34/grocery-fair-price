import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { routes } from "@/shared/routes"

import { PAIRINGS } from "./data"
import { PairingGrid } from "./pairing-grid"

export function PairingResult({
  selected,
  age,
}: {
  selected: readonly string[]
  age: string
}) {
  const rows = PAIRINGS.filter(({ name }) => selected.includes(name))

  return (
    <div className="pairing-page">
      <div className="pairing-intro">
        <h1>고른 재료의 궁합표</h1>
        <Link
          className="pairing-pill"
          href={routes.babyFood.withSelection(
            routes.babyFood.root,
            selected,
            age
          )}
        >
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
              <span className="pairing-pill" key={name}>
                {name}
              </span>
            ))}
            {age && <span className="text-sm text-caption">월령 {age}</span>}
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
      <PairingGrid rows={rows} selected={selected} />
      <section className="pairing-source">
        <h2 className="font-heading text-xl">표의 기준과 근거</h2>
        <p>{INFANT_PAIRING_COPY.source}</p>
        <p>{INFANT_PAIRING_COPY.limit}</p>
      </section>
    </div>
  )
}
