import Link from "next/link"

import type { PairingRow } from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"

import { IngredientArt } from "./ingredient-art"
import { PairingItems } from "./pairing-items"

export function PairingGrid({
  rows,
  selected = [],
  printable = false,
  linkTitles = false,
}: {
  rows: readonly PairingRow[]
  selected?: readonly string[]
  printable?: boolean
  /** 재료 제목을 재료별 궁합 페이지 링크로 만든다. 인쇄용·결과 모달에서는 끈다. */
  linkTitles?: boolean
}) {
  return (
    <div className="pairing-grid">
      {rows.map((row) => (
        <article
          key={row.name}
          className="pairing-entry"
          data-ingredient={row.name}
        >
          <h2 className="pairing-entry-title">
            {linkTitles && !printable ? (
              <Link
                href={routes.babyFood.ingredient(row.id)}
                className="pairing-entry-link"
              >
                <IngredientArt name={row.name} />
                {row.name}
              </Link>
            ) : (
              <>
                <IngredientArt name={row.name} />
                {row.name}
              </>
            )}
          </h2>
          <table aria-label={`${row.name} 궁합표`}>
            <thead>
              <tr>
                <th scope="col">
                  O <span className="sr-only">원본의 잘 맞는 목록</span>
                </th>
                <th scope="col">
                  X <span className="sr-only">원본의 주의 목록</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {(
                  [
                    ["O", row.good],
                    ["X", row.bad],
                  ] as const
                ).map(([sign, names]) => (
                  <td
                    key={sign}
                    className={sign === "X" ? "pairing-bad" : undefined}
                  >
                    <PairingItems
                      base={row.name}
                      sign={sign}
                      names={names}
                      selected={selected}
                      printable={printable}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </article>
      ))}
    </div>
  )
}
