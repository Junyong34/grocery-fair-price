import Image from "next/image"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import {
  isMilkDuplicateConflict,
  matchesSelectedIngredient,
  type PairingRow,
} from "@workspace/seasonal/data/infant-pairings"

import { PAIRING_ART } from "./data"
import { PairingEvidence } from "./pairing-evidence"

export function IngredientArt({ name }: { name: string }) {
  const paths =
    name === "브로콜리/콜리플라워"
      ? [PAIRING_ART["브로콜리"], PAIRING_ART["콜리플라워"]]
      : [PAIRING_ART[name]]
  return (
    <span className="pairing-art" aria-hidden="true">
      {paths.map((path, index) =>
        path ? (
          <Image
            key={path}
            src={path}
            alt=""
            width={64}
            height={64}
            unoptimized
          />
        ) : (
          <span key={index} className="pairing-placeholder" />
        )
      )}
    </span>
  )
}

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
                    <ul className="pairing-items">
                      {names.map((name) => {
                        const isConflict =
                          row.name === "우유" &&
                          sign === "X" &&
                          isMilkDuplicateConflict(row.name, name)
                        const ingredient = (
                          <>
                            <IngredientArt name={name} />
                            <span>
                              {name}
                              {isConflict && (
                                <small className="pairing-conflict-note">
                                  {" "}
                                  ({INFANT_PAIRING_COPY.conflictBadge})
                                </small>
                              )}
                            </span>
                          </>
                        )
                        return (
                          <li key={name}>
                            {printable ? (
                              <span className="pairing-item">
                                {ingredient}
                              </span>
                            ) : (
                              <PairingEvidence
                                base={row.name}
                                name={name}
                                sign={sign}
                                selected={matchesSelectedIngredient(
                                  name,
                                  selected
                                )}
                              >
                                {ingredient}
                              </PairingEvidence>
                            )}
                          </li>
                        )
                      })}
                    </ul>
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
