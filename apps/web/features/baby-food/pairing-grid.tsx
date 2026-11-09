import type { PairingRow } from "@workspace/seasonal/data/infant-pairings"

import { IngredientArt } from "./ingredient-art"
import { PairingItems } from "./pairing-items"

export function PairingGrid({
  rows,
  selected = [],
  printable = false,
}: {
  rows: readonly PairingRow[]
  selected?: readonly string[]
  printable?: boolean
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
            <IngredientArt name={row.name} />
            {row.name}
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
