import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import {
  isMilkDuplicateConflict,
  matchesSelectedIngredient,
} from "@workspace/seasonal/data/infant-pairings"

import { IngredientArt } from "./ingredient-art"
import { PairingEvidence } from "./pairing-evidence"

/** 한 기준 재료의 O나 X 목록. 칩을 누르면 근거 창이 열리고, 인쇄용은 글자만 둔다. */
export function PairingItems({
  base,
  sign,
  names,
  selected = [],
  printable = false,
  variant = "inline",
}: {
  base: string
  sign: "O" | "X"
  names: readonly string[]
  selected?: readonly string[]
  printable?: boolean
  /** tiles = 재료별 페이지의 그림 타일. inline = 궁합표 칸 안의 글자 목록 */
  variant?: "inline" | "tiles"
}) {
  return (
    <ul className={variant === "tiles" ? "pairing-tiles" : "pairing-items"}>
      {names.map((name) => {
        const isConflict =
          base === "우유" && sign === "X" && isMilkDuplicateConflict(base, name)
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
              <span className="pairing-item">{ingredient}</span>
            ) : (
              <PairingEvidence
                base={base}
                name={name}
                sign={sign}
                selected={matchesSelectedIngredient(name, selected)}
              >
                {ingredient}
              </PairingEvidence>
            )}
          </li>
        )
      })}
    </ul>
  )
}
