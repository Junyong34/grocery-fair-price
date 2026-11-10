import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { findFood } from "@workspace/seasonal/data/foods"
import {
  findPairingByName,
  isMilkDuplicateConflict,
  pairingDisplayName,
  pairingMentions,
  type PairingRow,
  type PairingSign,
} from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"
import { ShareButton } from "@/shared/share-button"
import { SubHeader } from "@/shared/shell/sub-header"

import { IngredientArt } from "./ingredient-art"
import { PairingItems } from "./pairing-items"
import { PairingSource } from "./pairing-source"

const SIGN_TITLE: Record<PairingSign, string> = {
  O: "함께 먹이기 좋은 재료",
  X: "함께 주기 전에 확인할 재료",
}

/** 다른 기준 재료의 표에 이 재료가 적힌 곳. O·X별로 묶어 그 재료 페이지로 잇는다. */
function Mentions({ row, name }: { row: PairingRow; name: string }) {
  const mentions = pairingMentions(row.name)
  if (mentions.length === 0) return null
  const groups = (["O", "X"] as const)
    .map((sign) => ({
      sign,
      bases: mentions
        .filter((mention) => mention.sign === sign)
        .map(({ base }) => ({ base, row: findPairingByName(base.split("/")[0]!) })),
    }))
    .filter((group) => group.bases.length > 0)

  return (
    <section className="pairing-ingredient-section" aria-labelledby="pairing-mentions-title">
      <h2 id="pairing-mentions-title">다른 재료 궁합표에도 있어요</h2>
      <p className="pairing-note">{INFANT_PAIRING_COPY.mentionsNote(name)}</p>
      <dl className="pairing-mentions">
        {groups.map(({ sign, bases }) => (
          <div key={sign} data-sign={sign}>
            <dt>{sign === "O" ? "O로 적힌 표" : "X로 적힌 표"}</dt>
            <dd>
              {bases.map(({ base, row: baseRow }) =>
                baseRow ? (
                  <Link key={base} href={routes.babyFood.ingredient(baseRow.id)} className="pairing-mention-link">
                    <IngredientArt name={baseRow.name} />
                    {pairingDisplayName(baseRow)}
                  </Link>
                ) : (
                  <span key={base} className="pairing-mention-link">
                    {base}
                  </span>
                )
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** 재료별 궁합 페이지(baby-food-ingredient-pages/02). O·X와 역참조는 원본 표에서 만든다. */
export function IngredientDetail({ row }: { row: PairingRow }) {
  const name = pairingDisplayName(row)
  const copy = INFANT_PAIRING_COPY.ingredients[row.id]
  const food = findFood(row.id)
  const lists = [
    ["O", row.good],
    ["X", row.bad],
  ] as const
  // 우유와 고구마·시금치처럼 원본에 O·X가 겹친 재료만 그 해석을 보인다.
  const hasConflict = [...row.good, ...row.bad].some((item) => isMilkDuplicateConflict(row.name, item))

  return (
    <div className="pairing-page">
      <SubHeader
        title={`${name} 이유식 궁합`}
        fallbackHref={routes.babyFood.pairings}
        revealAfter="pairing-ingredient-title"
        actions={<ShareButton />}
      />
      <header className="pairing-ingredient-head">
        <IngredientArt name={row.name} />
        <div>
          <h1 id="pairing-ingredient-title">{name} 이유식 궁합</h1>
          <p className="pairing-ingredient-counts">
            <span data-sign="O">O {row.good.length}</span>
            {row.bad.length > 0 && <span data-sign="X">X {row.bad.length}</span>}
          </p>
        </div>
      </header>
      <p className="pairing-lead">
        {INFANT_PAIRING_COPY.ingredientLead(pairingDisplayName(row, { alias: true }), row.good.length, row.bad.length)}
      </p>

      {copy && (
        <section className="pairing-ingredient-copy">
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="grid gap-1 text-sm">
            {copy.sources.map(({ title, href }) => (
              <li key={href}>
                <a href={href} className="underline underline-offset-4">
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="pairing-sign-panels">
        {lists.map(([sign, names]) =>
          names.length === 0 ? null : (
            <section
              key={sign}
              className="pairing-sign-panel"
              data-sign={sign}
              aria-labelledby={`pairing-sign-${sign}`}
            >
              <h2 id={`pairing-sign-${sign}`}>
                <span className="pairing-sign-mark" aria-hidden>
                  {sign}
                </span>
                {SIGN_TITLE[sign]}
                <span className="pairing-sign-count">{names.length}가지</span>
              </h2>
              <PairingItems base={row.name} sign={sign} names={names} variant="tiles" />
            </section>
          )
        )}
      </div>

      <Mentions row={row} name={name} />

      <nav aria-label="이어보기" className="pairing-next">
        <Link
          className="pairing-pill pairing-primary pairing-next-cta"
          href={routes.babyFood.withSelection(routes.babyFood.root, [row.name])}
        >
          {INFANT_PAIRING_COPY.pickWith(name)}
        </Link>
        <div className="pairing-next-links">
          <Link href={routes.babyFood.pairings}>전체 궁합표</Link>
          {food && <Link href={routes.seasonal.food(food.id)}>{food.name} 제철 정보</Link>}
        </div>
      </nav>

      <PairingSource conflict={hasConflict} />
    </div>
  )
}
