import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PairingGrid } from "./pairing-grid"
import { PAIRING_PRINT_SHEETS } from "./print-layout"

import "./pairing-print.css"

export function PairingPrint({ title = "이유식 재료 궁합표" }: { title?: string }) {
  return (
    <div className="pairing-print-document">
      {PAIRING_PRINT_SHEETS.map((columns, index) => (
        <section
          key={index}
          className="print-sheet pairing-paper"
          data-paper="A4"
          data-orientation="portrait"
        >
          <header className="pairing-paper-head">
            <p className="pairing-paper-brand">장볼날 · 이유식 재료 노트</p>
            <h2 className="font-heading">{title}</h2>
            <p>
              {index + 1}장 · 기준 재료 {columns.flat().length}개
            </p>
          </header>
          <div className="pairing-paper-columns">
            {columns.map((rows, column) => (
              <PairingGrid key={column} rows={rows} printable />
            ))}
          </div>
          <footer className="pairing-paper-foot">
            <p>{INFANT_PAIRING_COPY.source}</p>
            <p>{INFANT_PAIRING_COPY.limit}</p>
            {columns.some((rows) =>
              rows.some(({ name }) => name === "우유")
            ) && (
              <p>{INFANT_PAIRING_COPY.conflict}</p>
            )}
            <p className="pairing-paper-number">
              {index + 1} / {PAIRING_PRINT_SHEETS.length}
            </p>
          </footer>
        </section>
      ))}
    </div>
  )
}
