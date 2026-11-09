import Link from "next/link"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { findFood } from "@workspace/seasonal/data/foods"
import {
  findPairingByName,
  pairingDisplayName,
  pairingMentions,
  type PairingRow,
  type PairingSign,
} from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { IngredientArt } from "./ingredient-art"
import { PairingItems } from "./pairing-items"
import { PairingSource } from "./pairing-source"

const SIGN_LABEL: Record<PairingSign, string> = {
  O: "잘 맞는 재료(O)",
  X: "주의할 재료(X)",
}

/** 목록 가운데 표가 있는 기준 재료. 그 재료 페이지로 가는 링크를 단다. */
function basesIn(names: readonly string[], self: PairingRow): PairingRow[] {
  const rows = names
    .map(findPairingByName)
    .filter((row): row is PairingRow => !!row && row.id !== self.id)
  return [...new Map(rows.map((row) => [row.id, row])).values()]
}

function BaseLinks({ rows, label }: { rows: readonly PairingRow[]; label: string }) {
  if (rows.length === 0) return null
  return (
    <nav aria-label={label} className="pairing-base-links">
      <span>{label}</span>
      {rows.map((row) => (
        <Link key={row.id} href={routes.babyFood.ingredient(row.id)}>
          {pairingDisplayName(row)} 궁합 →
        </Link>
      ))}
    </nav>
  )
}

/** 재료별 궁합 페이지(baby-food-ingredient-pages/02). O·X와 역참조는 원본 표에서 만든다. */
export function IngredientDetail({ row }: { row: PairingRow }) {
  const name = pairingDisplayName(row)
  const mentions = pairingMentions(row.name)
  const copy = INFANT_PAIRING_COPY.ingredients[row.id]
  const food = findFood(row.id)
  const lists = [
    ["O", row.good],
    ["X", row.bad],
  ] as const

  return (
    <div className="pairing-page">
      <SubHeader title={`${name} 이유식 궁합`} fallbackHref={routes.babyFood.pairings} revealAfter="pairing-ingredient-title" />
      <div className="pairing-ingredient-head">
        <IngredientArt name={row.name} />
        <h1 id="pairing-ingredient-title">{name} 이유식 궁합</h1>
      </div>
      <p className="pairing-lead">
        {INFANT_PAIRING_COPY.ingredientLead(pairingDisplayName(row, { alias: true }), row.good.length, row.bad.length)}
      </p>

      {copy && (
        <section className="pairing-ingredient-section">
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
          <p className="text-sm text-caption">검토일 {copy.reviewedOn.replaceAll("-", ".")}</p>
        </section>
      )}

      {lists.map(([sign, names]) =>
        names.length === 0 ? null : (
          <section key={sign} className="pairing-ingredient-section" data-sign={sign}>
            <h2>
              {SIGN_LABEL[sign]} {names.length}가지
            </h2>
            <PairingItems base={row.name} sign={sign} names={names} />
            <BaseLinks rows={basesIn(names, row)} label="표가 있는 재료" />
          </section>
        )
      )}

      {mentions.length > 0 && (
        <section className="pairing-ingredient-section">
          <h2>다른 재료 표에서 {name}</h2>
          <p className="pairing-note">{INFANT_PAIRING_COPY.mentionsNote(name)}</p>
          <ul className="pairing-mentions">
            {mentions.map(({ base, sign }) => {
              const baseRow = findPairingByName(base.split("/")[0]!)
              return (
                <li key={`${base}-${sign}`}>
                  {baseRow ? (
                    <Link href={routes.babyFood.ingredient(baseRow.id)}>{pairingDisplayName(baseRow)} 표</Link>
                  ) : (
                    `${base} 표`
                  )}
                  {INFANT_PAIRING_COPY.mentionTail(name)}{" "}
                  <strong data-sign={sign}>{sign === "O" ? "O(잘 맞는 재료)" : "X(주의할 재료)"}</strong>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <PairingSource />

      <nav aria-label="이어보기" className="pairing-controls pairing-next">
        <Link className="pairing-pill" href={routes.babyFood.pairings}>
          전체 궁합표
        </Link>
        <Link className="pairing-pill pairing-primary" href={routes.babyFood.withSelection(routes.babyFood.root, [row.name])}>
          내 재료 골라보기 →
        </Link>
        {food && (
          <Link className="pairing-pill" href={routes.seasonal.food(food.id)}>
            {food.name} 제철 정보
          </Link>
        )}
      </nav>
    </div>
  )
}
