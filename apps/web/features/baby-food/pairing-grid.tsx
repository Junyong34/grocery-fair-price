import Image from "next/image"

import { PAIRING_ART, type PairingRow } from "./data"
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
}: {
  rows: readonly PairingRow[]
  selected?: readonly string[]
}) {
  const chosen = new Set(selected)
  return (
    <div className="pairing-grid">
      {rows.map((row) => {
        // 우유의 두 X 표기는 원본 충돌이어서 별도 조사로 안내한다.
        const bad =
          row.name === "우유"
            ? row.bad.filter((name) => name !== "고구마" && name !== "시금치")
            : row.bad
        return (
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
                      ["X", bad],
                    ] as const
                  ).map(([sign, names]) => (
                    <td
                      key={sign}
                      className={sign === "X" ? "pairing-bad" : undefined}
                    >
                      {names.length === 0 && (
                        <span className="text-sm text-caption">기재 없음</span>
                      )}
                      <ul className="pairing-items">
                        {names.map((name) => (
                          <li key={name}>
                            <PairingEvidence
                              base={row.name}
                              name={name}
                              sign={sign}
                              selected={chosen.has(name)}
                            >
                              <IngredientArt name={name} />
                              <span>{name}</span>
                            </PairingEvidence>
                          </li>
                        ))}
                      </ul>
                      {row.name === "우유" && sign === "X" && (
                        <PairingEvidence base="우유" name="고구마" sign="X">
                          별도 조사 ↗
                        </PairingEvidence>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </article>
        )
      })}
    </div>
  )
}
